// Users
export interface UserData {
  info: UserInfo;
  chats: FirebaseFirestore.DocumentReference<ChatInfo>[];
  friends: FirebaseFirestore.DocumentReference<UserData>[];
}
export interface UserInfo {
  displayName: string;
  email: string;
  photoURL: string | null;
  phoneNumber: string | null;
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
  created_at?: FirebaseFirestore.Timestamp;
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
    downloadURL: string;
  };
  thumbnail: T extends 'media'
    ? {
        bucket: string;
        fullpath: string;
        fullsize: number;
      }
    : never;
}
