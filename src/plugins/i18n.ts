import { createI18n } from 'vue-i18n';
import dateTimeFormats from '@/utils/dateTimeFormats.json';
import { availableLocales } from '@/global-vars';

export default createI18n({
	legacy: false,
	locale: 'en-US',
	fallbackLocale: 'en-US',
	availableLocales,
	datetimeFormats: Object.assign({}, ...availableLocales.map(locale => ({ [locale]: dateTimeFormats['en-US'] }))),
});
