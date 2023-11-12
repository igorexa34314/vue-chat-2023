import { SearchClient } from 'algoliasearch';

declare module 'vue-instantsearch/vue3/es' {
	export interface SearchItem {
		value: string;
		count: number;
		label: string;
		isRefined: boolean;
		highlighted: boolean;
	}

	export type ItemsTransformer = <T extends SearchItem>(items: SearchItem[]) => T[];

	export type SortKey = 'count:asc' | 'count:desc' | 'name:asc' | 'name:desc' | 'isRefined';

	export type Sorter = SortKey[] | Function;

	export class AisAutocomplete {
		escapeHTML?: boolean;
	}

	export class AisBreadcrumb {
		attributes: string[];
		separator?: string;
		rootPath?: string | null;
		transformItems?: ItemsTransformer;
	}

	export class AisClearRefinements {
		excludedAttributes?: string[];
		includedAttributes?: string[];
		transformItems?: ItemsTransformer;
	}

	export class AisConfigure {
		hitsPerPage?: number;
		attributesToReceive?: string[];
		attributesToHighlight?: string[];
		attributesToSnippet?: string[];
		queryLanguages?: string[];
		restrictSearchableAttributes?: string[];
		snippetEllipsisText?: string;
		analytics?: boolean;
	}

	export class AisExperimentalConfigureRelatedItems {
		hit: object;
		matchingPatterns: object;
		transformSearchParameters?: (params: unknown) => unknown;
	}

	export class AisCurrentRefinements {
		excludedAttributes?: string[];
		includedAttributes?: string[];
		transformItems?: ItemsTransformer;
	}

	export class AisHierarchicalMenu {
		attributes: string[];
		limit?: number;
		showMoreLimit?: number;
		showMore?: boolean;
		sortBy?: Sorter;
		separator?: string;
		rootPath?: string | null;
		showParentLevel?: boolean;
		transformItems?: ItemsTransformer;
	}

	export class AisHighlight {
		hit: object;
		attribute: string;
		highlightedTagName?: string;
	}

	export class AisHits {
		escapeHTML?: boolean;
		transformItems?: ItemsTransformer;
	}

	export class AisHitsPerPage {
		items?: SearchItem[];
		transformItems?: ItemsTransformer;
	}

	export class AisIndex {
		indexName: string;
		indexId?: string;
	}

	export class AisInstantSearch {
		searchClient: SearchClient;
		insightsClient?: Function;
		indexName: string;
		routing?: {
			router?: unknown;
			stateMapping?: unknown;
		};
		stalledSearchDelay?: number;
		searchFunction?: Function;
		initialUiState?: object;
	}

	export class AisInstantSearchSsr {}

	export class AisInfiniteHits {
		showPrevious?: boolean;
		escapeHTML?: boolean;
		transformItems?: ItemsTransformer;
		cache?: object;
	}

	export class AisMenu {
		attribute: string;
		limit?: number;
		showMoreLimit?: number;
		showMore?: boolean;
		sortBy?: Sorter;
		transformItems?: ItemsTransformer;
	}

	export class AisMenuSelect {
		attribute: string;
		limit?: number;
		sortBy?: Sorter;
		transformItems?: ItemsTransformer;
	}

	export class AisNumericMenu {
		attribute: string;
		items: SearchItem[];
		transformItems?: ItemsTransformer;
	}

	export class AisPagination {
		padding?: number;
		totalPages?: number;
		showFirst?: boolean;
		showLast?: boolean;
		showNext?: boolean;
		showPrevious?: boolean;
	}

	export class AisPanel {}

	export class AisPoweredBy {
		theme?: 'light' | 'dark';
	}

	export class AisQueryRuleContext {
		trackedFilters: object;
		transformRuleContexts?: (contexts: string[]) => string[];
	}

	export class AisQueryRuleCustomData {
		transformItems?: ItemsTransformer;
	}

	export class AisRangeInput {
		attribute: string;
		min?: number;
		max?: number;
		precision?: number;
	}

	export class AisRatingMenu {
		attribute: string;
		max?: number;
	}

	export class AisRefinementList {
		attribute: string;
		searchable?: boolean;
		searchablePlaceholder?: string;
		operator?: 'and' | 'or';
		limit?: number;
		showMoreLimit?: number;
		showMore?: boolean;
		sortBy?: Sorter;
		transformItems?: ItemsTransformer;
	}

	export class AisStateResults {}

	export class AisSearchBox {
		placeholder?: string;
		autofocus?: boolean;
		showLoadingIndicator?: boolean;
		submitTitle?: string;
		resetTitle?: string;
		value?: string;
	}

	export class AisSnippet {
		hit: object;
		attribute: string;
		highlightedTagName?: string;
	}

	export class AisSortBy {
		items: SearchItem[];
		transformItems?: ItemsTransformer;
	}

	export class AisStats {}

	export class AisToggleRefinement {
		attribute: string;
		label: string;
		on?: string | number | boolean | (string | number | boolean)[];
		off?: string | number | boolean | (string | number | boolean)[];
	}

	export class AisVoiceSearch {
		searchAsYouSpeak?: boolean;
		buttonTitle?: string;
		disabledButtonTitle?: string;
	}
}
