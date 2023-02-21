<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left" class="pa-3">
		<v-card v-if="userdata && userdata.info" class="py-1 bg-blue-grey-darken-4" density="compact" variant="text"
			to="/profile">
			<template v-slot:prepend>
				<v-avatar :image="userdata.info.photoURL || defaultAvatar" />
			</template>
			<template v-slot:title>{{ userdata.info.displayName || 'Unknown' }}</template>
		</v-card>
		<div v-else>
			<page-loader />
		</div>
		<v-divider thickness="2" class="mt-2" />
		<v-list v-if="userdata.chats && userdata.chats.length" density="comfortable" class="mt-3">
			<v-list-item v-for="ch  in userdata.chats" :key="ch" :title="ch" class="py-3 mb-3" :prepend-avatar="defaultAvatar"
				:to="{ name: 'chat-id', params: { id: ch } }" />
		</v-list>
		<div v-else-if="userdata.chats" class="mt-4 pa-3">
			<p class="text-h6 text-center">Чатов нет</p>
		</div>
		<div v-else>
			<page-loader />
		</div>
	</v-navigation-drawer>
</template>

<script setup>
import pageLoader from '@/components/UI/pageLoader.vue';
import { computed, inject } from 'vue';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;
const emit = defineEmits(['update:modelValue']);
const userdata = inject('userdata');

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: true,
	},
});
const drawer = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});
</script>

<style lang="scss" scoped>
.v-divider {
	--v-border-opacity: 0.6 !important;
}
</style>