<template>
	<v-container class="d-flex flex-column align-center justify-center" style="min-height: 100vh">
		<login-form />
	</v-container>
</template>

<script setup>
definePageMeta({ layout: 'empty' });
useHead({ title: 'Главная', });

const ctx = useNuxtApp();
let socket = null;
ctx.onUnmounted = onUnmounted;
onMounted(() => {
	socket = ctx.$nuxtSocket({
		name: 'main',
		reconnection: true,
	})
	console.log(socket);
	watch(ctx.$ioState, () => {
		console.log(ctx.$ioState);
	})
	// socket.on('messageRecieved', (msg, cb) => {
	// 	console.log('Its your message')
	// })
	mt1();
	socket.on('newMessage', data => {
		console.log('Message from server recieved', data)
	})
});

const mt1 = () => {
	socket.emit('sendMessage', {
		hello: 'world'
	}, (resp) => {
		console.log('Message was send')
	})
};

</script>

<style lang="scss" scoped>

</style>