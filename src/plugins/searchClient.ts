import { liteClient } from 'algoliasearch/lite';

export const searchClient = liteClient(
	import.meta.env.VITE_ALGOLIA_APP_ID || '',
	import.meta.env.VITE_ALGOLIA_API_KEY || ''
);
