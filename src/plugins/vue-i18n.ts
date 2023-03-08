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
		'ru-RU': {
			messageLarge: {
				month: '2-digit',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric'
			},
			messageLong: {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric'
			},
			messageShort: {
				hour: 'numeric',
				minute: 'numeric'
			}
		},
		'uk-UA': {
			messageLarge: {
				month: '2-digit',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: 'numeric'
			},
			messageLong: {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric'
			},
			messageShort: {
				hour: 'numeric',
				minute: 'numeric'
			}
		}
	}
});
