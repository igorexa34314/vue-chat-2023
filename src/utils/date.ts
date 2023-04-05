import type { DateTimeFormatOptions } from '@intlify/core-base';

export const monthsForLocale = (localeName = 'ru-RU', monthFormat?: DateTimeFormatOptions['month']) => {
	const format = new Intl.DateTimeFormat(localeName || 'ru-RU', { month: monthFormat || 'long' }).format;
	return Array(12).map(m => format(new Date(Date.UTC(2022, m % 12))));
};
