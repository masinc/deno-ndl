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

/**
 * SRU操作タイプ
 *
 * SRU APIで実行可能な操作の種類を定義します。
 * - "searchRetrieve": 検索と取得操作
 * - "explain": サービス情報の説明取得
 */
export type SRUOperation = z.infer<typeof SRUOperationSchema>;

/**
 * SRUプロトコルバージョン
 *
 * サポートされるSRUプロトコルのバージョンを定義します。
 * NDL APIでは1.1と1.2がサポートされており、デフォルトは1.2です。
 */
export type SRUVersion = z.infer<typeof SRUVersionSchema>;

/**
 * CQLクエリ文字列
 *
 * Contextual Query Language（CQL）形式の検索クエリを表す型です。
 * SRU APIでの高度な検索条件指定に使用されます。
 *
 * @example
 * ```typescript
 * const query: CQLQuery = 'title="夏目漱石" AND creator="夏目金之助"';
 * ```
 */
export type CQLQuery = z.infer<typeof CQLQuerySchema>;

/**
 * SRUレコードスキーマ識別子
 *
 * 検索結果のメタデータ形式を指定する識別子です。
 * Dublin Core、MODS、MARCXML、DC-NDLなどの標準形式をサポートします。
 */
export type SRURecordSchema = z.infer<typeof SRURecordSchemaSchema>;

/**
 * SRUレコードパッキング形式
 *
 * 検索結果レコードの配信形式を指定します。
 * - "xml": XMLデータとして配信
 * - "string": 文字列として配信
 */
export type SRURecordPacking = z.infer<typeof SRURecordPackingSchema>;

/**
 * SRUソート指定
 *
 * 検索結果のソート方法を指定する文字列です。
 * "index direction" 形式で、directionは "ascending" または "descending" です。
 */
export type SRUSortBy = z.infer<typeof SRUSortBySchema>;

/**
 * SRU結果セットTTL（生存時間）
 *
 * 検索結果セットをサーバー側で保持する時間を秒単位で指定します。
 * 最大3600秒（1時間）まで指定可能です。
 */
export type SRUResultSetTTL = z.infer<typeof SRUResultSetTTLSchema>;

/**
 * SRUスタイルシート
 *
 * 検索結果の変換に使用するXSLTスタイルシートのURLを指定します。
 */
export type SRUStylesheet = z.infer<typeof SRUStylesheetSchema>;

/**
 * SRU検索取得リクエストパラメータ
 *
 * SRU searchRetrieve操作で使用される全パラメータを定義する型です。
 * CQLクエリ、検索結果数、開始位置、メタデータ形式などを含みます。
 *
 * @example
 * ```typescript
 * const request: SRUSearchRetrieveRequest = {
 *   operation: "searchRetrieve",
 *   version: "1.2",
 *   query: 'title="吾輩は猫である"',
 *   maximumRecords: 10,
 *   startRecord: 1,
 *   recordSchema: "dcndl"
 * };
 * ```
 */
export type SRUSearchRetrieveRequest = z.infer<
  typeof SRUSearchRetrieveRequestSchema
>;

/**
 * SRU説明リクエストパラメータ
 *
 * SRU explain操作で使用されるパラメータを定義する型です。
 * サービスの機能や利用可能なインデックス情報を取得する際に使用します。
 */
export type SRUExplainRequest = z.infer<typeof SRUExplainRequestSchema>;

/**
 * SRUリクエスト
 *
 * 全てのSRU操作（searchRetrieve、explain）のリクエストパラメータの統合型です。
 */
export type SRURequest = z.infer<typeof SRURequestSchema>;
