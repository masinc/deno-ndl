/**
 * # Deno NDL API Library
 *
 * 国立国会図書館（NDL）APIの型安全なDenoライブラリです。
 * TypeScriptとZodによる厳密な型検証、neverthrowによる関数型エラー処理を提供します。
 *
 * ## 主な機能
 *
 * - **SRU検索API**: CQL検索クエリによる高度な書誌検索
 * - **OpenSearch API**: RSS/Atom形式での検索結果取得
 * - **Thumbnail API**: 書影画像の取得と存在確認
 * - **型安全**: TypeScript完全対応とZodによるランタイム検証
 * - **エラーハンドリング**: neverthrowによる堅牢なエラー処理
 *
 * @example 基本的な書誌検索
 * ```typescript
 * import { searchSRU } from "@masinc/ndl";
 *
 * const result = await searchSRU("夏目漱石", { count: 10 });
 * if (result.isOk()) {
 *   const { items, pagination } = result.value;
 *   console.log(`見つかった件数: ${pagination.totalResults}`);
 *   items.forEach(item => {
 *     console.log(`${item.title} by ${item.authors?.join(", ")}`);
 *   });
 * } else {
 *   console.error("検索エラー:", result.error.message);
 * }
 * ```
 *
 * @example OpenSearch検索
 * ```typescript
 * import { searchOpenSearch } from "@masinc/ndl";
 *
 * const result = await searchOpenSearch("芥川龍之介", { count: 5 });
 * if (result.isOk()) {
 *   result.value.items.forEach(item => {
 *     console.log(item.title);
 *   });
 * }
 * ```
 *
 * @example サムネイル画像取得
 * ```typescript
 * import { fetchThumbnail, saveThumbnailToFile } from "@masinc/ndl";
 *
 * const result = await fetchThumbnail({ id: "9784422311074" });
 * if (result.isOk()) {
 *   console.log(`取得: ${result.value.id}`);
 *   await saveThumbnailToFile(result.value, "thumbnail.jpg");
 * }
 * ```
 *
 * @example エラーハンドリング
 * ```typescript
 * import { searchSRU, isAPIError, isNetworkError } from "@masinc/ndl";
 *
 * const result = await searchSRU("検索語");
 * if (result.isErr()) {
 *   if (isAPIError(result.error)) {
 *     console.error(`APIエラー: ${result.error.statusCode}`);
 *   } else if (isNetworkError(result.error)) {
 *     console.error(`ネットワークエラー: ${result.error.message}`);
 *   }
 * }
 * ```
 *
 * @see {@link https://ndlsearch.ndl.go.jp/help/api/specifications | NDL検索API仕様}
 * @see {@link https://jsr.io/@masinc/ndl | JSRパッケージページ}
 * @module
 */

// Core API functions
export { searchOpenSearch } from "./src/api/opensearch.ts";
export { searchSRU } from "./src/api/sru.ts";
export {
  fetchThumbnail,
  saveThumbnailToFile,
  thumbnailExists,
} from "./src/api/thumbnail.ts";

// Response types
export type { OpenSearchSearchResponse } from "./src/api/opensearch.ts";
export type { SRUSearchItem, SRUSearchResponse } from "./src/api/sru.ts";
export type { ThumbnailResponse } from "./src/schemas/thumbnail/mod.ts";

// Request types
export type { OpenSearchRequest } from "./src/schemas/opensearch/mod.ts";
export type { SimpleSearchParams } from "./src/schemas/sru/mod.ts";
export type { ThumbnailRequest } from "./src/schemas/thumbnail/mod.ts";

// Error handling
export type { NDLError } from "./src/errors.ts";
export { isAPIError, isNetworkError, isValidationError } from "./src/errors.ts";
