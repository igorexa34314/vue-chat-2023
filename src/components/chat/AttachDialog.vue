<template>
	<v-dialog width="auto" persistent v-model="dialog" class="attach-dialog">
		<v-card width="600px" variant="flat" elevation="3" v-if="content.data.length">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">{{ 'Отправить ' + content.data.length + ' ' + (content.type === 'image' ?
					'фото' :
					content.data.length === 1 ? 'файл' : content.data.length > 4 ? 'файлов' : 'файла') }}</h3>
			</v-card-title>
			<v-card-text>
				<v-form @submit.prevent="submitHandler">
					<div v-if="content.type === 'image'" class="images-grid">
						<v-card v-for="img of content.data" class="image-wrapper d-flex">
							<v-img ref="imgEl" :src="img.src" alt="My image" cover @load="getImageParams" />
						</v-card>
					</div>
					<div v-else-if="content.type === 'file'" class="d-flex align-center">
						<div class="file-icon">
							<v-icon icon="mdi-file" size="100px" />
							<span class="file-icon-ext font-weight-black text-brown-darken-4">
								{{ content.data.ext }}</span>
						</div>
						<div class="ml-2 text-subtitle-1 font-weight-medium">
							<p class="text-subtitle-1">{{ content.data.name }}</p>
							<p class="mt-1 text-body-2">{{ formatFileSize }}</p>
						</div>
					</div>
					<div class="d-flex align-center mt-6 mb-3 px-4">
						<v-text-field v-model="formState.subtitle" variant="plain" placeholder="Добавить подпись" class="mr-4"
							hide-details autofocus style="transform: translateY(-11px);" />
						<v-btn type="submit" color="light-blue-darken-4" size="large" rounded>Отправить</v-btn>
					</div>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { formatFileSize as formatSize } from '@/utils/sizeFormat';
import { ref, reactive, computed } from "vue";

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	content: {
		type: Object,
		required: true,
	}
});
const emit = defineEmits(['update:modelValue', 'submit', 'close']);
const dialog = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});
const imgEl = ref();
const formState = reactive({
	subtitle: ''
});
const submitHandler = () => {
	emit('submit', props.content.type, {
		...formState,
		files: props.content.data,
	});
	emit('update:modelValue', false);
};
const closeDialog = () => {
	emit('close');
	emit('update:modelValue', false);
};
const getImageParams = () => {
	console.log(imgEl.value);
	// if (img.value.image.complete && img.value.image.naturalHeight !== 0) {
	// 	formState.image = {
	// 		sizes: {
	// 			w: img.value.image.naturalWidth,
	// 			h: img.value.image.naturalHeight
	// 		}
	// 	};
	// }
};
const formatFileSize = computed(() => formatSize(props.content.data.size));
</script>

<style lang="scss" scoped>
.attach-dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 55%;
}
.images-grid {
	padding: 0.7em 0.2em 0.5em 0;
	overflow-x: hidden;
	overflow-y: auto;
	max-width: 450px;
	max-height: 400px;
	margin: 0 auto;
	display: grid;
	justify-content: space-between;
	grid-gap: 8px;
	grid-template-rows: repeat(auto-fit, minmax(50%, 1fr));
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	@media(max-width: 760px) {
		max-width: 400px;
	}
	@media(max-width: 560px) {
		max-width: 320px;
	}
}
.image-wrapper {}
.file-icon {
	position: relative;
	&-ext {
		font-size: 1.1rem;
		display: inline-block;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -30%);
	}
}
::-webkit-scrollbar {
	width: 0.4rem;
}
</style>