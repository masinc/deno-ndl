/**
 * NDL (National Diet Library) API client for Deno
 *
 * @module
 */

// Core API functions
export { searchOpenSearch } from "./src/api/opensearch.ts";
export { searchSRU } from "./src/api/sru.ts";
export {
  fetchThumbnail,
  saveThumbnailToFile,
  thumbnailExists,
} from "./src/api/thumbnail.ts";

// Response types
export type { OpenSearchSearchResponse } from "./src/api/opensearch.ts";
export type { SRUSearchItem, SRUSearchResponse } from "./src/api/sru.ts";
export type { ThumbnailResponse } from "./src/schemas/thumbnail/mod.ts";

// Request types
export type { OpenSearchRequest } from "./src/schemas/opensearch/mod.ts";
export type { SimpleSearchParams } from "./src/schemas/sru/mod.ts";
export type { ThumbnailRequest } from "./src/schemas/thumbnail/mod.ts";

// Error handling
export type { NDLError } from "./src/errors.ts";
export { isAPIError, isNetworkError, isValidationError } from "./src/errors.ts";
