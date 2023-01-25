<template>
	<v-card min-width="50" max-width="700" density="compact" class="message pt-2 mb-4" variant="tonal">
		<v-card-title class="message__head d-flex flex-row align-center">
			<v-avatar image="https://cdn.vuetifyjs.com/images/john.png" variant="plain" size="x-small" />
			<small class="sender__name ml-3">{{ sender }}</small>
		</v-card-title>
		<v-card-text class="message__content">
			<p>{{ textContent }}</p>
		</v-card-text>
	</v-card>

</template>

<script>
export default {
	props: {
		sender: {
			type: String,
			required: true,
		},
		textContent: {
			type: String,
			required: true,
		}
	},
	setup(props, { }) {


		return {}
	},
	name: 'message-item',
}
</script>

<style lang="scss" scoped>
.message {
	&__head {}
}
.sender {
	&__name {
		font-size: 0.73rem;
		font-weight: 600;
		letter-spacing: 0.03rem;
	}
	&__avatar {}
}
</style>