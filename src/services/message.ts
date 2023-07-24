import { storage, db } from '@/firebase';
import {
	arrayRemove,
	arrayUnion,
	collection,
	doc,
	setDoc,
	Timestamp,
	writeBatch,
	deleteDoc,
	onSnapshot,
	getDoc,
	getDocs,
	updateDoc
} from 'firebase/firestore';
import { limit, query, orderBy, startAfter } from 'firebase/firestore';
import {
	ref as storageRef,
	uploadBytesResumable,
	uploadString,
	getBlob,
	getDownloadURL,
	getBytes,
	deleteObject
} from 'firebase/storage';
import { getUid } from '@/services/auth';
import { getUserdataById } from '@/services/userdata';
import { fbErrorHandler as errorHandler } from '@/services/errorHandler';
import { encode } from 'base64-arraybuffer';
import { storeToRefs } from 'pinia';
import { useMessagesStore, Message, LastVisibleFbRef, Direction } from '@/stores/messages';
import { useLoadingStore } from '@/stores/loading';
import { DocumentReference, DocumentData, DocumentChange } from 'firebase/firestore';
import { UserInfo } from '@/types/db/UserdataTable';
import { Message as DBMessage, MessageAttachment, MessageContent } from '@/types/db/MessagesTable';
import { ChatInfo } from '@/services/chat';
import { EditMessageData } from '@/components/chat/form/MessageForm.vue';

export interface AttachFormContent {
	text: MessageContent['text'];
	attachments: {
		id: string;
		fileData: File;
		thumbnail?: {
			url: string;
			fullsize: Required<MessageAttachment>['thumbnail']['fullsize'];
		};
		sizes?: MessageAttachment['raw']['sizes'];
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
			const dbMessagesPromises = [] as Promise<
				{ message: Message | undefined; changeType: DocumentChange['type'] } | undefined
			>[];

			messagesRef.docChanges().forEach(change => {
				const { created_at, ...msgData } = change.doc.data() as DBMessage;
				if (change.type === 'added' || change.type === 'modified') {
					dbMessagesPromises.unshift(
						(async () => ({
							message: await getFullMessageInfo({
								...msgData,
								created_at: (<Timestamp>created_at).toDate()
							}),
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

export const loadMoreChatMessages = async (
	chatId: ChatInfo['id'],
	direction: Direction,
	perPage: number = 10
) => {
	try {
		const messagesStore = useMessagesStore();
		const { addMessage, deleteMessages } = messagesStore;
		const { messages, lastVisible } = storeToRefs(messagesStore);
		if (lastVisible.value[direction]) {
			const messagesCol = collection(doc(chatCol, chatId), 'messages');
			const q = query(
				messagesCol,
				orderBy('created_at', direction === 'top' ? 'desc' : 'asc'),
				startAfter(lastVisible.value[direction]),
				limit(perPage)
			);
			const messagesRef = await getDocs(q);
			if (messagesRef.empty) {
				lastVisible.value[direction] = null;
				return;
			}
			// if (messages.value.length > 40) {
			// 	deleteMessages(perPage, direction === 'top' ? 'end' : 'start');
			// 	const msgBeforeDel = await getDoc(doc(messagesCol, messages.value.at(direction === 'top' ? -1 : 0)?.id));
			// 	lastVisible.value[direction === 'top' ? 'bottom' : 'top'] = msgBeforeDel as LastVisibleFbRef[Direction];
			// }
			const dbMessagesPromises = [] as Promise<Message | undefined>[];

			messagesRef.forEach(doc => {
				const { created_at, ...msgData } = doc.data() as DBMessage;
				dbMessagesPromises.push(
					getFullMessageInfo({ ...msgData, created_at: (<Timestamp>created_at).toDate() })
				);
			});
			(await Promise.all(dbMessagesPromises)).forEach(m => {
				if (m) addMessage(m, direction === 'top' ? 'start' : 'end');
			});
			lastVisible.value[direction] =
				messagesRef.size >= perPage ? messagesRef.docs[messagesRef.docs.length - 1] : null;
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
		if (m.type !== 'text' && content.attachments?.length) {
			const { text, attachments } = content as MessageContent;
			const messageFileThumb = [] as Promise<{ [id: string]: string }>[];
			attachments?.forEach(file => {
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
			const attachWithThumb = attachments?.map(file => {
				if (thumbURLs[file.id]) file.thumbnail = thumbURLs[file.id];
				return file;
			}) as unknown as Message['content']['attachments'];
			return { ...m, sender, content: { text, attachments: attachWithThumb } } as Message;
		}
		return { ...m, sender, content: { text: content.text } } as Message;
	} catch (e) {
		errorHandler(e);
	}
};

export const getMessageThumb = async (file: MessageAttachment) => {
	const thumb = file.thumbnail;
	if (thumb?.fullpath) {
		try {
			const blobFile = await getBytes(storageRef(storage, thumb.fullpath));
			if (blobFile) {
				return `data:${file.type};base64,${encode(blobFile)}`;
			}
		} catch (e) {
			errorHandler(e);
		}
	}
};

export const loadPreviewbyFullpath = async (rawFile: MessageAttachment['raw']) => {
	try {
		if (rawFile.fullpath) {
			const blobFile = await getBlob(storageRef(storage, rawFile.fullpath));
			if (blobFile) {
				return URL.createObjectURL(blobFile);
			}
		}
	} catch (e) {
		errorHandler(e);
	}
};

export const createMessage = async (
	chatId: ChatInfo['id'],
	type: Message['type'],
	content: Partial<AttachFormContent>
) => {
	try {
		const messageRef = doc(collection(doc(chatCol, chatId), 'messages'));
		let attachDBContent: MessageAttachment | null = null;

		// Get images thumbs and Doc ref to prospective image upload
		const { text, attachments } = content as AttachFormContent;
		if (attachments && attachments.length) {
			attachDBContent = {
				text,
				attachments: await uploadAttachments(chatId, messageRef, attachments)
			} as unknown as MessageAttachment;
		}
		// Add full message data to DB
		await setDoc(messageRef, {
			id: messageRef.id,
			type,
			content: attachDBContent || { text },
			created_at: Timestamp.now(),
			sender_id: await getUid()
		});
	} catch (e) {
		errorHandler(e);
	}
};
export const updateMessageContent = async (
	chatId: ChatInfo['id'],
	{ id: mId, type: mType, content }: EditMessageData
) => {
	try {
		const messageRef = doc(collection(doc(chatCol, chatId), 'messages'), mId);
		// Rewrite text content data to DB
		const textContent = { ['content.' + (mType === 'text' ? 'text' : 'subtitle')]: content.text };
		await updateDoc(messageRef, textContent);
	} catch (e) {
		errorHandler(e);
	}
};

const createUploadTask = (
	chatId: ChatInfo['id'],
	messageRef: DocumentReference<DocumentData>,
	file: AttachFormContent['attachments'][number],
	DBcontentToUpdate: Partial<MessageAttachment>
) => {
	const { setUploading, updateLoading, finishLoading } = useLoadingStore();
	const { fileData, id: fileId } = file;
	const fileRef = storageRef(
		storage,
		`chat/${chatId}/messageData/${messageRef.id}/${
			fileId + '.' + fileData.name.split('.').slice(1).join('.')
		}`
	);
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
				batch.update(messageRef, {
					'content.attachments': arrayRemove(DBcontentToUpdate)
				});
				batch.update(messageRef, {
					'content.attachments': arrayUnion({
						...DBcontentToUpdate,
						raw: {
							bucket: uploadTask.snapshot.ref.bucket,
							fullpath: uploadTask.snapshot.ref.fullPath,
							sizes: file.sizes,
							fullsize: fileData.size,
							downloadURL
						}
					} as MessageAttachment)
				});
				await batch.commit();
				finishLoading(fileId);
			} catch (e) {
				errorHandler(e);
			}
		}
	);
};

const uploadThumb = async <T extends MessageAttachment['thumbnail']>(
	chatId: ChatInfo['id'],
	messageId: Message['id'],
	attach: AttachFormContent['attachments'][number]
) => {
	try {
		if (attach.thumbnail) {
			const { fileData, id, thumbnail } = attach;
			const thumbRef = storageRef(
				storage,
				`chat/${chatId}/messageData/${messageId}/${
					id + '_thumb.' + fileData.name.split('.').slice(1).join('.')
				}`
			);
			await uploadString(thumbRef, thumbnail.url, 'data_url');
			return {
				bucket: thumbRef.bucket,
				fullpath: thumbRef.fullPath,
				fullsize: thumbnail.fullsize
			} as T;
		}
	} catch (e) {
		errorHandler(e);
	}
};

const uploadAttachments = async <T extends MessageAttachment>(
	chatId: ChatInfo['id'],
	messageRef: DocumentReference<DocumentData>,
	attach: AttachFormContent['attachments']
) => {
	try {
		if (attach.every(file => file.fileData instanceof File)) {
			const docRefPromises = [] as Promise<Partial<T>>[];
			for (const file of attach) {
				docRefPromises.push(
					(async () => {
						const { fileData, id, thumbnail, sizes } = file;
						let attachContent = {
							id,
							type: fileData.type,
							fullname: fileData.name,
							raw: { sizes, fullsize: fileData.size }
						} as Partial<T>;
						if (file.fileData.type.startsWith('image/') && sizes && thumbnail) {
							const thumbData = (await uploadThumb(
								chatId,
								messageRef.id,
								file
							)) as T['thumbnail'];
							attachContent = {
								...attachContent,
								thumbnail: thumbData
							} as Partial<T>;
						}
						createUploadTask(chatId, messageRef, file, attachContent);
						return attachContent;
					})()
				);
			}
			return (await Promise.all(docRefPromises)) as Awaited<T>;
		}
	} catch (e) {
		errorHandler(e);
	}
};
