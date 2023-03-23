export const calcImageCols = (imgCount: number = 1, imgIdx: number = 0) => {
	if (imgCount < 5) return imgIdx <= (imgCount % 2) - 1 ? '12' : '6';
	else if (imgCount < 7) return imgIdx <= (imgCount % 3) - 1 ? '6' : '4';
	else if (imgCount < 9) {
		if (imgCount % 2) return imgIdx <= Math.floor(imgCount / 3) + (imgCount % 3) ? '6' : '4';
		else return imgIdx < Math.floor(imgCount / 3) * ((imgCount % 3) - 1) ? '6' : '4';
	} else if (imgCount === 9) return imgIdx < Math.floor(imgCount / 3) * (imgCount % 3) ? '6' : '4';
	else return imgIdx < Math.floor(imgCount / 3) + (imgCount % 3) ? '6' : '4';
};
