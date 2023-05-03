import type { DateTimeFormatOptions } from '@intlify/core-base';

export const monthsForLocale = (localeName = 'en-US', monthFormat: DateTimeFormatOptions['month'] = 'long') => {
	const format = new Intl.DateTimeFormat(localeName, { month: monthFormat }).format;
	return [...Array(12).keys()].map(m => format(new Date(Date.UTC(2022, m % 12))));
};
