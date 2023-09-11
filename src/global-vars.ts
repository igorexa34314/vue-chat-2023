export const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;
export const googleLogo = new URL('@/assets/img/google.png', import.meta.url).href;
export const savedMessages = new URL('@/assets/img/saved-messages.png', import.meta.url).href;

export const availableLocales = ['en-US', 'ru-RU', 'uk-UA'] as const;
export const maxMessageMedia = { w: 480, h: 480 } as const;
export const maxMessageMediaSm = { w: 400, h: 400 } as const;
