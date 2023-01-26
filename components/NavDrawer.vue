<template>
	<v-navigation-drawer v-model="drawer" :rail="rail" rail-width="85" width="320" location="left" permanent
		@click="emit('click')">
		<v-list lines="false">
			<v-list-item title="User 1">
				<template v-slot:prepend>
					<v-avatar image="https://cdn.vuetifyjs.com/images/john.png" variant="plain" />
				</template>
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
const props = defineProps({
	rail: {
		type: Boolean,
		default: false,
	},
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

<style lang="scss" scoped>

</style>