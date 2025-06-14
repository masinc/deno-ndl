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
 * OpenSearch start parameter (equivalent to startRecord, but 0-based)
 */
export const OpenSearchStartSchema = z.number().int().min(0).default(0);

/**
 * OpenSearch output format schema
 */
export const OpenSearchFormatSchema = z.enum([
  "rss",
  "atom",
]).default("rss");

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
  count: OpenSearchCountSchema.optional(),

  /**
   * Starting index (0-based)
   */
  start: OpenSearchStartSchema.optional(),

  /**
   * Output format
   */
  format: OpenSearchFormatSchema.optional(),

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
export type OpenSearchStart = z.infer<typeof OpenSearchStartSchema>;
export type OpenSearchFormat = z.infer<typeof OpenSearchFormatSchema>;
export type OpenSearchRequest = z.infer<typeof OpenSearchRequestSchema>;
export type OpenSearchUrlTemplate = z.infer<typeof OpenSearchUrlTemplateSchema>;
