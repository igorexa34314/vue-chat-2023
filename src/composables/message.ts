import { computed } from 'vue';

export const getFileExt = computed(() => (filename: string) => filename.split('.')[filename.split('.').length - 1]);
