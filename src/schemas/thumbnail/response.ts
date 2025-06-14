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

export type ThumbnailExistsResponse = z.infer<
  typeof ThumbnailExistsResponseSchema
>;
