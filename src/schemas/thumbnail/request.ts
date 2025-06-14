/**
 * NDL Thumbnail API Request Schemas
 *
 * 国立国会図書館 サムネイル取得APIのリクエストパラメータ定義
 */

import { z } from "zod";

/**
 * サムネイル取得リクエストパラメータ
 */
export const ThumbnailRequestSchema = z.object({
  /**
   * 識別子（ISBN等）
   */
  id: z.string().min(1, "識別子は必須です"),
});

export type ThumbnailRequest = z.infer<typeof ThumbnailRequestSchema>;

/**
 * サムネイル存在確認リクエストパラメータ
 */
export const ThumbnailExistsRequestSchema = ThumbnailRequestSchema;

export type ThumbnailExistsRequest = ThumbnailRequest;
