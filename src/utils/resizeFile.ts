interface ThumbSizeOptions {
	maxWidth: number;
	maxHeight: number;
	quality: number;
}

export interface ThumbResult {
	url: string;
	fullsize?: number;
}

export const getFileThumbAndSizes = <T extends { id: string; fileData: File }>(
	file: T,
	options: ThumbSizeOptions = {
		maxWidth: 40,
		maxHeight: 40,
		quality: 0.6,
	}
) => {
	return new Promise<
		| (T & {
				sizes: { w: number; h: number };
				thumbnail: ThumbResult;
				preview: string;
		  })
		| T
	>((res, rej) => {
		if (file.fileData.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = e => {
				const preview = e.target?.result?.toString() || '';
				const image = new Image();
				image.src = preview;
				image.onerror = () => {
					rej(image);
				};
				image.onload = () => {
					const [newWidth, newHeight] = calculateThumbSize(image, options);
					const canvas = document.createElement('canvas');
					canvas.width = newWidth;
					canvas.height = newHeight;
					const ctx = canvas.getContext('2d');
					ctx?.drawImage(image, 0, 0, newWidth, newHeight);

					const resultUrl = canvas.toDataURL(file.fileData.type, options.quality),
						result: ThumbResult = {
							url: resultUrl,
						};
					canvas.toBlob(
						blob => {
							result.fullsize = blob?.size;
							res({
								...file,
								preview,
								thumbnail: result,
								sizes: { w: image.naturalWidth, h: image.naturalHeight },
							});
						},
						file.fileData.type,
						options.quality
					);
				};
			};
			reader.onerror = () => rej(reader);
			reader.readAsDataURL(file.fileData);
		} else res(file);
	});
};

const calculateThumbSize = (img: HTMLImageElement, options: ThumbSizeOptions) => {
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
