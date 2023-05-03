import { storage, db } from '@/firebase';
import { arrayRemove, arrayUnion, collection, doc, setDoc, Timestamp, writeBatch, deleteDoc, onSnapshot, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { limit, query, orderBy, startAfter } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, uploadString, getBlob, getDownloadURL, getBytes, deleteObject } from 'firebase/storage';
import { getUid } from '@/services/auth';
import { getUserdataById } from '@/services/userdata';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import { encode } from 'base64-arraybuffer';
import { storeToRefs } from 'pinia';
import { useMessagesStore } from '@/stores/messages';
import { useLoadingStore } from '@/stores/loading';
import type { DocumentReference, DocumentData, DocumentChange } from 'firebase/firestore';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { Message as DBMessage, TextMessage, MediaMessage as MediaDBMessage, FileMessage as FileDBMessage } from '@/types/db/MessagesTable';
import type { ChatInfo } from '@/services/chat';
import type { Message, MediaMessage, FileMessage, LastVisibleFbRef, Direction } from '@/stores/messages';
import { EditMessageData } from '@/components/chat/form/MessageForm.vue';

export interface AttachFormContent {
	subtitle: MediaDBMessage['subtitle'] | FileMessage['subtitle'];
	files: {
		id: string;
		fileData: File;
		thumbnail?: {
			url: string;
			size: number;
		};
		sizes?: MediaDBMessage['images'][number]['sizes'];
	}[];
}

const chatCol = collection(db, 'chat');

export const fetchChatMessages = async (chatId: ChatInfo['id'], lmt: number = 10) => {
	try {
		const messagesStore = useMessagesStore();
		const { addMessage, modifyMessage } = messagesStore;
		const { lastVisible } = storeToRefs(messagesStore);
		const messagesCol = collection(doc(chatCol, chatId), 'messages');
		const q = query(messagesCol, orderBy('created_at', 'desc'), limit(lmt));
		return onSnapshot(q, async messagesRef => {
			const dbMessagesPromises = [] as Promise<{ message: Message | undefined; changeType: DocumentChange['type'] } | undefined>[];

			messagesRef.docChanges().forEach(change => {
				const { created_at, ...msgData } = change.doc.data() as DBMessage;
				if (change.type === 'added' || change.type === 'modified') {
					dbMessagesPromises.unshift(
						(async () => ({
							message: await getFullMessageInfo({ ...msgData, created_at: (<Timestamp>created_at).toDate() }),
							changeType: change.type
						}))()
					);
				}
			});
			(await Promise.all(dbMessagesPromises))?.forEach(m => {
				if (m?.changeType === 'added') {
					addMessage(m.message as Message, 'end');
				} else if (m?.changeType === 'modified') {
					modifyMessage(m.message as Message);
				}
			});
			if (messagesRef.size >= lmt) {
				lastVisible.value.top = messagesRef.docs[messagesRef.docs.length - 1];
			}
		});
	} catch (e) {
		errorHandler(e);
	}
};

export const loadMoreChatMessages = async (chatId: ChatInfo['id'], direction: Direction, perPage: number = 10) => {
	try {
		const messagesStore = useMessagesStore();
		const { addMessage, deleteMessages } = messagesStore;
		const { messages, lastVisible } = storeToRefs(messagesStore);
		if (lastVisible.value[direction]) {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(messagesCol, orderBy('created_at', direction === 'top' ? 'desc' : 'asc'), startAfter(lastVisible.value[direction]), limit(perPage));
			const messagesRef = await getDocs(q);
			if (messagesRef.empty) {
				lastVisible.value[direction] = null;
				return;
			}
			if (messages.value.length > 40) {
				deleteMessages(perPage, direction === 'top' ? 'end' : 'start');
				const msgBeforeDel = await getDoc(doc(messagesCol, messages.value.at(direction === 'top' ? -1 : 0)?.id));
				lastVisible.value[direction === 'top' ? 'bottom' : 'top'] = msgBeforeDel as LastVisibleFbRef[Direction];
			}
			const dbMessagesPromises = [] as Promise<Message | undefined>[];

			messagesRef.forEach(doc => {
				const { created_at, ...msgData } = doc.data() as DBMessage;
				dbMessagesPromises.push(getFullMessageInfo({ ...msgData, created_at: (<Timestamp>created_at).toDate() }));
			});
			(await Promise.all(dbMessagesPromises)).forEach(m => {
				if (m) addMessage(m, direction === 'top' ? 'start' : 'end');
			});
			lastVisible.value[direction] = messagesRef.size >= perPage ? messagesRef.docs[messagesRef.docs.length - 1] : null;
		}
	} catch (e) {
		errorHandler(e);
	}
};

export const getMessageSenderInfo = async (senderId: DBMessage['sender_id']) => {
	try {
		const { displayName, photoURL } = (await getUserdataById(senderId))?.info as UserInfo;
		return { id: senderId, displayName, photoURL } as Message['sender'];
	} catch (e) {
		errorHandler(e);
	}
};
export const getFullMessageInfo = async (DbMessage: DBMessage) => {
	try {
		let { sender_id, content, ...m } = DbMessage;
		const sender = await getMessageSenderInfo(sender_id);
		if (m.type === 'media') {
			const messageMediaThumb = [] as Promise<{ [id: string]: string }>[];
			const { subtitle, images } = content as MediaDBMessage;
			images.forEach(img => {
				messageMediaThumb.push(
					(async () => {
						return {
							[img.id]: (await getMessageThumb(img)) as string
						} as { [id: string]: string };
					})()
				);
			});
			const thumbURLs = Object.assign({}, ...(await Promise.all(messageMediaThumb)));
			const imagesWithThumb = (images as unknown as MediaMessage['images']).map(img => {
				img.thumbnail = thumbURLs[img.id];
				return img;
			});
			return { ...m, sender, content: { subtitle, images: imagesWithThumb } } as Message;
		} else if (m.type === 'file') {
			const { subtitle, files } = content as FileDBMessage;
			const messageFileThumb = [] as Promise<{ [id: string]: string }>[];
			files.forEach(file => {
				if (file.type.startsWith('image/'))
					messageFileThumb.push(
						(async () => {
							return {
								[file.id]: (await getMessageThumb(file)) as string
							} as { [id: string]: string };
						})()
					);
			});
			const thumbURLs = Object.assign({}, ...(await Promise.all(messageFileThumb)));
			const filesWithThumb = (files as FileMessage['files']).map(file => {
				if (thumbURLs[file.id]) file.thumbnail = thumbURLs[file.id];
				return file;
			});
			return { ...m, sender, content: { subtitle, files: filesWithThumb } } as Message;
		}
		return { ...m, sender, content } as Message;
	} catch (e) {
		errorHandler(e);
	}
};

export const getMessageThumb = async (file: MediaDBMessage['images'][number] | FileDBMessage['files'][number]) => {
	const thumb = file.thumbnail;
	if (thumb?.fullpath && thumb?.fullpath) {
		try {
			const thumbpath = `${thumb.fullpath.split('/').slice(0, -1).join('/')}/${file.id}_thumb.${thumb.fullname.split('.').slice(1).join('.')}`;
			const blobFile = await getBytes(storageRef(storage, thumbpath));
			if (blobFile) {
				return `data:${file.type};base64,${encode(blobFile)}`;
			}
		} catch (e) {
			errorHandler(e);
		}
	}
};

export const loadImagebyFullpath = async (image: MediaMessage['images'][number]) => {
	try {
		if (image.fullpath) {
			const blobFile = await getBlob(storageRef(storage, image.fullpath));
			if (blobFile) {
				return URL.createObjectURL(blobFile);
			}
		}
	} catch (e) {
		errorHandler(e);
	}
};

export const createMessage = async (chatId: ChatInfo['id'], type: Message['type'], content: TextMessage | AttachFormContent) => {
	try {
		const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
		let attachDBContent: MediaDBMessage | FileDBMessage | null = null;

		// Get images thumbs and Doc ref to prospective image upload
		if (type === 'media') {
			const { subtitle, files: images } = content as AttachFormContent;
			attachDBContent = { subtitle, images: await uploadMedia(chatId, messageRef, images) } as MediaDBMessage;
		} else if (type === 'file') {
			const { subtitle, files } = content as AttachFormContent;
			attachDBContent = { subtitle, files: await uploadFiles(chatId, messageRef, files) } as FileDBMessage;
		}
		// Add full message data to DB
		await setDoc(messageRef, {
			id: messageRef.id,
			type,
			content: (attachDBContent as MediaDBMessage | FileMessage) || (content as TextMessage),
			created_at: Timestamp.now(),
			sender_id: await getUid()
		});
	} catch (e) {
		errorHandler(e);
	}
};
export const updateMessageContent = async (chatId: ChatInfo['id'], { id: mId, type: mType, content }: EditMessageData) => {
	try {
		const messageRef = doc(collection(doc(chatCol, chatId), 'messages'), mId);
		// Rewrite text content data to DB
		const textContent = { ['content.' + (mType === 'text' ? 'text' : 'subtitle')]: (content as TextMessage).text };
		await updateDoc(messageRef, textContent);
	} catch (e) {
		errorHandler(e);
	}
};

const uploadMedia = async <T extends MediaDBMessage['images']>(chatId: ChatInfo['id'], messageRef: DocumentReference<DocumentData>, images: AttachFormContent['files']) => {
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

						createUploadTask(chatId, messageRef, 'media', img, mediaContent);

						return mediaContent;
					})()
				);
			}
			return await Promise.all(docRefPromises);
		}
	} catch (e) {
		errorHandler(e);
	}
};

const createUploadTask = (
	chatId: ChatInfo['id'],
	messageRef: DocumentReference<DocumentData>,
	messageType: 'file' | 'media',
	file: AttachFormContent['files'][number],
	DBcontentToUpdate: MediaDBMessage['images'][number] | FileDBMessage['files'][number]
) => {
	const { setUploading, updateLoading, finishLoading } = useLoadingStore();
	const { fileData, id: fileId } = file;
	const fileRef = storageRef(storage, `chat/${chatId}/messageData/${messageRef.id}/${fileId + '.' + fileData.name.split('.').slice(1).join('.')}`);
	const uploadTask = uploadBytesResumable(fileRef, fileData, {
		contentType: fileData.type
	});
	setUploading(fileId, uploadTask);
	uploadTask.on(
		'state_changed',
		snapshot => {
			// Observe state change events such as progress, pause, and resume
			// Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
			const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
			console.log('Upload is ' + progress + '% done');
			updateLoading(fileId, progress);
			switch (snapshot.state) {
				case 'paused':
					console.log('Upload is paused');
					break;
				case 'running':
					console.log('Upload is running');
					break;
			}
		},
		async error => {
			try {
				finishLoading(fileId);
				// Handle unsuccessful uploads
				await deleteDoc(messageRef);
				await deleteObject(storageRef(storage, DBcontentToUpdate.thumbnail?.fullpath));
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
				throw error;
			} catch (e) {
				console.error(e);
			}
		},
		async () => {
			try {
				// Handle successful uploads on complete
				const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
				const batch = writeBatch(db);
				const fieldToUpdate = `content.${messageType === 'media' ? 'images' : 'files'}`;
				batch.update(messageRef, {
					[fieldToUpdate]: arrayRemove(DBcontentToUpdate)
				});
				batch.update(messageRef, {
					[fieldToUpdate]: arrayUnion({
						...DBcontentToUpdate,
						...{
							bucket: uploadTask.snapshot.ref.bucket,
							fullpath: uploadTask.snapshot.ref.fullPath,
							downloadURL
						}
					})
				});
				await batch.commit();
				finishLoading(fileId);
			} catch (e) {
				errorHandler(e);
			}
		}
	);
};

const uploadThumb = async <T extends MediaDBMessage['images'][number]['thumbnail'] | FileDBMessage['files'][number]['thumbnail']>(
	chatId: ChatInfo['id'],
	messageId: Message['id'],
	image: AttachFormContent['files'][number]
) => {
	try {
		if (image.thumbnail) {
			const { fileData, id, thumbnail } = image;
			const thumbRef = storageRef(storage, `chat/${chatId}/messageData/${messageId}/${id + '_thumb.' + fileData.name.split('.').slice(1).join('.')}`);
			await uploadString(thumbRef, thumbnail.url, 'data_url');
			return {
				fullname: thumbRef.name,
				fullpath: thumbRef.fullPath,
				size: thumbnail.size
			} as T;
		}
	} catch (e) {
		errorHandler(e);
	}
};

const uploadFiles = async <T extends FileDBMessage['files']>(chatId: ChatInfo['id'], messageRef: DocumentReference<DocumentData>, files: AttachFormContent['files']) => {
	try {
		if (files.every(f => f.fileData instanceof File)) {
			const docRefPromises = [] as Promise<T[number]>[];
			for (const file of files) {
				docRefPromises.push(
					(async () => {
						const { fileData, id, thumbnail, sizes, ...data } = file;
						let fileContent = {
							id,
							type: fileData.type,
							fullname: fileData.name,
							fullsize: fileData.size,
							...data
						} as T[number];
						if (file.fileData.type.startsWith('image/') && sizes && thumbnail) {
							const thumbData = (await uploadThumb(chatId, messageRef.id, file)) as T[number]['thumbnail'];
							fileContent = {
								...fileContent,
								sizes,
								thumbnail: thumbData
							} as T[number];
						}
						createUploadTask(chatId, messageRef, 'file', file, fileContent);
						return fileContent;
					})()
				);
			}
			return await Promise.all(docRefPromises);
		}
	} catch (e) {
		errorHandler(e);
	}
};
