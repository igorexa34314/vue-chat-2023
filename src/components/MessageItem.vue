<template>
	<div :class="{ self }" class="message d-flex">
		<v-avatar size="30px" :image="sender.photoURL" :class="self ? 'ml-2' : 'mr-2'" class="sender__avatar"
			@click="$router.push({ name: 'user-id', params: { id: sender.id } })" />
		<v-card min-width="80" max-width="650" density="compact" class="message__card mb-4" variant="tonal">
			<v-card-title class="message__head d-flex flex-row align-center">
				<small class="sender__name" @click="$router.push({ name: 'user-id', params: { id: sender.id } })">{{
					sender.displayName }}</small>
			</v-card-title>
			<v-card-text class="message__content">
				<p>{{ textContent }}</p>
			</v-card-text>
		</v-card>
	</div>
</template>

<script setup>
const props = defineProps({
	self: {
		type: Boolean,
		default: false,
	},
	sender: {
		type: Object,
		required: true,
	},
	textContent: {
		type: String,
		required: true,
	}
});
</script>

<style lang="scss" scoped>
.message {
	&__card {}
	&__head {}
}
.sender {
	&__name {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.03rem;
	}
	&__avatar {}
}
.self {
	justify-content: flex-end;
	.sender__avatar {
		order: 2 !important;
	}
	.message__card {
		order: 1 !important;
	}
}
</style>