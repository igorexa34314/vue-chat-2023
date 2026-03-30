/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
	// Firebase
	readonly VITE_FB_API_KEY: string;
	readonly VITE_FB_AUTH_DOMAIN: string;
	readonly VITE_FB_PROJECT_ID: string;
	readonly VITE_FB_PUBLIC_BUCKET: string;
	readonly VITE_FB_CHAT_DATA_BUCKET: string;
	readonly VITE_FB_MESSAGING_SENDER_ID: string;
	readonly VITE_FB_APP_ID: string;
	readonly VITE_FB_MEASUREMENT_ID: string;
	readonly VITE_FB_SERVICE_ACCOUNT: string;

	// Algolia search
	readonly VITE_ALGOLIA_APP_ID: string;
	readonly VITE_ALGOLIA_API_KEY: string;
	readonly VITE_ALGOLIA_SEARCH_INDEX: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
