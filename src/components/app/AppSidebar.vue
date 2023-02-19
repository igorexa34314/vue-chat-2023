<template>
	<v-navigation-drawer v-model="drawer" @click="rail = !rail" :rail="rail" rail-width="85" width="320" location="left">
		<!-- <v-btn variant="text" icon="mdi-eye-off-outline" @click.stop="rail = !rail"></v-btn> -->
		<v-list density="comfortable" class="mt-4">
			<v-list-item :title="user.displayName" class="mb-3" :prepend-avatar="user.photoURL || googleImg" />
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserdataStore } from '@/stores/userdata';

const googleImg = new URL('@/assets/img/google.png', import.meta.url).href;
const userdataStore = useUserdataStore();

const user = computed(() => userdataStore.userdata);

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: true,
	},
});
const emit = defineEmits(['update:modelValue']);

const rail = ref(false);
const drawer = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});
</script>

<style lang="scss" scoped></style>