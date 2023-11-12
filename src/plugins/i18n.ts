import { createI18n, type DateTimeFormatSchema, type localeKey } from 'vue-i18n';
import datetimeFormats from '@/utils/datetimeFormats.json';
import { availableLocales } from '@/global-vars';

export default createI18n({
	legacy: false,
	locale: 'en-US',
	fallbackLocale: 'en-US',
	availableLocales,
	datetimeFormats: availableLocales.reduce(
		(formats, locale) => ({
			...formats,
			[locale]: datetimeFormats['en-US'],
		}),
		{} as Record<localeKey, DateTimeFormatSchema>
	),
});
