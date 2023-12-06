import { chatDataStorage } from '@/firebase';
import { type MessageAttachment } from '@/services/message';
import { ref as storageRef, getBlob } from 'firebase/storage';

export const setDownloadLink = (filename: string, url: string) => {
	const link = document.createElement('a');
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.click();
};

export const downloadFile = async (file: MessageAttachment) => {
	let url = '';
	if (!file.raw.previewURL) {
		const blobFile = await getBlob(storageRef(chatDataStorage, file.raw.fullpath));
		url = URL.createObjectURL(blobFile);
	} else {
		url = file.raw.previewURL;
	}
	setDownloadLink(file.fullname, url);
	if (!file.raw.previewURL) {
		URL.revokeObjectURL(url);
	}
};
