<template>
	<v-navigation-drawer v-model="drawer" width="320" location="left">
		<!-- <v-btn variant="text" icon="mdi-eye-off-outline" @click.stop="rail = !rail"></v-btn> -->
		<v-list v-if="userdata && userdata.info" density="comfortable" class="mt-4">
			<v-list-item :title="userdata.info.displayName || 'Unknown'" class="mb-3"
				:prepend-avatar="userdata.info.photoURL || defaultAvatar" />
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
import { computed, inject } from 'vue';

const defaultAvatar = new URL('@/assets/img/default_user_avatar.jpg', import.meta.url).href;
const userdata = inject('userdata');

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: true,
	},
});
const emit = defineEmits(['update:modelValue']);

const drawer = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});
</script>

<style lang="scss" scoped></style>