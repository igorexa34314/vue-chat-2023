import { createI18n } from 'vue-i18n';

export default createI18n({
	locale: 'ua',
	fallbackLocale: 'en',
	datetimeFormats: {
		'en-US': {
			short: {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			},
			long: {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				weekday: 'short',
				hour: 'numeric',
				minute: 'numeric'
			}
		},
		'uk-UA': {
			short: {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			},
			long: {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				weekday: 'short',
				hour: 'numeric',
				minute: 'numeric'
			},
			message: {
				hour: 'numeric',
				minute: 'numeric'
			}
		}
	}
	// something vue-i18n options here ...
});
