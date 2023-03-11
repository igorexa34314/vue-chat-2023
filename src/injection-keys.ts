import type { InjectionKey, ComputedRef } from 'vue';
import type { UserData } from '@/stores/userdata';

export const userDataKey: InjectionKey<ComputedRef<UserData>> = Symbol('userdata');
export const userChatsKey: InjectionKey<ComputedRef<UserData['chats']>> = Symbol('userChats');
