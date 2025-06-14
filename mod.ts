/**
 * NDL (National Diet Library) API client for Deno
 *
 * @module
 */

// OpenSearch API
export {
  type SearchItem,
  searchOpenSearch,
  type SearchResponse,
} from "./src/api/opensearch.ts";

// OpenSearch request types
export type { OpenSearchRequest } from "./src/schemas/opensearch/mod.ts";

// SRU API
export {
  executeSearchRetrieveRaw,
  explainSRU,
  searchSRU,
  type SRUSearchItem,
  type SRUSearchResponse,
} from "./src/api/sru.ts";

// SRU request types
export type {
  CQLQuery,
  SimpleSearchParams,
  SRUExplainRequest,
  SRUSearchRetrieveRequest,
} from "./src/schemas/sru/mod.ts";

// Error types
export type { NDLError } from "./src/errors.ts";
export { isAPIError, isNetworkError, isValidationError } from "./src/errors.ts";
