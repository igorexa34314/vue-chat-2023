interface Result {
	url: string;
	contentType: string;
	b64: string;
	size?: number;
}

interface ImageOptions {
	maxWidth: number;
	maxHeight: number;
	contentType: string;
	quality: number;
}

export const resizeImage = async (
	url: string,
	options: ImageOptions = {
		maxWidth: 1024,
		maxHeight: 768,
		contentType: 'image/jpeg',
		quality: 0.7
	}
) => {
	const calculateSize = (img: HTMLImageElement) => {
		let w = img.width,
			h = img.height;
		if (w > h) {
			if (w > options.maxWidth) {
				h = Math.round((h * options.maxWidth) / w);
				w = options.maxWidth;
			}
		} else {
			if (h > options.maxHeight) {
				w = Math.round((w * options.maxHeight) / h);
				h = options.maxHeight;
			}
		}
		return [w, h];
	};

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.src = url;
		img.onerror = function () {
			URL.revokeObjectURL(img.src);
			reject(img);
		};
		img.onload = function () {
			URL.revokeObjectURL(img.src);
			const [newWidth, newHeight] = calculateSize(img);
			const canvas = document.createElement('canvas');
			canvas.width = newWidth;
			canvas.height = newHeight;
			const ctx = canvas.getContext('2d');
			ctx?.drawImage(img, 0, 0, newWidth, newHeight);

			const resultUrl = canvas.toDataURL(options.contentType, options.quality),
				result: Result = {
					url: resultUrl,
					contentType: resultUrl.match(/^data\:([^\;]+)\;base64,/im)?.[1] || '',
					b64: resultUrl.replace(/^data\:([^\;]+)\;base64,/gim, '')
				};

			canvas.toBlob(
				blob => {
					result.size = blob?.size;
					resolve(result);
				},
				options.contentType,
				options.quality
			);
		};
	});
};
