import { storage, db } from '@/firebase';
import { arrayRemove, arrayUnion, collection, doc, DocumentChangeType, DocumentReference, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, uploadString, getBlob, getDownloadURL, getBytes, UploadTask, UploadTaskSnapshot } from 'firebase/storage';
import { getUid } from '@/services/auth';
import { getUserdataById } from '@/services/userdata';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import { encode } from 'base64-arraybuffer';
import { useMessagesStore } from '@/stores/messages';
import type { DocumentData, QuerySnapshot } from 'firebase/firestore';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { Message as DBMessage, TextMessage, MediaMessage as MediaDBMessage, FileMessage } from '@/types/db/MessagesTable';
import type { ChatInfo } from '@/services/chat';
import type { Message, MediaMessage } from '@/stores/messages';

export interface AttachFormContent {
	subtitle: MediaDBMessage['subtitle'] | FileMessage['subtitle'];
	files: {
		id: string;
		fileData: File;
		thumbnail: {
			url: string;
			size: number;
		};
		sizes?: MediaDBMessage['images'][number]['sizes'];
	}[];
}

export const chatCol = collection(db, 'chat');

export const fetchMessages = async (messagesRef: QuerySnapshot<DocumentData>) => {
	try {
		let msgSnaps = [] as { changeType: DocumentChangeType; message: DBMessage }[];
		const snapsPromises = [] as Promise<{ changeType: DocumentChangeType; message: Message }>[];

		messagesRef.docChanges().forEach(change => {
			if (change.type === 'added' || change.type === 'modified') {
				const { created_at, ...msgData } = change.doc.data() as DBMessage;
				msgSnaps.unshift({
					changeType: change.type,
					message: {
						created_at: (<Timestamp>created_at).toDate(),
						...JSON.parse(JSON.stringify(msgData))
					}
				});
			}
			// else if (change.type === 'removed') {
			// 	const { deleteMessageById } = useMessagesStore();
			// 	debugger;
			// 	deleteMessageById(change.doc.id);
			// }
		});
		msgSnaps.forEach(({ changeType, message }) => {
			snapsPromises.push(
				(async () =>
					({
						changeType,
						message: await getFullMessageInfo(message)
					} as { changeType: DocumentChangeType; message: Message }))()
			);
		});
		return await Promise.all(snapsPromises);
	} catch (e: unknown) {
		errorHandler(e);
	}
};

export const loadMoreMessages = async (messagesRef: QuerySnapshot<DocumentData>) => {
	try {
		const newDBMessages = [] as DBMessage[];
		const msgPromises = [] as Promise<Message>[];
		messagesRef.forEach(doc => {
			const { created_at, ...msgData } = doc.data() as DBMessage;
			newDBMessages.push({ ...msgData, created_at: (<Timestamp>created_at).toDate() });
		});
		newDBMessages.forEach(m => {
			msgPromises.push(getFullMessageInfo(m) as Promise<Message>);
		});
		return await Promise.all(msgPromises);
	} catch (e: unknown) {
		errorHandler(e);
	}
};

export const getMessageSenderInfo = async (senderId: DBMessage['sender_id']) => {
	try {
		const { displayName, photoURL } = (await getUserdataById(senderId))?.info as UserInfo;
		return { id: senderId, displayName, photoURL } as Message['sender'];
	} catch (e: unknown) {
		errorHandler(e);
	}
};
export const getFullMessageInfo = async (DbMessage: DBMessage) => {
	try {
		let { sender_id, content, ...m } = DbMessage;
		const sender = await getMessageSenderInfo(sender_id);
		if (m.type === 'media') {
			const { subtitle, images } = content as unknown as MediaDBMessage;
			const messageMediaThumb = [] as Promise<string | undefined>[];
			images.forEach(img => {
				messageMediaThumb.push(getMediaMessageThumb(img));
			});
			const thumbURLs = await Promise.all(messageMediaThumb);
			const imagesWithThumb = (images as unknown as MediaMessage['images']).map((img, idx) => {
				img.thumbnail = thumbURLs[idx] as string;
				return img;
			});
			return { ...m, sender, content: { subtitle, images: imagesWithThumb } } as Message;
		}
		return { ...m, sender, content } as Message;
	} catch (e: unknown) {
		errorHandler(e);
	}
};

export const getMediaMessageThumb = async (image: MediaDBMessage['images'][number]) => {
	const thumb = image.thumbnail;
	if (thumb?.fullpath && thumb?.fullpath) {
		try {
			const thumbpath = `${thumb.fullpath.split('/').slice(0, -1).join('/')}/${image.id}_thumb.${thumb.fullname.split('.').slice(1).join('.')}`;
			const blobFile = await getBytes(storageRef(storage, thumbpath));
			if (blobFile) {
				return `data:${image.type};base64,${encode(blobFile)}`;
			}
		} catch (e: unknown) {
			errorHandler(e);
		}
	}
};

export const loadImagebyFullpath = async (image: MediaMessage['images'][number]) => {
	if (image.fullpath) {
		try {
			const blobFile = await getBlob(storageRef(storage, image.fullpath));
			if (blobFile) {
				return URL.createObjectURL(blobFile);
			}
		} catch (e: unknown) {
			errorHandler(e);
		}
	}
};

export const createMessage = async (chatId: ChatInfo['id'], type: Message['type'], content: TextMessage | AttachFormContent) => {
	try {
		const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
		let attachDBContent: MediaDBMessage | FileMessage | null = null;

		// Get images thumbs and Doc ref to prospective image upload
		if (type === 'media') {
			const { subtitle, files } = content as AttachFormContent;
			attachDBContent = { subtitle, images: await uploadMedia(chatId, messageRef, files) } as MediaDBMessage;
		} else if (type === 'file') {
			const { subtitle, files } = content as AttachFormContent;
			attachDBContent = { subtitle, files: await uploadFile(chatId, messageRef.id, files) } as FileMessage;
		}

		// Add full message data to DB
		await setDoc(messageRef, {
			id: messageRef.id,
			type,
			content: (attachDBContent as MediaDBMessage | FileMessage) || (content as TextMessage),
			created_at: Timestamp.now(),
			sender_id: await getUid()
		});
	} catch (e: unknown) {
		errorHandler(e);
	}
};

const uploadMedia = async <T extends MediaDBMessage['images']>(
	chatId: ChatInfo['id'],
	messageRef: DocumentReference<DocumentData>,
	images: AttachFormContent['files']
) => {
	try {
		if (images.every(f => f.fileData instanceof File)) {
			const docRefPromises = [] as Promise<T[number]>[];
			for (const img of images) {
				docRefPromises.push(
					(async () => {
						const { fileData, id, thumbnail, ...data } = img;
						const thumbData = (await uploadThumb(chatId, messageRef.id, img)) as T[number]['thumbnail'];

						const mediaContent = {
							id,
							type: fileData.type,
							fullname: fileData.name,
							fullsize: fileData.size,
							thumbnail: thumbData,
							...data
						} as T[number];

						createUploadTask(chatId, messageRef, img, mediaContent);

						return mediaContent;
					})()
				);
			}
			return await Promise.all(docRefPromises);
		}
	} catch (e: unknown) {
		errorHandler(e);
	}
};

const createUploadTask = (chatId: ChatInfo['id'], messageRef: DocumentReference<DocumentData>, file: AttachFormContent['files'][number], DBcontent: object) => {
	const { fileData, id } = file;
	const imageRef = storageRef(storage, `chat/${chatId}/messageData/${messageRef.id}/${id + '.' + fileData.name.split('.').slice(1).join('.')}`);
	const uploadTask = uploadBytesResumable(imageRef, fileData, {
		contentType: fileData.type
	});

	uploadTask.on(
		'state_changed',
		snapshot => {
			// Observe state change events such as progress, pause, and resume
			// Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
			const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
			console.log('Upload is ' + progress + '% done');
			switch (snapshot.state) {
				case 'paused':
					console.log('Upload is paused');
					break;
				case 'running':
					console.log('Upload is running');
					break;
			}
		},
		error => {
			// Handle unsuccessful uploads
			console.error(error);
			switch (error.code) {
				case 'storage/unauthorized':
					// User doesn't have permission to access the object
					break;
				case 'storage/canceled':
					// User canceled the upload
					break;
				case 'storage/unknown':
					// Unknown error occurred, inspect error.serverResponse
					break;
			}
		},
		async () => {
			// Handle successful uploads on complete
			const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
			const batch = writeBatch(db);
			batch.update(messageRef, {
				'content.images': arrayRemove(DBcontent)
			});
			batch.update(messageRef, {
				'content.images': arrayUnion({
					...DBcontent,
					...{
						bucket: uploadTask.snapshot.ref.bucket,
						fullpath: uploadTask.snapshot.ref.fullPath,
						downloadURL
					}
				})
			});
			await batch.commit();
		}
	);
};

const uploadThumb = async <T extends MediaDBMessage['images'][number]['thumbnail']>(
	chatId: ChatInfo['id'],
	messageId: Message['id'],
	image: AttachFormContent['files'][number]
) => {
	try {
		const { fileData, id, thumbnail } = image;
		const thumbRef = storageRef(storage, `chat/${chatId}/messageData/${messageId}/${id + '_thumb.' + fileData.name.split('.').slice(1).join('.')}`);
		await uploadString(thumbRef, thumbnail.url, 'data_url');
		return {
			fullname: thumbRef.name,
			fullpath: thumbRef.fullPath,
			size: thumbnail.size
		} as T;
	} catch (e: unknown) {
		errorHandler(e);
	}
};

const uploadFile = async <T extends FileMessage>(chatId: ChatInfo['id'], messageId: Message['id'], files: AttachFormContent['files']) => {
	try {
		if (files.every(f => f.fileData instanceof File)) {
			const promises = <Promise<T['files'][number]>[]>[];
			for (const file of files) {
				promises.push(
					(async () => {
						const { fileData, id } = file;
						const fileRef = storageRef(storage, `chat/${chatId}/messageData/${messageId}/${id + '.' + fileData.name.split('.').slice(1).join('.')}`);
						const task = await uploadBytesResumable(fileRef, fileData, {
							contentType: fileData.type
						});
						return {
							id,
							type: fileData.type,
							bucket: fileRef.bucket,
							fullname: fileData.name,
							fullpath: fileRef.fullPath,
							downloadURL: await getDownloadURL(fileRef),
							fullsize: fileData.size
						} as T['files'][number];
					})()
				);
			}
			return await Promise.all(promises);
		}
	} catch (e: unknown) {
		errorHandler(e);
	}
};
