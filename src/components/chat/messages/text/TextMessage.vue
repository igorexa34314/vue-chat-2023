<template>
	<div class="text-message">
		<p class="text-message__text">
			{{ content.text }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { MessageContent } from '@/types/db/MessagesTable';

const props = defineProps<{
	content: Omit<MessageContent, 'attachments'>;
}>();
</script>
