/**
 * OpenSearch API schemas
 *
 * This module exports all OpenSearch-related schemas for:
 * - Request parameters
 * - Response formats (RSS/Atom)
 * - OpenSearch Description Documents
 */

// Request schemas
export {
  type OpenSearchCount,
  OpenSearchCountSchema,
  type OpenSearchFormat,
  OpenSearchFormatSchema,
  type OpenSearchQuery,
  OpenSearchQuerySchema,
  type OpenSearchRequest,
  OpenSearchRequestSchema,
  type OpenSearchStart,
  OpenSearchStartSchema,
  type OpenSearchUrlTemplate,
  OpenSearchUrlTemplateSchema,
} from "./request.ts";

// Response schemas
export {
  type AtomEntry,
  AtomEntrySchema,
  type AtomFeed,
  AtomFeedSchema,
  type OpenSearchNamespace,
  OpenSearchNamespaceSchema,
  type OpenSearchResponse,
  OpenSearchResponseSchema,
  type RSSChannel,
  RSSChannelSchema,
  type RSSFeed,
  RSSFeedSchema,
  type RSSItem,
  RSSItemSchema,
} from "./response.ts";

// Description document schemas
export {
  type OpenSearchDescription,
  OpenSearchDescriptionSchema,
  type OpenSearchImage,
  OpenSearchImageSchema,
  type OpenSearchQueryElement,
  OpenSearchQueryElementSchema,
  type OpenSearchUrl,
  OpenSearchUrlSchema,
} from "./description.ts";
