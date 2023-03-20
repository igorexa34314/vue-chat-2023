import { storage, db } from '@/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getBlob, getDownloadURL, getBytes } from 'firebase/storage';
import { getUid } from '@/services/auth';
import { getUserdataById } from '@/services/userdata';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import { encode } from 'base64-arraybuffer';
import type { DocumentData, QuerySnapshot } from 'firebase/firestore';
import type { UserInfo } from '@/types/db/UserdataTable';
import type { Message as DBMessage, TextMessage, MediaMessage, FileMessage } from '@/types/db/MessagesTable';
import type { ChatInfo } from '@/services/chat';
import type { Message } from '@/stores/messages';

export interface AttachFormContent {
	subtitle: MediaMessage['subtitle'] | FileMessage['subtitle'];
	files: {
		id: string;
		fileData: File;
		sizes?: MediaMessage['images'][number]['sizes'];
	}[];
}

export const chatCol = collection(db, 'chat');

export const createMessage = async (chatId: ChatInfo['id'], type: Message['type'], content: TextMessage | AttachFormContent) => {
	try {
		const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
		let attachContent: MediaMessage | FileMessage | null = null;
		if (type === 'media') {
			attachContent = (await uploadMedia(chatId, messageRef.id, content as AttachFormContent)) as MediaMessage;
		} else if (type === 'file') {
			attachContent = (await uploadFile(chatId, messageRef.id, content as AttachFormContent)) as FileMessage;
		}
		await setDoc(messageRef, {
			id: messageRef.id,
			type,
			content: attachContent || content,
			created_at: Timestamp.fromDate(new Date()),
			sender_id: await getUid()
		});
	} catch (e: unknown) {
		errorHandler(e);
	}
};

export const fetchMessages = async (messagesRef: QuerySnapshot<DocumentData>) => {
	try {
		const initialMessages = [] as DBMessage[];
		const promises = [] as Promise<Message>[];

		messagesRef.docChanges().forEach(change => {
			const { created_at, ...msgData } = change.doc.data() as DBMessage;
			if (change.type === 'added') {
				initialMessages.unshift({ ...msgData, created_at: (<Timestamp>created_at).toDate() });
			}
		});
		initialMessages.forEach(m => {
			promises.push(getFullMessageInfo(m) as Promise<Message>);
		});
		return await Promise.all(promises);
	} catch (e: unknown) {
		errorHandler(e);
	}
};

export const loadMoreMessages = async (messagesRef: QuerySnapshot<DocumentData>) => {
	try {
		const initialMessages = [] as DBMessage[];
		const promises = [] as Promise<Message>[];
		messagesRef.forEach(doc => {
			const { created_at, ...msgData } = doc.data() as DBMessage;
			initialMessages.push({ ...msgData, created_at: (<Timestamp>created_at).toDate() });
		});
		initialMessages.forEach(m => {
			promises.push(getFullMessageInfo(m) as Promise<Message>);
		});
		return await Promise.all(promises);
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
			const { images } = content as MediaMessage;
			const messageMediaThumb = [] as Promise<string | undefined>[];
			images.forEach(img => {
				messageMediaThumb.push(getMediaMessageImagePlaceholder(img));
			});
			const thumbURLs = await Promise.all(messageMediaThumb);
			(content as MediaMessage).images = images.map((img, idx) => {
				img.thumbnail = thumbURLs[idx];
				return img;
			});
		}
		return { ...m, sender, content } as Message;
	} catch (e: unknown) {
		errorHandler(e);
	}
};

export const getMediaMessageImagePlaceholder = async (image: MediaMessage['images'][number]) => {
	if (image.fullpath && image.fullname) {
		try {
			const thumbpath = `${image.fullpath.split('/').slice(0, -1).join('/')}/${image.id}_40x40.${image.fullname.split('.').slice(1).join('.')}`;
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

const uploadMedia = async <T extends MediaMessage>(chatId: ChatInfo['id'], messageId: Message['id'], { subtitle, files }: AttachFormContent) => {
	try {
		if (files.every(f => f.fileData instanceof File)) {
			const promises = <Promise<T['images'][number]>[]>[];
			for (const file of files) {
				promises.push(
					(async () => {
						const { fileData, id, ...data } = file;
						const imageRef = storageRef(storage, `chat/${chatId}/messageData/${messageId}/${id + '.' + fileData.name.split('.').slice(1).join('.')}`);
						const task = await uploadBytesResumable(imageRef, fileData, {
							contentType: fileData.type
						});
						return {
							id,
							type: fileData.type,
							fullname: fileData.name,
							bucket: imageRef.bucket,
							fullpath: imageRef.fullPath,
							fullsize: fileData.size,
							downloadURL: await getDownloadURL(imageRef),
							...data
						} as T['images'][number];
					})()
				);
			}
			return {
				subtitle,
				images: await Promise.all(promises)
			} as Awaited<T>;
		}
	} catch (e: unknown) {
		errorHandler(e);
	}
};

const uploadFile = async <T extends FileMessage>(chatId: ChatInfo['id'], messageId: Message['id'], { subtitle, files }: AttachFormContent) => {
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
			return {
				subtitle,
				files: await Promise.all(promises)
			} as Awaited<T>;
		}
	} catch (e: unknown) {
		errorHandler(e);
	}
};
