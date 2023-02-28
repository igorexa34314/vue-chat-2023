<template>
	<v-dialog width="auto" persistent v-model="dialog" class="attach-dialog">
		<v-card width="600px" variant="flat" elevation="3" v-if="content.data && Object.keys(content.data).length">
			<v-card-title class="d-flex align-center mt-2">
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
				<h3 class="text-center flex-grow-1">{{ content.type === 'image' ? 'Отправить фото' : 'Отправить файл' }}</h3>
			</v-card-title>
			<v-card-text>
				<v-form @submit.prevent="submitHandler">
					<v-card v-if="content.type === 'image'" class="image-wrapper" max-width="400px" max-height="400px">
						<v-img ref="img" :src="content.data.src" alt="My image" cover @load="getImageParams" />
					</v-card>
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
const img = ref();
const formState = reactive({
	subtitle: ''
});
const submitHandler = () => {
	emit('submit', props.content.type, formState);
	emit('update:modelValue', false);
};
const closeDialog = () => {
	emit('close');
	emit('update:modelValue', false);
};
const getImageParams = () => {
	if (img.value.image.complete && img.value.image.naturalHeight !== 0) {
		formState.image = {
			sizes: {
				w: img.value.image.naturalWidth,
				h: img.value.image.naturalHeight
			}
		};
	}
};
const formatFileSize = computed(() => {
	if (props.content.data && props.content.data.size) {
		return props.content.data.size < 1024 ? props.content.data.size + ' bytes' :
			props.content.data.size < 1048576 ? (props.content.data.size / 1024).toPrecision(4) + ' KB' :
				(props.content.data.size / 1048576).toPrecision(4) + ' MB';
	}
});
</script>

<style lang="scss" scoped>
.attach-dialog :deep(.v-overlay__scrim) {
	background: #000000;
	opacity: 55%;
}
.image-wrapper {
	margin: 0 auto;
	@media(max-width: 760px) {
		max-width: 300px;
	}
}
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
</style>