/**
 * SRU API schemas
 *
 * This module contains Zod schemas for validating SRU (Search/Retrieve via URL) API
 * requests and responses for the National Diet Library.
 *
 * @module
 */

// Request schemas
export {
  type CQLQuery,
  CQLQuerySchema,
  type SRUExplainRequest,
  SRUExplainRequestSchema,
  type SRUOperation,
  SRUOperationSchema,
  type SRURecordPacking,
  SRURecordPackingSchema,
  type SRURecordSchema as SRURecordSchemaType,
  SRURecordSchemaSchema as SRURecordSchemaSchemaExported,
  type SRURequest,
  SRURequestSchema,
  type SRUResultSetTTL,
  SRUResultSetTTLSchema,
  type SRUSearchRetrieveRequest,
  SRUSearchRetrieveRequestSchema,
  type SRUSortBy,
  SRUSortBySchema,
  type SRUStylesheet,
  SRUStylesheetSchema,
  type SRUVersion,
  SRUVersionSchema,
} from "./request.ts";

// Response schemas
export {
  type ParsedSRUResponse,
  ParsedSRUResponseSchema,
  type SRUConfigInfo,
  SRUConfigInfoSchema,
  type SRUDatabaseInfo,
  SRUDatabaseInfoSchema,
  type SRUDiagnostic,
  type SRUDiagnostics,
  SRUDiagnosticSchema,
  SRUDiagnosticsSchema,
  type SRUExplainResponse,
  SRUExplainResponseSchema,
  type SRUIndexInfo,
  SRUIndexInfoSchema,
  type SRURecord,
  type SRURecords,
  SRURecordSchema,
  SRURecordsSchema,
  type SRUResponse,
  SRUResponseSchema,
  type SRUSchemaInfo,
  SRUSchemaInfoSchema,
  type SRUSearchRetrieveResponse,
  SRUSearchRetrieveResponseSchema,
} from "./response.ts";

// Query builder schemas
export {
  type AdvancedSearchParams,
  AdvancedSearchParamsSchema,
  type CQLBooleanOperator,
  CQLBooleanOperatorSchema,
  type CQLBuilderOptions,
  CQLBuilderOptionsSchema,
  type CQLComparison,
  CQLComparisonSchema,
  type CQLOperator,
  CQLOperatorSchema,
  type DateRange,
  DateRangeSchema,
  type NDLLanguageCode,
  NDLLanguageCodeSchema,
  type NDLMaterialType,
  NDLMaterialTypeSchema,
  type NDLSearchField,
  NDLSearchFieldSchema,
  type QueryValidationResult,
  QueryValidationResultSchema,
  type SearchField,
  SearchFieldSchema,
  type SimpleSearchParams,
  SimpleSearchParamsSchema,
} from "./query-builder.ts";
