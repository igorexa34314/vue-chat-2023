export const copyToClipboard = async (imageToCopy: Blob | string, imageType?: string) => {
	try {
		if (!(imageToCopy instanceof Blob)) {
			const blob = (await createBlobFromImageUrl(imageToCopy, imageType)) || new Blob();
			await navigator.clipboard.write([new ClipboardItem({ [imageType || blob.type]: blob })]);
		} else {
			await navigator.clipboard.write([new ClipboardItem({ [imageType || imageToCopy.type]: imageToCopy })]);
		}
	} catch (e) {
		throw e;
	}
};

const createBlobFromImageUrl = (imageToCopy: string, imageType: string = 'image/png') => {
	return new Promise((resolve: (blob: Blob | null) => void, reject) => {
		const img = new Image();
		const cnv = document.createElement('canvas');
		const ctx = cnv.getContext('2d');
		img.onload = () => {
			cnv.width = img.naturalWidth;
			cnv.height = img.naturalHeight;
			ctx?.drawImage(img, 0, 0);
			cnv.toBlob(blob => {
				resolve(blob);
			}, imageType);
			cnv.onerror = () => {
				reject('Failed to convert to Blob');
			};
		};
		img.onerror = () => {
			reject('Failed to load image');
		};
		img.src = imageToCopy;
	});
};
