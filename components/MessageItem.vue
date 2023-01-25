<template>
	<div class="message d-flex">
		<v-avatar size="30px" image="https://cdn.vuetifyjs.com/images/john.png" class="mr-2" />

		<v-card min-width="80" max-width="650" density="compact" class="message__card  mb-4" variant="tonal">
			<v-card-title class="message__head d-flex flex-row align-center">
				<small class="sender__name">{{ sender }}</small>
			</v-card-title>
			<v-card-text class="message__content">
				<p>{{ textContent }}</p>
			</v-card-text>
		</v-card>
	</div>
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
</style>