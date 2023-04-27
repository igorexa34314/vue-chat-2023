import { FileMessage, MediaMessage } from '@/stores/messages';
import { ref as storageRef, getBlob } from 'firebase/storage';
import { useFirebaseStorage } from 'vuefire';

export const setDownloadLink = (filename: string, url: string) => {
	const link = document.createElement('a');
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.click();
};

export const downloadFile = async (file: FileMessage['files'][number] | MediaMessage['images'][number]) => {
	try {
		let url = '';
		if (!file.previewURL) {
			const storage = useFirebaseStorage();
			const blobFile = await getBlob(storageRef(storage, file.fullpath));
			url = URL.createObjectURL(blobFile);
		} else {
			url = file.previewURL;
		}
		setDownloadLink(file.fullname, url);
		if (!file.previewURL) {
			URL.revokeObjectURL(url);
		}
	} catch (e) {
		throw e;
	}
};
