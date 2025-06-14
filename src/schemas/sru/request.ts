import { z } from "zod/v4";
import { MaximumRecordsSchema, StartRecordSchema } from "../common.ts";

/**
 * SRU API request parameter schemas
 */

/**
 * SRU operation types
 */
export const SRUOperationSchema = z.enum([
  "searchRetrieve",
  "explain",
]).default("searchRetrieve");

/**
 * SRU version schema
 */
export const SRUVersionSchema: z.ZodType<"1.1" | "1.2"> = z.enum(["1.1", "1.2"])
  .default("1.2");

/**
 * CQL query schema
 * Contextual Query Language for SRU searches
 */
export const CQLQuerySchema = z.string().min(1, "CQL query cannot be empty");

/**
 * SRU record schema identifiers
 * Common schemas supported by NDL
 */
export const SRURecordSchemaSchema: z.ZodType<
  | "info:srw/schema/1/dc-v1.1"
  | "info:srw/schema/1/mods-v3.0"
  | "http://www.loc.gov/mods/v3"
  | "info:srw/schema/1/marcxml-v1.1"
  | "http://www.loc.gov/MARC21/slim"
  | "dcndl"
  | "dcterms"
> = z.enum([
  "info:srw/schema/1/dc-v1.1",
  "info:srw/schema/1/mods-v3.0",
  "http://www.loc.gov/mods/v3",
  "info:srw/schema/1/marcxml-v1.1",
  "http://www.loc.gov/MARC21/slim",
  "dcndl",
  "dcterms",
]).default("info:srw/schema/1/dc-v1.1");

/**
 * SRU record packing format
 */
export const SRURecordPackingSchema = z.enum(["xml", "string"]).default("xml");

/**
 * SRU sort specification schema
 * Format: "index direction" where direction is "ascending" or "descending"
 */
export const SRUSortBySchema = z.string().optional();

/**
 * SRU result set TTL (Time To Live) in seconds
 */
export const SRUResultSetTTLSchema = z.number().int().positive().max(3600)
  .optional();

/**
 * SRU stylesheet parameter for result transformation
 */
export const SRUStylesheetSchema = z.string().url().optional();

/**
 * SRU search retrieve operation parameters
 */
export const SRUSearchRetrieveRequestSchema = z.object({
  /**
   * SRU operation type
   */
  operation: SRUOperationSchema,

  /**
   * SRU version
   */
  version: SRUVersionSchema.optional(),

  /**
   * CQL query string
   */
  query: CQLQuerySchema,

  /**
   * Starting record position (1-based)
   */
  startRecord: StartRecordSchema.optional(),

  /**
   * Maximum number of records to return
   */
  maximumRecords: MaximumRecordsSchema.optional(),

  /**
   * Record schema identifier
   */
  recordSchema: SRURecordSchemaSchema.optional(),

  /**
   * Record packing format
   */
  recordPacking: SRURecordPackingSchema.optional(),

  /**
   * Sort specification
   */
  sortBy: SRUSortBySchema,

  /**
   * Result set time to live
   */
  resultSetTTL: SRUResultSetTTLSchema,

  /**
   * Stylesheet for transformation
   */
  stylesheet: SRUStylesheetSchema,

  /**
   * Additional custom parameters for NDL-specific features
   */
  inprocess: z.boolean().optional(),

  /**
   * Language preference for multilingual records
   */
  lang: z.enum(["ja", "en"]).optional(),
});

/**
 * SRU explain operation parameters
 */
export const SRUExplainRequestSchema = z.object({
  /**
   * SRU operation type
   */
  operation: z.literal("explain"),

  /**
   * SRU version
   */
  version: SRUVersionSchema.optional(),

  /**
   * Record packing format
   */
  recordPacking: SRURecordPackingSchema.optional(),

  /**
   * Stylesheet for transformation
   */
  stylesheet: SRUStylesheetSchema,
});

/**
 * Union of all SRU request types
 */
export const SRURequestSchema = z.union([
  SRUSearchRetrieveRequestSchema,
  SRUExplainRequestSchema,
]);

/**
 * Type exports
 */
export type SRUOperation = z.infer<typeof SRUOperationSchema>;
export type SRUVersion = z.infer<typeof SRUVersionSchema>;
export type CQLQuery = z.infer<typeof CQLQuerySchema>;
export type SRURecordSchema = z.infer<typeof SRURecordSchemaSchema>;
export type SRURecordPacking = z.infer<typeof SRURecordPackingSchema>;
export type SRUSortBy = z.infer<typeof SRUSortBySchema>;
export type SRUResultSetTTL = z.infer<typeof SRUResultSetTTLSchema>;
export type SRUStylesheet = z.infer<typeof SRUStylesheetSchema>;
export type SRUSearchRetrieveRequest = z.infer<
  typeof SRUSearchRetrieveRequestSchema
>;
export type SRUExplainRequest = z.infer<typeof SRUExplainRequestSchema>;
export type SRURequest = z.infer<typeof SRURequestSchema>;
