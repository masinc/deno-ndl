/**
 * NDL Thumbnail API Schemas
 *
 * 国立国会図書館 サムネイル取得APIのスキーマ定義
 */

// Request schemas
export {
  type ThumbnailExistsRequest,
  ThumbnailExistsRequestSchema,
  type ThumbnailRequest,
  ThumbnailRequestSchema,
} from "./request.ts";

// Response schemas
export {
  type ThumbnailExistsResponse,
  ThumbnailExistsResponseSchema,
  type ThumbnailMetadata,
  ThumbnailMetadataSchema,
  type ThumbnailResponse,
  ThumbnailResponseSchema,
} from "./response.ts";
