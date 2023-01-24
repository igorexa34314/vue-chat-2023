<template>
	<v-container class="container">
		<div class="row">
			<div class="messages-field"></div>
			<div class="send-message d-flex flex-row">
				<v-text-field label="Ваше сообщение" variant="outlined" hide-details></v-text-field>
				<v-btn icon="mdi-send" label="Отправить"></v-btn>
			</div>
		</div>
	</v-container>
</template>

<script>
// definePageMeta({ layout: 'default' })
export default {

}
</script>

<style lang="scss" scoped>
.send-message {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
}
.container {
	min-height: calc(100vh - 64px);
	display: flex;
	flex-direction: column;
}
.row {
	flex: 1 1 auto;
	position: relative;
}
</style>