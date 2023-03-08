import { defineStore } from 'pinia';
import { reactive } from 'vue';

export interface SnackbarOptions {
	text: string;
	color?: string;
	timeout?: number;
}

export const useSnackbarStore = defineStore('snackbar', () => {
	const snackbarState: SnackbarOptions = reactive({
		text: '',
		color: '',
		timeout: 0
	});

	const showMessage = (text: SnackbarOptions['text'], color?: SnackbarOptions['color'], timeout?: SnackbarOptions['timeout']) => {
		snackbarState.text = text || 'missing "message".';
		snackbarState.color = color || 'green-darken-1';
		snackbarState.timeout = timeout || 2500;
	};
	return {
		snackbarState,
		showMessage
	};
});
