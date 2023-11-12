<template>
	<div class="text-message">
		<p class="text-message__text">
			{{ content.text }}
		</p>
	</div>
</template>

<script setup lang="ts">
import type { MessageContent } from '@/types/db/MessagesTable';

const { content } = defineProps<{
	content: Omit<MessageContent, 'attachments'>;
}>();
</script>
