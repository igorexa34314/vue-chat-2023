import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UploadTask } from 'firebase/storage';

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
		uploadingState.value.push({ fileId: id, progress: startValue, task, status: 'started' });
	};
	const updateLoading = (id: string, value: number) => {
		uploadingState.value = uploadingState.value.map(l =>
			l.fileId === id ? { ...l, progress: Math.round(value), status: 'running' } : l
		);
	};
	const finishLoading = (id: string) => {
		uploadingState.value = uploadingState.value.map(l => (l.fileId === id ? { ...l, status: 'finished' } : l));
	};
	const deleteLoading = (id: string) => {
		uploadingState.value = uploadingState.value.filter(l => l.fileId !== id);
	};

	const cancelLoading = (fileId: string) => {
		return getUploadingStateById.value(fileId)?.task.cancel();
	};

	return {
		getUploadingStateById,
		deleteLoading,
		setUploading,
		updateLoading,
		finishLoading,
		cancelLoading,
	};
});
