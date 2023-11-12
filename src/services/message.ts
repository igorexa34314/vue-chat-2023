import { withIdConverter } from '@/utils/firestore';
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
	DocumentReference,
	where,
	type UpdateData,
	type Unsubscribe,
} from 'firebase/firestore';
import {
	ref as storageRef,
	uploadBytesResumable,
	uploadString,
	getBlob,
	getBytes,
	deleteObject,
} from 'firebase/storage';
import { AuthService } from '@/services/auth';
import { UserService, type DisplayUserInfo } from '@/services/user';
import { fbErrorHandler as errorHandler } from '@/utils/errorHandler';
import { encode } from 'base64-arraybuffer';
import { useMessagesStore, type Direction } from '@/stores/messages';
import { useLoadingStore } from '@/stores/loading';
import type {
	AttachmentType,
	ContentType,
	Message as DBMessage,
	MessageAttachment as DBMessageAttachment,
	MessageContent as DBMessageContent,
} from '@/types/db/MessagesTable';
import { ChatService, type ChatInfo } from '@/services/chat';
import { type EditMessageData } from '@/components/chat/form/MessageForm.vue';
import { type ThumbResult } from '@/utils/resizeFile';

type ConvertedMessage = ReturnType<ReturnType<typeof withIdConverter<DBMessage>>['fromFirestore']>;

export interface Message extends Omit<ConvertedMessage, 'deleted_at' | 'sender' | 'content'> {
	content: MessageContent;
	sender: DisplayUserInfo;
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
		return collection(doc(ChatService.chatCol, chatId), 'messages').withConverter(withIdConverter<DBMessage>());
	}

	private static getMessageDocRef(chatId: ChatInfo['id'], mId: Message['id']) {
		return doc(MessagesService.getMessagesCol(chatId), mId);
	}

	static subscribeMessages(chatId: ChatInfo['id']) {
		const messagesStore = useMessagesStore();
		const messagesCol = this.getMessagesCol(chatId);
		const subscribeAdd = () => {
			const q = query(messagesCol, where('created_at', '>=', Timestamp.now()));
			return onSnapshot(q, async messagesRef => {
				try {
					const messages = await Promise.all(
						messagesRef
							.docChanges()
							.filter(change => change.type === 'added')
							.map(async change => this.getFullMessageInfo(change.doc.data()))
					);
					messages.reverse().forEach(msg => {
						messagesStore.addMessage(msg, 'end');
					});
					const lastAdded = messagesRef
						.docChanges()
						.reverse()
						.findIndex(doc => doc.type === 'added');
					if (lastAdded) {
						messagesStore.lastVisible.top = messagesRef.docs[lastAdded];
					}
				} catch (err) {
					return errorHandler(err);
				}
			});
		};
		const subscribeUpdate = () => {
			const q = query(messagesCol, where('updated_at', '>=', Timestamp.now()));
			return onSnapshot(q, async messagesRef => {
				try {
					const messages = await Promise.all(
						messagesRef
							.docChanges()
							.filter(change => change.type !== 'removed')
							.map(async change => this.getFullMessageInfo(change.doc.data()))
					);
					messages.forEach(msg => {
						messagesStore.modifyMessage(msg);
					});
				} catch (err) {
					return errorHandler(err);
				}
			});
		};
		const subscribeDelete = () => {
			const q = query(messagesCol, where('deleted_at', '>=', Timestamp.now()));
			return onSnapshot(q, async messagesRef => {
				try {
					const messagesId = await Promise.all(
						messagesRef
							.docChanges()
							.filter(change => change.type !== 'removed')
							.map(async change => change.doc.id)
					);
					messagesId.forEach(msgId => {
						messagesStore.deleteMessageById(msgId);
					});
					// const lastAdded = messagesRef.docChanges().findLastIndex(doc => doc.type === 'added');
					// if (lastAdded) {
					// 	messagesStore.lastVisible.top = messagesRef.docs[lastAdded];
					// }
				} catch (err) {
					return errorHandler(err);
				}
			});
		};
		const unsubAdd = subscribeAdd();
		const unsubUpdate = subscribeUpdate();
		const unsubDelete = subscribeDelete();

		return (() => {
			unsubAdd();
			unsubUpdate();
			unsubDelete();
		}) as Unsubscribe;
	}

	static async fetchMessages(chatId: ChatInfo['id'], lmt: number = 10) {
		const messagesStore = useMessagesStore();
		const messagesCol = this.getMessagesCol(chatId);
		messagesStore.setFirstLoading(true);
		const q = query(
			messagesCol,
			where('deleted_at', '==', null),
			orderBy('deleted_at', 'desc'),
			orderBy('created_at', 'desc'),
			limit(lmt)
		);
		try {
			const messagesDocRef = await getDocs(q);
			const messageFullData = await Promise.all(
				messagesDocRef.docs.map(async doc => {
					return this.getFullMessageInfo(doc.data());
				})
			);
			messageFullData.reverse().forEach(msg => {
				messagesStore.addMessage(msg, 'end');
			});
			if (messagesDocRef.size >= lmt) {
				messagesStore.lastVisible.top = messagesDocRef.docs[messagesDocRef.docs.length - 1];
			}
		} catch (err) {
			return errorHandler(err);
		} finally {
			messagesStore.setFirstLoading(false);
		}
	}

	static async loadMoreMessages(chatId: ChatInfo['id'], direction: Direction, perPage: number = 10) {
		const messagesStore = useMessagesStore();
		if (messagesStore.lastVisible[direction] && !messagesStore.isLoading) {
			try {
				messagesStore.isLoading = true;
				const messagesCol = this.getMessagesCol(chatId);
				const q = query(
					messagesCol,
					where('deleted_at', '==', null),
					orderBy('deleted_at', 'desc'),
					orderBy('created_at', direction === 'top' ? 'desc' : 'asc'),
					startAfter(messagesStore.lastVisible[direction]),
					limit(perPage)
				);
				const messagesRef = await getDocs(q);
				if (messagesRef.empty) {
					messagesStore.lastVisible[direction] = null;
					return;
				}
				// if (messages.value.length > 40) {
				// 	deleteMessages(perPage, direction === 'top' ? 'end' : 'start');
				// 	const msgBeforeDel = await getDoc(doc(messagesCol, messages.value.at(direction === 'top' ? -1 : 0)?.id));
				// 	lastVisible.value[direction === 'top' ? 'bottom' : 'top'] = msgBeforeDel as LastVisibleFbRef[Direction];
				// }

				const messages = await Promise.all(
					messagesRef.docs.map(async doc => {
						const message = await this.getFullMessageInfo(doc.data());
						return message;
					})
				);
				messagesStore.addMessages(messages.reverse(), direction === 'top' ? 'start' : 'end');

				messagesStore.lastVisible[direction] =
					messagesRef.size >= perPage ? messagesRef.docs[messagesRef.docs.length - 1] : null;
			} catch (e) {
				return errorHandler(e);
			} finally {
				messagesStore.isLoading = false;
			}
		}
	}

	private static async getFullMessageInfo<T extends ConvertedMessage>(dbMessage: T) {
		try {
			const senderInfo = (await UserService.getUserDisplayInfo(dbMessage.sender.id))!;
			const message = {
				...dbMessage,
				sender: senderInfo,
			} as Message;

			if (dbMessage.content.type !== 'text' && dbMessage.content.attachments?.length) {
				const attachmentsWithThumb = await Promise.all(
					dbMessage.content.attachments.map(async file => {
						if (file.thumbnail) {
							return {
								...file,
								thumbnail: await MessagesService.getMessageThumb(file.thumbnail.fullpath, file.fileType),
							} as MessageAttachment<AttachmentType>;
						}
						return file as MessageAttachment<'file'>;
					})
				);
				(message.content as MessageContent<AttachmentType>).attachments = attachmentsWithThumb;
			}
			return message;
		} catch (e) {
			return errorHandler(e);
		}
	}

	private static async getMessageThumb(path: string, fileType: DBMessageAttachment['fileType']) {
		try {
			const buffer = await getBytes(storageRef(storage, path));
			return `data:${fileType};base64,${encode(buffer)}`;
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async loadPreviewbyFullpath(path: string) {
		try {
			const blobFile = await getBlob(storageRef(storage, path));
			return URL.createObjectURL(blobFile);
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async createMessage(chatId: ChatInfo['id'], content: CreateMsgForm) {
		try {
			const newMessageRef = doc(this.getMessagesCol(chatId));
			const { attachments, ...msgContent } = content;

			const messageContent: DBMessageContent = msgContent;

			// Get images thumbs and Doc ref to prospective image upload
			if (attachments && attachments.length) {
				messageContent.attachments = await this.uploadAttachments(chatId, newMessageRef, attachments);
			}
			// Add full message data to DB
			await setDoc(newMessageRef, {
				id: newMessageRef.id,
				content: messageContent,
				sender: UserService.getUserDocRef(await AuthService.getUid()),
				created_at: Timestamp.now(),
				updated_at: null,
				deleted_at: null,
			});
		} catch (e) {
			return errorHandler(e);
		}
	}

	static async updateMessage(chatId: ChatInfo['id'], { id: mId, content }: EditMessageData) {
		try {
			const messageDocRef = this.getMessageDocRef(chatId, mId);
			// Rewrite text content data to DB
			return updateDoc(messageDocRef, {
				'content.text': content.text,
				updated_at: Timestamp.now(),
			} as UpdateData<DBMessage>);
		} catch (e) {
			errorHandler(e);
		}
	}

	private static async createUploadTask(
		chatId: ChatInfo['id'],
		messageDocRef: DocumentReference<ConvertedMessage>,
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
					const raw = {
						bucket: uploadTask.snapshot.ref.bucket,
						fullpath: uploadTask.snapshot.ref.fullPath,
						fullsize: fileData.size,
					} as DBMessageAttachment['raw'];
					if ((file as FormAttachment<'media'>).sizes) {
						raw.sizes = (file as FormAttachment<'media'>).sizes;
					}
					await writeBatch(db)
						.update(messageDocRef, {
							'content.attachments': arrayRemove(DBcontentToUpdate),
						} as UpdateData<DBMessageAttachment>)
						.update(messageDocRef, {
							'content.attachments': arrayUnion({
								...DBcontentToUpdate,
								raw,
							}),
						} as UpdateData<DBMessageAttachment>)
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
		messageDocRef: DocumentReference<ConvertedMessage>,
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
		const messageDocRef = this.getMessageDocRef(chatId, mId);
		return updateDoc(messageDocRef, {
			deleted_at: Timestamp.now(),
		} as UpdateData<DBMessage>).catch(err => errorHandler(err));
	}
}
