import { createI18n } from 'vue-i18n';
import dateTimeFormats from '@/utils/dateTimeFormats.json';

const availableLocales = ['en-US', 'ru-RU', 'uk-UA'] as const;

export default createI18n({
	locale: 'en-US',
	fallbackLocale: 'en-US',
	availableLocales,
	datetimeFormats: Object.assign({}, ...availableLocales.map(locale => ({ [locale]: dateTimeFormats['en-US'] }))),
});
