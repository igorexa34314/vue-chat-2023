<template>
	<ais-instant-search
		:index-name="searchIndex"
		:stalled-search-delay="500"
		:search-client="searchClient"
		class="search w-100 mr-3">
		<ais-autocomplete #default="{ currentRefinement, refine, indices }: AisAutocompleteSlot">
			<v-text-field
				v-model="query"
				ref="searchEl"
				v-bind="$attrs"
				@update:model-value="(val: string) => updateQuery(val, refine)"
				variant="solo"
				placeholder="Search"
				density="compact"
				hide-details
				single-line
				autofocus />

			<div v-if="currentRefinement">
				<div v-for="index in indices" :key="index.indexId" class="search-hits w-100">
					<v-list v-if="index.hits?.length">
						<v-list-item
							v-for="hit in index.hits.filter(h => h.objectID !== uid)"
							:key="hit.objectID"
							@click="
								() => {
									openUserProfile(hit.objectID);
									query = '';
								}
							">
							<v-list-item-title>{{ setUserDisplayName(hit) }}</v-list-item-title>
							<template #prepend>
								<v-avatar :image="hit.photoURL || defaultAvatar" />
							</template>
							<template #append>
								<v-btn
									size="large"
									variant="text"
									:icon="mdiMessageText"
									@click="
										() => {
											goToChat(hit.objectID);
											query = '';
										}
									"
									density="comfortable" />
							</template>
						</v-list-item>
					</v-list>
				</div>
			</div>
		</ais-autocomplete>
	</ais-instant-search>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue';
import { mdiMessageText } from '@mdi/js';
import { searchClient } from '@/plugins/searchClient';
import { useRouter } from 'vue-router';
import { joinPrivateChat } from '@/services/chat';
import { useSnackbarStore } from '@/stores/snackbar';
import { useUserStore } from '@/stores/user';
import messages from '@/utils/messages.json';
import { defaultAvatar } from '@/global-vars';
import type { UserInfo } from '@/types/db/UserdataTable';
import { setUserDisplayName } from '@/utils/user';
import { useDebounceFn } from '@vueuse/core';
import { AisInstantSearch, AisAutocomplete } from 'vue-instantsearch/vue3/es';

type AisAutocompleteSlot = {
	currentRefinement: string;
	indices: { indexId: string; hits: (UserInfo & { objectID: string })[] }[];
	refine: (query: string) => void;
};

const { search } = defineProps<{
	search?: string;
}>();

const modelValue = defineModel<string>({ default: '' });

defineOptions({
	inheritAttrs: false,
});

const router = useRouter();
const userStore = useUserStore();
const { showMessage } = useSnackbarStore();
const searchIndex: string = import.meta.env.VITE_ALGOLIA_SEARCH_INDEX || 'index';
const searchRef = useTemplateRef('searchEl');
const uid = computed(() => userStore.info?.uid);

const query = ref('');

const updateQuery = useDebounceFn(async (value: string, refine: AisAutocompleteSlot['refine']) => {
	return refine(value);
}, 500);

const goToChat = async (uid: string) => {
	try {
		const chatId = await joinPrivateChat(uid);
		if (chatId) {
			router.push({ name: '//chat/[chatId]', params: { chatId } });
		}
	} catch (e) {
		showMessage(messages[e as keyof typeof messages] || (e as string), 'red-darken-3', 2000);
	}
};
const openUserProfile = (uid: string) => {
	router.push({ name: '//user/[userId]', params: { userId: uid } });
};

defineExpose({
	$el: searchRef,
});
</script>

<style lang="scss" scoped>
.search {
	position: relative;
	max-width: 400px;
}
.search-hits {
	position: absolute;
	top: 100%;
	left: 50%;
	z-index: 100;
	transform: translateX(-50%);
}
</style>
