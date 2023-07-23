import { InjectionKey, Ref } from 'vue';

export const globalLoadingKey: InjectionKey<Ref<boolean>> = Symbol('loading');
