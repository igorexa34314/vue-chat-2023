import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSnackbarStore = defineStore('snackbar', () => {
	const text = ref('');
	const color = ref('');
	const timeout = ref('');

	const getAll = computed(() => ({ color: color.value, text: text.value, timeout: timeout.value }));

	const showMessage = (txt, clr, time) => {
		text.value = txt || 'missing "message".';
		color.value = clr || 'green-darken-1';
		timeout.value = time || 2500;
	};
	return {
		color,
		text,
		timeout,
		getAll,
		showMessage
	};
});
