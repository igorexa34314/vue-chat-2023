import type { InjectionKey, ComputedRef } from 'vue';
import type { UserData } from '@/types/db/UserdataTable';

export const userDataKey: InjectionKey<ComputedRef<UserData>> = Symbol('userdata');
