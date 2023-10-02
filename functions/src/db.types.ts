import { UserRecord } from 'firebase-admin/auth';

// Users
export interface UserData {
  public: PublicUserDataCollection;
  private: PrivateUserDataCollection;
}

interface PublicUserDataCollection {
  info: FirebaseFirestore.DocumentReference<UserInfo>;
}
interface PrivateUserDataCollection {
  security: FirebaseFirestore.DocumentReference<{
    email: string;
    phoneNumber: string | null;
  }>;
  chats: FirebaseFirestore.DocumentReference<Record<FirebaseFirestore.DocumentReference['id'], ChatRecord>>;
  friends: FirebaseFirestore.DocumentReference<Record<UserRecord['uid'], FriendRecord>>;
}

interface FriendRecord {
  friend_since: FirebaseFirestore.Timestamp;
  ref: FirebaseFirestore.DocumentReference<UserData>;
}
type ChatRecord<T extends ChatType = ChatType> = {
  ref: FirebaseFirestore.DocumentReference<ChatInfo<T>>;
} & ([T] extends ['saved'] ? object : { member_since: FirebaseFirestore.Timestamp });

export interface UserInfo {
  uid: UserRecord['uid'];
  firstname: string;
  lastname: string;
  photoURL: string | null;
  gender: 'unknown' | 'male' | 'female';
  birthday_date: FirebaseFirestore.Timestamp | null;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp | null;
}

// Chats
export type ChatType = 'saved' | 'private' | 'group' | 'public';

export type ChatInfo<T extends ChatType = ChatType> = {
  name: string;
  description: string;
  avatar: string | null;
  type: T;
  created_by: FirebaseFirestore.DocumentReference<UserData>;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp | null;
} & ([T] extends ['saved'] ? object : { members: FirebaseFirestore.DocumentReference<UserData>[] });

export interface Message {
  content: MessageContent;
  sender: FirebaseFirestore.DocumentReference<UserData>;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp | null;
}

export interface MessageContent {
  text: string;
  type: ContentType;
  attachments?: MessageAttachment[];
}

// Messages
export type ContentType = 'text' | 'media' | 'file';
export type AttachmentType = Exclude<ContentType, 'text'>;

export interface MessageAttachment<T extends AttachmentType = AttachmentType> {
  id: string;
  fileType: string;
  fullname: string;
  raw: {
    bucket: string;
    fullpath: string;
    fullsize: number;
    sizes: T extends 'media'
      ? {
          w: number;
          h: number;
        }
      : never;
  };
  thumbnail: T extends 'media'
    ? {
        bucket: string;
        fullpath: string;
        fullsize: number;
      }
    : never;
}
