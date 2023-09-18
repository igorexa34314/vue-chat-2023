import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface SnackbarOptions {
	text: string;
	color?: string;
	timeout?: number;
}

export const useSnackbarStore = defineStore('snackbar', () => {
	const snackbarState = ref<SnackbarOptions>({
		text: '',
		color: '',
		timeout: 0,
	});

	const showMessage = (
		text: SnackbarOptions['text'] = 'missing "message"',
		color: SnackbarOptions['color'] = 'green-darken-1',
		timeout: SnackbarOptions['timeout'] = 2500
	) => {
		snackbarState.value = { text, color, timeout };
	};
	return {
		snackbarState,
		showMessage,
	};
});
