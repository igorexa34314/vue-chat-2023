<template>
	<ais-instant-search :index-name="searchIndex" :stalled-search-delay="500" :search-client="searchClient"
		class="search mr-3">
		<ais-autocomplete #default="{ currentRefinement, indices, refine }">
			<v-text-field :value="currentRefinement" ref="searchEl" v-bind="$attrs"
				@input="refine(($event.target as HTMLInputElement)?.value)" variant="solo" placeholder="Search"
				density="compact" hide-details single-line autofocus />

			<div v-if="currentRefinement" v-for="index in indices" :key="index.indexId" class="search-hits">
				<v-list v-if="index.hits?.length">
					<v-list-item v-for="hit in index.hits" :key="hit.objectID"
						@click="() => { openUserProfile(hit.info.uid); refine('') }">
						<v-list-item-title>{{ hit.info.displayName }}</v-list-item-title>
						<template #prepend>
							<v-avatar :image="hit.info.photoURL" />
						</template>
						<template #append>
							<v-btn v-bind="props" size="large" variant="text" :icon="mdiMessageText"
								@click="() => { goToChat(hit.info.uid); refine('') }" density="comfortable" />
						</template>
					</v-list-item>
				</v-list>
			</div>
		</ais-autocomplete>
	</ais-instant-search>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VTextField } from 'vuetify/components';
import { mdiMessageText } from '@mdi/js';
import { searchClient } from '@/plugins/searchClient';
import { useRouter } from 'vue-router';
import { joinPrivateChat } from '@/services/chat';
import { useSnackbarStore } from '@/stores/snackbar';
import messages from '@/utils/messages.json';
// @ts-ignore
import { AisInstantSearch, AisAutocomplete } from 'vue-instantsearch/vue3/es';

const props = withDefaults(defineProps<{
	search?: string,
	modelValue?: string,
}>(), {
	modelValue: ''
});

defineOptions({
	inheritAttrs: false,
});

const { push } = useRouter();
const { showMessage } = useSnackbarStore();
const searchIndex: string = import.meta.env.VITE_ALGOLIA_SEARCH_INDEX || 'index';
const searchEl = ref<VTextField>();

const goToChat = async (uid: string) => {
	try {
		const chatId = await joinPrivateChat(uid);
		push({ name: 'chat-chatId', params: { chatId } });
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || e as string, 'red-darken-3', 2000);
	}
};
const openUserProfile = (uid: string) => { push({ name: 'user-userId', params: { userId: uid } }) };

defineExpose({
	$el: searchEl
});
</script>

<style lang="scss" scoped>
.search {
	position: relative;
	max-width: 400px;
	width: 100%;
}
.search-hits {
	width: 100%;
	position: absolute;
	z-index: 100;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
}
</style>