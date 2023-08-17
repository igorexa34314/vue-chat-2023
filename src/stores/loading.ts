import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UploadTask } from 'firebase/storage';

interface UploadingState {
	fileId: string;
	task: UploadTask;
	progress: number;
	status?: 'started' | 'running' | 'error' | 'finished';
}

export const useLoadingStore = defineStore('loading', () => {
	const uploadingState = ref<UploadingState[]>([]);

	const getUploadingStateById = computed(() => (id: string) => uploadingState.value.find(l => l.fileId === id));

	const setUploading = (id: string, task: UploadTask, startValue: number = 0) => {
		uploadingState.value.push({ fileId: id, progress: startValue, task });
	};
	const updateLoading = (id: string, value: number) => {
		uploadingState.value = uploadingState.value.map(l =>
			l.fileId === id ? { ...l, progress: Math.round(value) } : l
		);
	};
	const finishLoading = (id: string) => {
		uploadingState.value = uploadingState.value.filter(l => l.fileId !== id);
	};

	return {
		getUploadingStateById,
		setUploading,
		updateLoading,
		finishLoading,
	};
});
