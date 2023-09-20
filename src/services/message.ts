import { timestampToDate } from './../utils/helpers';
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
	getDocs,
	updateDoc,
	limit,
	query,
	orderBy,
	startAfter,
	CollectionReference,
} from 'firebase/firestore';
import {
	ref as storageRef,
	uploadBytesResumable,
	uploadString,
	getBlob,
	getDownloadURL,
	getBytes,
	deleteObject,
} from 'firebase/storage';
import { AuthService } from '@/services/auth';
import { PublicUserInfo, UserService } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { encode } from 'base64-arraybuffer';
import { storeToRefs } from 'pinia';
import { useMessagesStore, Direction } from '@/stores/messages';
import { useLoadingStore } from '@/stores/loading';
import { DocumentReference, DocumentData } from 'firebase/firestore';
import {
	AttachmentType,
	ContentType,
	Message as DBMessage,
	MessageAttachment as DBMessageAttachment,
	MessageContent as DBMessageContent,
} from '@/types/db/MessagesTable';
import { ChatInfo, ChatService } from '@/services/chat';
import { EditMessageData } from '@/components/chat/form/MessageForm.vue';
import { ParsedTimestamps } from '@/types/db/helpers';
import { ThumbResult } from '@/utils/resizeFile';

export interface Message extends Omit<ParsedTimestamps<DBMessage>, 'sender_id' | 'content'> {
	content: MessageContent;
	sender: PublicUserInfo;
}

export type MessageContent<T extends ContentType = ContentType> = T extends AttachmentType
	? Omit<DBMessageContent, 'attachments'> & {
			attachments: MessageAttachment[];
	  }
	: Omit<DBMessageContent, 'attachments'>;

export interface MessageAttachment<T extends AttachmentType = AttachmentType>
	extends Omit<DBMessageAttachment<T>, 'thumbnail'> {
	thumbnail: T extends 'media' ? string | null : never;
	raw: DBMessageAttachment<T>['raw'] & { previewURL?: T extends 'media' ? string : never };
}

export type MediaAttachment = MessageAttachment<'media'>;
export type FileAttachment = MessageAttachment<'file'>;

export interface CreateMsgForm<T extends ContentType = ContentType> extends Pick<MessageContent, 'text' | 'type'> {
	type: T;
	attachments: T extends AttachmentType ? FormAttachment<T>[] : never;
}

export type FormAttachment<T extends AttachmentType = AttachmentType> = {
	id: string;
	fileData: File;
} & (T extends 'file'
	? {}
	: {
			thumbnail: ThumbResult;
			sizes: DBMessageAttachment<'media'>['raw']['sizes'];
	  });

export class MessagesService {
	private static getMessagesCol(chatId: ChatInfo['id']) {
		return collection(doc(ChatService.chatCol, chatId), 'messages') as CollectionReference<DBMessage>;
	}

	static async fetchMessages(chatId: ChatInfo['id'], lmt: number = 10) {
		const messagesStore = useMessagesStore();
		const { addMessage, modifyMessage, deleteMessageById } = messagesStore;
		const { lastVisible, isLoading } = storeToRefs(messagesStore);
		const messagesCol = this.getMessagesCol(chatId);
		const q = query(messagesCol, orderBy('created_at', 'desc'), limit(lmt));
		isLoading.value = true;
		return onSnapshot(q, async messagesRef => {
			try {
				const snapshots = await Promise.all(
					messagesRef.docChanges().map(async change => {
						const msgData = change.doc.data();
						if (change.type === 'added' || change.type === 'modified') {
							return {
								message: await this.getFullMessageInfo(msgData),
								changeType: change.type,
							};
						}
						return {
							message: { id: msgData.id },
							changeType: change.type,
						};
					})
				);
				snapshots.reverse().forEach(snap => {
					console.log(snap.changeType);

					if (snap.changeType === 'added') {
						addMessage(snap.message, 'end');
					} else if (snap.changeType === 'modified') {
						modifyMessage(snap.message);
					} else {
						deleteMessageById(snap.message.id);
					}
				});
				if (messagesRef.size >= lmt) {
					lastVisible.value.top = messagesRef.docs[messagesRef.docs.length - 1];
				}
			} catch (err) {
				return errorHandler(err);
			} finally {
				if (isLoading.value) {
					isLoading.value = false;
				}
			}
		});
	}

	static async loadMoreMessages(chatId: ChatInfo['id'], direction: Direction, perPage: number = 10) {
		const messagesStore = useMessagesStore();
		const { addMessage, deleteMessages } = messagesStore;
		const { lastVisible } = storeToRefs(messagesStore);
		if (lastVisible.value[direction]) {
			try {
				const messagesCol = this.getMessagesCol(chatId);
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
				const dbMessagesPromises: Promise<Message>[] = [];

				messagesRef.forEach(doc => {
					const messageData = doc.data();
					dbMessagesPromises.push(this.getFullMessageInfo(messageData));
				});
				(await Promise.all(dbMessagesPromises)).forEach(m => {
					if (m) addMessage(m, direction === 'top' ? 'start' : 'end');
				});
				lastVisible.value[direction] =
					messagesRef.size >= perPage ? messagesRef.docs[messagesRef.docs.length - 1] : null;
			} catch (e) {
				return errorHandler(e);
			}
		}
	}

	private static async getMessageSenderInfo(senderId: DBMessage['sender_id']) {
		try {
			const { uid, displayName, photoURL } = (await UserService.getUserInfoById(senderId))!;
			return { uid, displayName, photoURL } as Message['sender'];
		} catch (e) {
			return errorHandler(e);
		}
	}

	private static async getFullMessageInfo(DbMessage: DBMessage) {
		try {
			const { created_at, updated_at, sender_id, content, ...m } = DbMessage;
			const sender = await this.getMessageSenderInfo(sender_id);
			const messageResult: Message = {
				...m,
				sender,
				content: { text: content.text, type: content.type },
				...timestampToDate({ created_at, updated_at }),
			};

			if (content.type !== 'text' && content.attachments?.length) {
				const attachWithThumb = await Promise.all(
					content.attachments.map(async file => {
						if (file.fileType.startsWith('image/') && file.thumbnail) {
							return {
								...file,
								thumbnail: await MessagesService.getMessageThumb(file),
							} as MessageAttachment<AttachmentType>;
						}
						return file as MessageAttachment<'file'>;
					})
				);
				(messageResult.content as MessageContent<AttachmentType>).attachments = attachWithThumb;
			}
			return messageResult;
		} catch (e) {
			return errorHandler(e);
		}
	}

	private static async getMessageThumb(file: DBMessageAttachment) {
		const thumb = file.thumbnail;
		if (thumb?.fullpath) {
			try {
				const blobFile = await getBytes(storageRef(storage, thumb.fullpath));
				if (blobFile) {
					return `data:${file.fileType};base64,${encode(blobFile)}`;
				}
			} catch (e) {
				return errorHandler(e);
			}
		}
		return null;
	}

	static async loadPreviewbyFullpath(rawFile: MessageAttachment['raw']) {
		try {
			if (rawFile.fullpath) {
				const blobFile = await getBlob(storageRef(storage, rawFile.fullpath));
				if (blobFile) {
					return URL.createObjectURL(blobFile);
				}
			}
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async createMessage(chatId: ChatInfo['id'], content: CreateMsgForm) {
		try {
			const messageRef = doc(this.getMessagesCol(chatId));
			const { attachments, ...msgContent } = content;

			const messageContent: DBMessageContent = msgContent;

			// Get images thumbs and Doc ref to prospective image upload
			if (attachments && attachments.length) {
				messageContent.attachments = await this.uploadAttachments(chatId, messageRef, attachments);
			}
			// Add full message data to DB
			await setDoc(messageRef, {
				id: messageRef.id,
				content: messageContent,
				created_at: Timestamp.now(),
				updated_at: null,
				sender_id: await AuthService.getUid(),
			});
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async updateMessage(chatId: ChatInfo['id'], { id: mId, content }: EditMessageData) {
		try {
			const messageRef = doc(collection(doc(ChatService.chatCol, chatId), 'messages'), mId);
			// Rewrite text content data to DB
			await updateDoc(messageRef, {
				'content.text': content.text,
				updated_at: Timestamp.now(),
			});
		} catch (e) {
			errorHandler(e);
		}
	}

	private static async createUploadTask(
		chatId: ChatInfo['id'],
		messageDocRef: DocumentReference<DBMessage, DocumentData>,
		file: FormAttachment,
		DBcontentToUpdate: Partial<DBMessageAttachment>
	) {
		const { setUploading, updateLoading, finishLoading } = useLoadingStore();
		const { fileData, id: fileId } = file;
		const fileDocRef = storageRef(
			storage,
			`chats/${chatId}/messageData/${messageDocRef.id}/${fileId + '.' + fileData.name.split('.').slice(1).join('.')}`
		);
		const uploadTask = uploadBytesResumable(fileDocRef, fileData, {
			contentType: fileData.type,
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
					await deleteDoc(messageDocRef);
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
					const raw = {
						bucket: uploadTask.snapshot.ref.bucket,
						fullpath: uploadTask.snapshot.ref.fullPath,
						fullsize: fileData.size,
						downloadURL,
					} as DBMessageAttachment['raw'];
					if ((file as FormAttachment<'media'>).sizes) {
						raw.sizes = (file as FormAttachment<'media'>).sizes;
					}
					await writeBatch(db)
						.update(messageDocRef, {
							'content.attachments': arrayRemove(DBcontentToUpdate),
						})
						.update(messageDocRef, {
							'content.attachments': arrayUnion({
								...DBcontentToUpdate,
								raw,
							} as DBMessageAttachment),
						})
						.commit();
					finishLoading(fileId);
				} catch (e) {
					return errorHandler(e);
				}
			}
		);
	}

	private static async uploadThumb(chatId: ChatInfo['id'], messageId: Message['id'], attach: FormAttachment<'media'>) {
		try {
			if (attach.thumbnail) {
				const { fileData, id, thumbnail } = attach;
				const thumbRef = storageRef(
					storage,
					`chats/${chatId}/messageData/${messageId}/${
						id + '_thumb.' + fileData.name.split('.').slice(1).join('.')
					}`
				);
				await uploadString(thumbRef, thumbnail.url, 'data_url');
				return {
					bucket: thumbRef.bucket,
					fullpath: thumbRef.fullPath,
					fullsize: thumbnail.fullsize,
				} as DBMessageAttachment['thumbnail'];
			}
		} catch (e) {
			return errorHandler(e);
		}
	}

	private static async uploadAttachments(
		chatId: ChatInfo['id'],
		messageDocRef: DocumentReference<DBMessage, DocumentData>,
		attach: FormAttachment[]
	) {
		try {
			if (!attach.every(file => file.fileData instanceof File)) {
				throw new Error('Attachments should be instance of file');
			}
			const attachResult = await Promise.all(
				attach.map(async file => {
					const { fileData, id, thumbnail, sizes } = file as FormAttachment<'media'>;
					const attachContent: DBMessageAttachment = {
						id,
						fileType: fileData.type,
						fullname: fileData.name,
						raw: { sizes, fullsize: fileData.size },
					} as DBMessageAttachment & { raw: Partial<DBMessageAttachment['raw']> };
					if (file.fileData.type.startsWith('image/') && sizes && thumbnail) {
						const thumbData = await this.uploadThumb(chatId, messageDocRef.id, file as FormAttachment<'media'>);
						if (thumbData) {
							attachContent.thumbnail = thumbData;
						}
					}
					this.createUploadTask(chatId, messageDocRef, file, attachContent);
					return attachContent;
				})
			);
			return attachResult;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async deleteMessageById(chatId: ChatInfo['id'], mId: Message['id']) {
		const messageDocRef = doc(MessagesService.getMessagesCol(chatId), mId);
		return deleteDoc(messageDocRef).catch(err => errorHandler(err));
	}
}
