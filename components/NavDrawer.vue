<template>
	<v-navigation-drawer v-model="drawer" @click="rail = !rail" :rail="rail" rail-width="85" width="320" location="left">
		<v-btn variant="text" icon="mdi-eye-off-outline" @click.stop="rail = !rail"></v-btn>
		<v-list density="comfortable">
			<v-list-item v-for="u in users" :key="u.id" :title="u.name" class="mb-3"
				prepend-avatar="https://cdn.vuetifyjs.com/images/john.png">
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
const props = defineProps({
	modelValue: {
		type: Boolean,
		default: true,
	},
});
const emit = defineEmits(['update:modelValue']);
const users = ref([
	{ id: 1, name: 'Igor 1' },
	{ id: 2, name: 'Igor 2' }
])
const rail = ref(false);
const drawer = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});
</script>

<style lang="scss" scoped>

</style>