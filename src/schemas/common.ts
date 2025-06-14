import { z } from "zod/v4";

/**
 * Basic primitive schemas
 */

/**
 * Non-empty string schema
 */
export const NonEmptyStringSchema = z.string().min(1).trim();

/**
 * URL schema with validation
 */
export const URLSchema = z.string().url();

/**
 * Email schema
 */
export const EmailSchema = z.string().email();

/**
 * ISO 8601 date string schema
 */
export const ISO8601DateSchema = z.string().datetime();

/**
 * Date range schema for OAI-PMH
 */
export const DateRangeSchema = z.object({
  from: ISO8601DateSchema.optional(),
  until: ISO8601DateSchema.optional(),
});

/**
 * Positive integer schema
 */
export const PositiveIntegerSchema = z.number().int().positive();

/**
 * Non-negative integer schema (including 0)
 */
export const NonNegativeIntegerSchema = z.number().int().min(0);

/**
 * Pagination schemas
 */

/**
 * Start record parameter (1-based indexing)
 */
export const StartRecordSchema = PositiveIntegerSchema.default(1);

/**
 * Maximum records parameter
 */
export const MaximumRecordsSchema = PositiveIntegerSchema.max(500).default(10);

/**
 * Total records count
 */
export const TotalRecordsSchema = NonNegativeIntegerSchema;

/**
 * Pagination info schema
 */
export const PaginationSchema = z.object({
  startRecord: StartRecordSchema,
  maximumRecords: MaximumRecordsSchema,
  totalRecords: TotalRecordsSchema.optional(),
});

/**
 * Common response format schemas
 */

/**
 * API response format types
 */
export const ResponseFormatSchema = z.enum([
  "xml",
  "json",
  "rss",
  "atom",
  "html",
]);

/**
 * Sort order schema
 */
export const SortOrderSchema = z.enum(["asc", "desc"]).default("asc");

/**
 * Language code schema (ISO 639-1)
 */
export const LanguageCodeSchema = z.string().length(2).toLowerCase();

/**
 * Record format schemas for NDL
 */

/**
 * NDL record formats
 */
export const NDLRecordFormatSchema = z.enum([
  "dcndl",
  "dc",
  "dcterms",
  "mods",
  "marc21",
  "oai_dc",
]);

/**
 * Dublin Core namespace schema
 */
export const DCNamespaceSchema = z.object({
  "xmlns:dc": z.literal("http://purl.org/dc/elements/1.1/").optional(),
  "xmlns:dcterms": z.literal("http://purl.org/dc/terms/").optional(),
  "xmlns:dcndl": z.literal("http://ndl.go.jp/dcndl/terms/").optional(),
});

/**
 * Identifier schemas
 */

/**
 * ISBN schema (with or without hyphens)
 */
export const ISBNSchema = z.string().regex(
  /^(?:978|979)?[\d\-]{9,17}[\dX]$/i,
  "Invalid ISBN format",
);

/**
 * ISSN schema
 */
export const ISSNSchema = z.string().regex(
  /^\d{4}-\d{3}[\dX]$/,
  "Invalid ISSN format",
);

/**
 * NDL identifier schema (JP number)
 */
export const JPNumberSchema = z.string().regex(
  /^JP\d{8}$/,
  "Invalid JP number format",
);

/**
 * DOI schema
 */
export const DOISchema = z.string().regex(
  /^10\.\d+\/.+$/,
  "Invalid DOI format",
);

/**
 * Common identifier union
 */
export const IdentifierSchema = z.union([
  ISBNSchema,
  ISSNSchema,
  JPNumberSchema,
  DOISchema,
  NonEmptyStringSchema, // fallback for other identifiers
]);

/**
 * Error handling schemas
 */

/**
 * HTTP status code schema
 */
export const HTTPStatusSchema = z.number().int().min(100).max(599);

/**
 * Error severity levels
 */
export const ErrorSeveritySchema = z.enum([
  "info",
  "warning",
  "error",
  "fatal",
]);

/**
 * Utility type extraction
 */

// Type exports for use in other modules
export type NonEmptyString = z.infer<typeof NonEmptyStringSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;
export type SortOrder = z.infer<typeof SortOrderSchema>;
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;
export type NDLRecordFormat = z.infer<typeof NDLRecordFormatSchema>;
export type Identifier = z.infer<typeof IdentifierSchema>;
export type HTTPStatus = z.infer<typeof HTTPStatusSchema>;
export type ErrorSeverity = z.infer<typeof ErrorSeveritySchema>;
