export const formatFileSize = (size: number) => {
	if (size) {
		return size < 1024 ? size + ' bytes' : size < 1048576 ? (size / 1024).toPrecision(4) + ' KB' : (size / 1048576).toPrecision(4) + ' MB';
	}
};
