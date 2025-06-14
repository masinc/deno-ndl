/**
 * CQL Query Builder schemas using Zod v4
 * 
 * Type-safe query building for SRU API with validation
 * 
 * @module
 */

import { z } from "zod/v4";

/**
 * CQL search operators
 */
export const CQLOperatorSchema = z.enum([
  "=",        // Exact match
  "exact",    // Exact match (alias)
  "all",      // All words must be present
  "any",      // Any word can be present
  "adj",      // Adjacent words (phrase search)
  "contains", // Contains the term
  "starts",   // Starts with
  "ends",     // Ends with
]).default("=");

/**
 * CQL comparison operators for numeric/date fields
 */
export const CQLComparisonSchema = z.enum([
  "=", ">", "<", ">=", "<=", "<>"
]).default("=");

/**
 * Boolean operators for combining queries
 */
export const CQLBooleanOperatorSchema = z.enum([
  "AND", "OR", "NOT"
]).default("AND");

/**
 * NDL search fields
 */
export const NDLSearchFieldSchema = z.enum([
  "title",        // タイトル
  "creator",      // 作成者・著者
  "subject",      // 件名
  "description",  // 内容記述
  "publisher",    // 出版者
  "contributor",  // 寄与者
  "date",         // 日付
  "type",         // 資料種別
  "format",       // 形式
  "identifier",   // 識別子
  "source",       // 情報源
  "language",     // 言語
  "relation",     // 関係
  "coverage",     // 範囲
  "rights",       // 権利
  "isbn",         // ISBN
  "issn",         // ISSN
  "jpno",         // JP番号
  "ndlna",        // NDL書誌ID
  "anywhere",     // 全項目
]);

/**
 * Language codes supported by NDL
 */
export const NDLLanguageCodeSchema = z.enum([
  "jpn",    // 日本語
  "eng",    // 英語
  "chi",    // 中国語
  "kor",    // 韓国語
  "fre",    // フランス語
  "ger",    // ドイツ語
  "rus",    // ロシア語
  "spa",    // スペイン語
  "ita",    // イタリア語
  "por",    // ポルトガル語
]);

/**
 * Material types in NDL
 */
export const NDLMaterialTypeSchema = z.enum([
  "Book",           // 図書
  "Article",        // 記事・論文
  "Journal",        // 雑誌
  "Newspaper",      // 新聞
  "Thesis",         // 博士論文
  "Map",            // 地図
  "Music",          // 楽譜
  "Video",          // 映像資料
  "Sound",          // 音声資料
  "Software",       // 電子資料
  "Website",        // ウェブサイト
  "Database",       // データベース
]);

/**
 * Date range schema
 */
export const DateRangeSchema = z.object({
  /**
   * Start date (YYYY or YYYY-MM-DD format)
   */
  from: z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/).optional(),
  
  /**
   * End date (YYYY or YYYY-MM-DD format)
   */
  to: z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/).optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return data.from <= data.to;
    }
    return true;
  },
  {
    message: "Start date must be before or equal to end date",
  }
);

/**
 * Individual search field schema
 */
export const SearchFieldSchema = z.object({
  /**
   * Search field name
   */
  field: NDLSearchFieldSchema,
  
  /**
   * Search value
   */
  value: z.string().min(1, "Search value cannot be empty"),
  
  /**
   * Search operator
   */
  operator: CQLOperatorSchema.optional(),
  
  /**
   * Case sensitivity (not widely supported in CQL)
   */
  caseSensitive: z.boolean().optional(),
});

/**
 * Simple search parameters schema
 * For common search scenarios with intuitive field names
 */
export const SimpleSearchParamsSchema = z.object({
  /**
   * Title search
   */
  title: z.string().optional(),
  
  /**
   * Creator/author search
   */
  creator: z.string().optional(),
  
  /**
   * Subject search
   */
  subject: z.string().optional(),
  
  /**
   * Publisher search
   */
  publisher: z.string().optional(),
  
  /**
   * ISBN search (will be cleaned of hyphens automatically)
   */
  isbn: z.string().regex(/^[\d\-X]+$/, "Invalid ISBN format").optional(),
  
  /**
   * ISSN search
   */
  issn: z.string().regex(/^\d{4}-\d{3}[\dX]$/, "Invalid ISSN format").optional(),
  
  /**
   * JP number search
   */
  jpno: z.string().optional(),
  
  /**
   * Language filter
   */
  language: z.union([
    NDLLanguageCodeSchema,
    z.array(NDLLanguageCodeSchema)
  ]).optional(),
  
  /**
   * Publication date range
   */
  dateRange: DateRangeSchema.optional(),
  
  /**
   * Material type
   */
  type: NDLMaterialTypeSchema.optional(),
  
  /**
   * Full text search across all fields
   */
  anywhere: z.string().optional(),
  
  /**
   * Description/content search
   */
  description: z.string().optional(),
  
  /**
   * Fields to exclude from results
   */
  exclude: z.object({
    title: z.string().optional(),
    creator: z.string().optional(),
    subject: z.string().optional(),
    language: z.union([
      NDLLanguageCodeSchema,
      z.array(NDLLanguageCodeSchema)
    ]).optional(),
    type: NDLMaterialTypeSchema.optional(),
  }).optional(),
});

/**
 * Advanced search parameters schema
 * For complex queries with multiple fields and boolean logic
 */
export const AdvancedSearchParamsSchema = z.object({
  /**
   * Individual search fields with specific operators
   */
  fields: z.array(SearchFieldSchema).optional(),
  
  /**
   * Boolean operator for combining fields
   */
  operator: CQLBooleanOperatorSchema.optional(),
  
  /**
   * Boolean operator for combining groups
   */
  groupOperator: CQLBooleanOperatorSchema.optional(),
});

/**
 * CQL query builder options schema
 */
export const CQLBuilderOptionsSchema = z.object({
  /**
   * Default operator for combining search terms
   */
  defaultOperator: CQLBooleanOperatorSchema.default("AND"),
  
  /**
   * Whether to escape special characters automatically
   */
  autoEscape: z.boolean().default(true),
  
  /**
   * Whether to add parentheses around complex expressions
   */
  addParentheses: z.boolean().default(true),
  
  /**
   * Default search operator for text fields
   */
  defaultTextOperator: CQLOperatorSchema.default("="),
});

/**
 * Query validation result schema
 */
export const QueryValidationResultSchema = z.object({
  /**
   * Whether the query is valid
   */
  isValid: z.boolean(),
  
  /**
   * Generated CQL query string
   */
  query: z.string(),
  
  /**
   * Validation errors if any
   */
  errors: z.array(z.string()).default([]),
  
  /**
   * Warnings about query construction
   */
  warnings: z.array(z.string()).default([]),
  
  /**
   * Estimated complexity score (1-10)
   */
  complexity: z.number().min(1).max(10).default(1),
});

/**
 * Type exports
 */
export type CQLOperator = z.infer<typeof CQLOperatorSchema>;
export type CQLComparison = z.infer<typeof CQLComparisonSchema>;
export type CQLBooleanOperator = z.infer<typeof CQLBooleanOperatorSchema>;
export type NDLSearchField = z.infer<typeof NDLSearchFieldSchema>;
export type NDLLanguageCode = z.infer<typeof NDLLanguageCodeSchema>;
export type NDLMaterialType = z.infer<typeof NDLMaterialTypeSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type SearchField = z.infer<typeof SearchFieldSchema>;
export type SimpleSearchParams = z.infer<typeof SimpleSearchParamsSchema>;
export type AdvancedSearchParams = z.infer<typeof AdvancedSearchParamsSchema>;
export type CQLBuilderOptions = z.infer<typeof CQLBuilderOptionsSchema>;
export type QueryValidationResult = z.infer<typeof QueryValidationResultSchema>;