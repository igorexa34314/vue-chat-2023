import { computed } from 'vue';

export const getFileExt = computed(() => (filename: string) => filename.split('.').at(-1) as string);

export const messagesDateFormat = computed(() => (date = new Date()) => {
	const day = (+new Date() - +date) / (60 * 60 * 24 * 1000);
	return day < 1 && new Date().getDay() === date.getDay() ? 'messageShort' : day < 24 ? 'messageLong' : 'messageLarge';
});

export const formatFileSize = computed(() => (size: number) => {
	return size < 1024 ? size + ' bytes' : size < 1048576 ? (size / 1024).toPrecision(4) + ' KB' : (size / 1048576).toPrecision(4) + ' MB';
});
