export const useDateFormat = () => {
	const messagesDateFormat = (date = new Date()) => {
		const day = (new Date() - date) / (60 * 60 * 24 * 1000);
		return day < 1 && new Date().getDay() === date.getDay() ? 'messageShort' : day < 24 ? 'messageLong' : 'messageLarge';
	};

	const monthsForLocale = (localeName = 'ru-RU', monthFormat = 'long') => {
		const format = new Intl.DateTimeFormat(localeName, { month: monthFormat }).format;
		return [...Array(12).keys()].map(m => format(new Date(Date.UTC(2022, m % 12))));
	};

	return {
		monthsForLocale,
		messagesDateFormat
	};
};
