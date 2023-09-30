interface ThumbSizeOptions {
	maxWidth: number;
	maxHeight: number;
	quality: number;
}

export interface ThumbResult {
	url: string;
	fullsize: number;
}

const thumbOptions: ThumbSizeOptions = {
	maxWidth: 40,
	maxHeight: 40,
	quality: 0.6,
};

export const getFileThumbAndSizes = <T extends { id: string; fileData: File }>(file: T) => {
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
			reader.onerror = () => rej(reader);
			reader.onload = e => {
				const preview = e.target?.result?.toString() || '';
				const image = new Image();
				image.src = preview;
				image.onerror = () => res({ ...file, preview });
				image.onload = () => {
					const thumb = getImageThumb(image, file.fileData.type);
					res({
						...file,
						preview,
						thumbnail: thumb,
						sizes: { w: image.naturalWidth, h: image.naturalHeight },
					});
				};
			};
			reader.readAsDataURL(file.fileData);
		} else res(file);
	});
};

const getImageThumb = (
	image: HTMLImageElement,
	fileType: string = 'image/jpeg',
	options: ThumbSizeOptions = thumbOptions
) => {
	const [thumbWidth, thumbHeight] = calculateThumbSizes(image, options);
	const canvas = document.createElement('canvas');
	canvas.width = thumbWidth;
	canvas.height = thumbHeight;
	const ctx = canvas.getContext('2d');
	ctx?.drawImage(image, 0, 0, thumbWidth, thumbHeight);

	const thumb = {
		url: canvas.toDataURL(fileType, options.quality),
	} as ThumbResult;

	canvas.toBlob(
		blob => {
			thumb.fullsize = blob?.size || thumbWidth * thumbHeight;
		},
		fileType,
		options.quality
	);

	return thumb;
};

const calculateThumbSizes = (img: HTMLImageElement, options: Omit<ThumbSizeOptions, 'quality'>) => {
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
