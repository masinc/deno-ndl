/**
 * NDL Thumbnail API Request Schemas
 *
 * 国立国会図書館 サムネイル取得APIのリクエストパラメータ定義
 */

import { z } from "zod";

/**
 * サムネイル取得リクエストパラメータ
 */
export const ThumbnailRequestSchema: z.ZodType<{
  id: string;
}> = z.object({
  /**
   * 識別子（ISBN等）
   */
  id: z.string().min(1, "識別子は必須です"),
});

/**
 * サムネイル取得リクエストパラメータ
 *
 * NDL Thumbnail APIでサムネイル画像を取得するためのリクエストパラメータです。
 * 書誌識別子（ISBN、JP番号等）を指定してサムネイル画像を取得します。
 *
 * @example
 * ```typescript
 * const request: ThumbnailRequest = {
 *   id: "9784422311074" // ISBN
 * };
 * ```
 */
export type ThumbnailRequest = z.infer<typeof ThumbnailRequestSchema>;

/**
 * サムネイル存在確認リクエストパラメータ
 */
export const ThumbnailExistsRequestSchema: z.ZodType<{
  id: string;
}> = ThumbnailRequestSchema;

/**
 * サムネイル存在確認リクエストパラメータ
 *
 * NDL Thumbnail APIでサムネイル画像の存在を確認するためのリクエストパラメータです。
 * HEADリクエストを使用して画像データをダウンロードせずに存在確認を行います。
 *
 * @example
 * ```typescript
 * const request: ThumbnailExistsRequest = {
 *   id: "9784422311074" // ISBN
 * };
 * ```
 */
export type ThumbnailExistsRequest = ThumbnailRequest;
