import { z } from "zod/v4";
import { MaximumRecordsSchema } from "../common.ts";

/**
 * OpenSearch API request parameter schemas
 */

/**
 * OpenSearch query parameter schema
 */
export const OpenSearchQuerySchema = z.string().min(1, "Query cannot be empty");

/**
 * OpenSearch count parameter (equivalent to maximumRecords)
 */
export const OpenSearchCountSchema = MaximumRecordsSchema;

/**
 * OpenSearch API request parameters schema
 */
export const OpenSearchRequestSchema = z.object({
  /**
   * Search query string
   */
  q: OpenSearchQuerySchema,

  /**
   * Number of results to return
   */
  count: MaximumRecordsSchema.optional(),

  /**
   * Starting index (0-based)
   */
  start: z.number().int().min(0).default(0).optional(),

  /**
   * Output format
   */
  format: z.enum(["rss", "atom"]).default("rss").optional(),

  /**
   * Language preference
   */
  hl: z.enum(["ja", "en"]).optional(),
});

/**
 * OpenSearch URL template schema
 */
export const OpenSearchUrlTemplateSchema = z.object({
  template: z.string().url(),
  type: z.string(),
  indexOffset: z.number().int().optional(),
  pageOffset: z.number().int().optional(),
});

/**
 * Type exports
 */
export type OpenSearchQuery = z.infer<typeof OpenSearchQuerySchema>;
export type OpenSearchCount = z.infer<typeof OpenSearchCountSchema>;
export type OpenSearchRequest = z.infer<typeof OpenSearchRequestSchema>;
export type OpenSearchUrlTemplate = z.infer<typeof OpenSearchUrlTemplateSchema>;
