<template>
	<div v-bind="hoverProps" style="cursor: pointer;" class="file-icon">
		<v-icon :icon="mdiFile" :size="smAndUp ? '80px' : '64px'" @click="emit('downloadFile')" title="Download" />

		<v-fade-transition>
			<div v-if="loading" class="loader">
				<image-loader :size="smAndUp ? '32px' : '26px'" :icon-size="smAndUp ? '20px' : '16px'"
					bg-color="transparent" />
			</div>
			<span v-else-if="!isHovering" class="file-icon-ext font-weight-bold text-brown-darken-4">
				{{ getFileExt(file.fullname).length <= (smAndUp ? 5 : 4) ? getFileExt(file.fullname) : '' }}</span>
					<v-icon v-else :icon="mdiDownload" :size="smAndUp ? '22px' : '20px'" variant="text" class="file-icon-btn"
						color="black" density="compact" :flat="false" :ripple="false" @click="emit('downloadFile')" />
		</v-fade-transition>
	</div>
</template>

<script setup lang="ts">
import ImageLoader from '@/components/chat/ImageLoader.vue';
import { useDisplay } from 'vuetify';
import { mdiFile, mdiDownload } from '@mdi/js';
import { getFileExt } from '@/utils/filters/messages';
import { Message } from '@/stores/messages';

const props = withDefaults(defineProps<{
	file: Message['content']['attachments'][number];
	isHovering?: boolean;
	hoverProps?: Record<string, unknown>;
	loading?: boolean;
}>(), {
	loading: false
});
const emit = defineEmits<{
	downloadFile: []
}>();

const { smAndUp } = useDisplay();
</script>

<style lang="scss" scoped>
.file-icon {
	user-select: none !important;
	position: relative;
	&-ext, &-btn {
		margin-left: auto;
		margin-right: auto;
		max-width: 45px;
		font-size: 1em;
		line-height: 1;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
		@media (min-width: 600px) {
			font-size: 1.15em;
		}
	}
	&-btn {
		transform: translate(-50%, -40%);
	}
}
.loader {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -30%);

}
</style>