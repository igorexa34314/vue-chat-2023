import algoliasearch from 'algoliasearch';

const appId = process.env.ALGOLIA_APP_ID || '';
const apiKey = process.env.ALGOLIA_API_KEY || '';
const searchIdx = process.env.ALGOLIA_SEARCH_INDEX || '';

const client = algoliasearch(appId, apiKey);
export const index = client.initIndex(searchIdx);
