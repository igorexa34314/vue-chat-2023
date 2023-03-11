export type Name = string;
export type Email = string;
export type Terms = boolean;
export type Password = string;

export default {
	name: [(v: Name) => !!v || 'Введите имя', (v: Name) => (v && v.length >= 2 && v.length <= 16) || 'Имя должно быть в пределах от 2 до 16 символов'],
	email: [(v: Email) => !!v || 'Введите почту', (v: Email) => /.+@.+\..+/.test(v) || 'Введите корректную почту'],
	terms: [(v: Terms) => !!v || 'Вы должны согласиться с правилами'],
	password: [(v: Password) => !!v || 'Введите пароль', (v: Password) => (v && v.length >= 6 && v.length <= 32) || 'Пароль должен быть в пределах от 6 до 32 символов'],
	file: [(v: FileList | File[]) => (v.length ? v[0].size <= 2097152 || 'Размер файла должен быть менее 2 мегабайт' : true)]
};
