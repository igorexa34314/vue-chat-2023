<template>
	<div class="text-message">
		<p class="message__text">
			{{ content.text }}
		</p>
	</div>
</template>

<script setup lang="ts">
import type { TextMessage } from '@/types/db/MessagesTable';

const props = defineProps<{
	content: TextMessage
}>();
</script>

<style scoped></style>