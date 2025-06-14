import { z } from "zod/v4";
import { MaximumRecordsSchema } from "../common.ts";

/**
 * OpenSearch API request parameter schemas
 */

/**
 * OpenSearch query parameter schema
 */
export const OpenSearchQuerySchema: z.ZodString = z.string().min(
  1,
  "Query cannot be empty",
);

/**
 * OpenSearch count parameter (equivalent to maximumRecords)
 */
export const OpenSearchCountSchema = MaximumRecordsSchema;

/**
 * OpenSearch API request parameters schema
 */
export const OpenSearchRequestSchema: z.ZodType<{
  q: string;
  count?: number;
  start?: number;
  format?: "rss" | "atom";
  hl?: "ja" | "en";
}> = z.object({
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

/**
 * OpenSearch検索クエリ文字列
 *
 * OpenSearch APIで使用する検索キーワードやフレーズを表す型です。
 * 空文字列は許可されず、最低1文字以上の文字列である必要があります。
 */
export type OpenSearchQuery = z.infer<typeof OpenSearchQuerySchema>;

/**
 * OpenSearch検索結果数
 *
 * 1回のAPIリクエストで取得する検索結果の件数を指定する型です。
 * 1から500の範囲で指定可能で、デフォルトは20件です。
 */
export type OpenSearchCount = z.infer<typeof OpenSearchCountSchema>;

/**
 * OpenSearch APIリクエストパラメータ
 *
 * NDL OpenSearch APIに送信するリクエストの全パラメータを定義する型です。
 * 検索クエリ、結果数、開始位置、出力形式、言語設定などを含みます。
 *
 * @example
 * ```typescript
 * const request: OpenSearchRequest = {
 *   q: "夏目漱石",
 *   count: 10,
 *   start: 0,
 *   format: "rss",
 *   hl: "ja"
 * };
 * ```
 */
export type OpenSearchRequest = z.infer<typeof OpenSearchRequestSchema>;

/**
 * OpenSearch URLテンプレート
 *
 * OpenSearch Description DocumentのURL要素で使用されるテンプレート形式を定義する型です。
 * 検索パラメータの動的な置換をサポートします。
 */
export type OpenSearchUrlTemplate = z.infer<typeof OpenSearchUrlTemplateSchema>;
