/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
	root: true,
	ignorePatterns: ['/functions/**'],
	extends: [
		'plugin:vue/vue3-essential',
		'eslint:recommended',
		'@vue/eslint-config-typescript',
		'@vue/eslint-config-prettier/skip-formatting',
	],
	parserOptions: {
		ecmaVersion: 'latest',
	},
	rules: {
		'vue/multi-word-component-names': 'off',
	},
};
