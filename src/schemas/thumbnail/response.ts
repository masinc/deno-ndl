/**
 * NDL Thumbnail API Response Schemas
 *
 * 国立国会図書館 サムネイル取得APIのレスポンス定義
 */

import { z } from "zod";

/**
 * サムネイル画像メタデータ
 */
export const ThumbnailMetadataSchema: z.ZodType<{
  size: string;
  format: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  fileSize: number;
  width: number;
  height: number;
  lastModified?: string;
}> = z.object({
  /**
   * 画像サイズ
   */
  size: z.string(), // "128x128" 形式

  /**
   * 画像形式
   */
  format: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),

  /**
   * ファイルサイズ（バイト）
   */
  fileSize: z.number().positive(),

  /**
   * 幅（ピクセル）
   */
  width: z.number().positive(),

  /**
   * 高さ（ピクセル）
   */
  height: z.number().positive(),

  /**
   * 最終更新日時
   */
  lastModified: z.string().optional(),
});

/**
 * サムネイル画像メタデータ
 *
 * サムネイル画像の詳細情報を含むメタデータ型です。
 * 画像のサイズ、形式、ファイルサイズ、最終更新日時などの情報を含みます。
 *
 * @example
 * ```typescript
 * const metadata: ThumbnailMetadata = {
 *   size: "128x128",
 *   format: "image/jpeg",
 *   fileSize: 12345,
 *   width: 128,
 *   height: 128,
 *   lastModified: "2024-01-01T00:00:00Z"
 * };
 * ```
 */
export type ThumbnailMetadata = z.infer<typeof ThumbnailMetadataSchema>;

/**
 * サムネイル取得成功レスポンス
 */
export const ThumbnailResponseSchema: z.ZodType<{
  id: string;
  imageData: Uint8Array;
  metadata: ThumbnailMetadata;
  imageUrl: string;
}> = z.object({
  /**
   * 識別子
   */
  id: z.string(),

  /**
   * 画像データ（バイナリ）
   */
  imageData: z.instanceof(Uint8Array),

  /**
   * 画像メタデータ
   */
  metadata: ThumbnailMetadataSchema,

  /**
   * 画像URL（参考）
   */
  imageUrl: z.string().url(),
});

/**
 * サムネイル取得レスポンス
 *
 * NDL Thumbnail APIからのサムネイル画像取得成功時のレスポンスデータです。
 * 画像のバイナリデータとメタデータ、元のURLが含まれます。
 *
 * @example
 * ```typescript
 * const response: ThumbnailResponse = {
 *   id: "9784422311074",
 *   imageData: new Uint8Array([...]), // JPEGバイナリデータ
 *   metadata: {
 *     size: "128x128",
 *     format: "image/jpeg",
 *     fileSize: 12345,
 *     width: 128,
 *     height: 128
 *   },
 *   imageUrl: "https://ndlsearch.ndl.go.jp/thumbnail/9784422311074.jpg"
 * };
 * ```
 */
export type ThumbnailResponse = z.infer<typeof ThumbnailResponseSchema>;

/**
 * サムネイル存在確認レスポンス
 */
export const ThumbnailExistsResponseSchema: z.ZodType<{
  id: string;
  exists: boolean;
  checkedAt: string;
}> = z.object({
  /**
   * 識別子
   */
  id: z.string(),

  /**
   * サムネイルが存在するか
   */
  exists: z.boolean(),

  /**
   * 最後に確認した日時
   */
  checkedAt: z.string(),
});

/**
 * サムネイル存在確認レスポンス
 *
 * NDL Thumbnail APIでのサムネイル画像存在確認結果です。
 * HEADリクエストによる高速な存在確認の結果が含まれます。
 *
 * @example
 * ```typescript
 * const response: ThumbnailExistsResponse = {
 *   id: "9784422311074",
 *   exists: true,
 *   checkedAt: "2024-01-01T12:00:00Z"
 * };
 * ```
 */
export type ThumbnailExistsResponse = z.infer<
  typeof ThumbnailExistsResponseSchema
>;
