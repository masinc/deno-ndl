/**
 * NDL Thumbnail API Client
 *
 * 国立国会図書館のサムネイル画像取得API
 */

import { err, ok, type Result } from "neverthrow";
import type {
  ThumbnailExistsRequest,
  ThumbnailExistsResponse,
  ThumbnailRequest,
  ThumbnailResponse,
} from "../schemas/thumbnail/mod.ts";
import { type NDLError, networkError, validationError } from "../errors.ts";

/**
 * NDL Thumbnail API Base URL
 */
const THUMBNAIL_API_BASE_URL = "https://ndlsearch.ndl.go.jp/thumbnail";

/**
 * Build thumbnail image URL
 */
export function buildThumbnailURL(request: ThumbnailRequest): string {
  return `${THUMBNAIL_API_BASE_URL}/${request.id}.jpg`;
}

/**
 * 国立国会図書館から書影画像を取得します
 *
 * 指定された識別子（ISBN等）に対応する書影画像をNDL Thumbnail APIから取得し、
 * バイナリデータとメタデータを含むレスポンスを返します。
 *
 * @param request - サムネイル取得リクエスト
 * @param request.id - 書誌識別子（ISBN、JP番号等）
 * @param options - 取得オプション
 * @param options.timeout - タイムアウト時間（ミリ秒、デフォルト: 10000）
 * @param options.cache - キャッシュ使用フラグ（デフォルト: true）
 *
 * @returns サムネイル取得結果。成功時は画像データとメタデータ、失敗時はエラー情報
 *
 * @example 基本的な使用例
 * ```typescript
 * import { fetchThumbnail } from "@masinc/ndl";
 *
 * const result = await fetchThumbnail({ id: "9784422311074" });
 * if (result.isOk()) {
 *   const thumbnail = result.value;
 *   console.log(`取得: ${thumbnail.id}`);
 *   console.log(`サイズ: ${thumbnail.metadata.fileSize} bytes`);
 *   console.log(`形式: ${thumbnail.metadata.format}`);
 * } else {
 *   console.error("取得失敗:", result.error.message);
 * }
 * ```
 *
 * @example オプション指定
 * ```typescript
 * const result = await fetchThumbnail(
 *   { id: "9784422311074" },
 *   { timeout: 5000, cache: false }
 * );
 * ```
 *
 * @example エラーハンドリング
 * ```typescript
 * import { fetchThumbnail, isNetworkError, isValidationError } from "@masinc/ndl";
 *
 * const result = await fetchThumbnail({ id: "invalid-id" });
 * if (result.isErr()) {
 *   if (isValidationError(result.error)) {
 *     console.log("サムネイルが見つかりません");
 *   } else if (isNetworkError(result.error)) {
 *     console.log("ネットワークエラー:", result.error.statusCode);
 *   }
 * }
 * ```
 *
 * @see {@link https://ndlsearch.ndl.go.jp/help/api/specifications | NDL検索API仕様}
 */
export async function fetchThumbnail(
  request: ThumbnailRequest,
  options: {
    timeout?: number;
    cache?: boolean;
  } = {},
): Promise<Result<ThumbnailResponse, NDLError>> {
  try {
    const url = buildThumbnailURL(request);
    const { timeout = 10000, cache = true } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: cache ? "default" : "no-cache",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return err(
            validationError(
              `Thumbnail not found for id: ${request.id}`,
            ),
          );
        }
        return err(
          networkError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
          ),
        );
      }

      // 画像データを取得
      const imageData = new Uint8Array(await response.arrayBuffer());

      // Content-Typeから画像形式を判定
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const contentLength = response.headers.get("content-length");
      const lastModified = response.headers.get("last-modified");

      const thumbnailResponse: ThumbnailResponse = {
        id: request.id,
        imageData,
        metadata: {
          size: `${imageData.length} bytes`,
          format: contentType as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          fileSize: contentLength
            ? parseInt(contentLength, 10)
            : imageData.length,
          width: 0, // 実際の画像解析で取得
          height: 0, // 実際の画像解析で取得
          lastModified: lastModified || undefined,
        },
        imageUrl: url,
      };

      return ok(thumbnailResponse);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        return err(networkError("Request timeout", 408));
      }
      throw error;
    }
  } catch (error) {
    return err(
      networkError(
        `Failed to fetch thumbnail: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}

/**
 * 指定された識別子のサムネイル画像が存在するかを確認します
 *
 * HEADリクエストを使用してサムネイル画像の存在確認を行います。
 * 実際の画像データをダウンロードせずに、存在の有無のみを高速で確認できます。
 *
 * @param request - サムネイル存在確認リクエスト
 * @param request.id - 書誌識別子（ISBN、JP番号等）
 * @param options - 確認オプション
 * @param options.timeout - タイムアウト時間（ミリ秒、デフォルト: 5000）
 *
 * @returns 存在確認結果。成功時は存在フラグと確認日時、失敗時はエラー情報
 *
 * @example 基本的な使用例
 * ```typescript
 * import { thumbnailExists } from "@masinc/ndl";
 *
 * const result = await thumbnailExists({ id: "9784422311074" });
 * if (result.isOk()) {
 *   if (result.value.exists) {
 *     console.log("サムネイルが存在します");
 *   } else {
 *     console.log("サムネイルは存在しません");
 *   }
 *   console.log("確認日時:", result.value.checkedAt);
 * }
 * ```
 *
 * @example fetchThumbnailの前の事前チェック
 * ```typescript
 * import { thumbnailExists, fetchThumbnail } from "@masinc/ndl";
 *
 * const existsResult = await thumbnailExists({ id: "9784422311074" });
 * if (existsResult.isOk() && existsResult.value.exists) {
 *   // 存在することが確認できたので画像データを取得
 *   const fetchResult = await fetchThumbnail({ id: "9784422311074" });
 *   // ...
 * }
 * ```
 *
 * @example バッチ処理での存在確認
 * ```typescript
 * const ids = ["9784422311074", "9784000000000", "invalid-id"];
 *
 * for (const id of ids) {
 *   const result = await thumbnailExists({ id });
 *   if (result.isOk()) {
 *     console.log(`${id}: ${result.value.exists ? "存在" : "なし"}`);
 *   }
 * }
 * ```
 */
export async function thumbnailExists(
  request: ThumbnailExistsRequest,
  options: {
    timeout?: number;
  } = {},
): Promise<Result<ThumbnailExistsResponse, NDLError>> {
  try {
    const { timeout = 5000 } = options;

    // HEADリクエストで存在確認
    const url = buildThumbnailURL(request);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const exists = response.ok;

      return ok({
        id: request.id,
        exists,
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        return err(networkError("Request timeout", 408));
      }
      throw error;
    }
  } catch (error) {
    return err(
      networkError(
        `Failed to check thumbnail existence: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}

/**
 * 取得したサムネイル画像をファイルに保存します（Deno環境専用）
 *
 * fetchThumbnail()で取得したサムネイル画像データをローカルファイルシステムに保存します。
 * この関数はDeno環境でのみ動作し、適切なファイル書き込み権限が必要です。
 *
 * @param thumbnailResponse - fetchThumbnail()で取得したサムネイルレスポンス
 * @param filepath - 保存先ファイルパス（相対パスまたは絶対パス）
 *
 * @returns 保存結果。成功時はvoid、失敗時はエラー情報
 *
 * @example 基本的な使用例
 * ```typescript
 * import { fetchThumbnail, saveThumbnailToFile } from "@masinc/ndl";
 *
 * const result = await fetchThumbnail({ id: "9784422311074" });
 * if (result.isOk()) {
 *   const saveResult = await saveThumbnailToFile(result.value, "thumbnail.jpg");
 *   if (saveResult.isOk()) {
 *     console.log("ファイル保存完了");
 *   } else {
 *     console.error("保存失敗:", saveResult.error.message);
 *   }
 * }
 * ```
 *
 * @example ディレクトリ作成付きの保存
 * ```typescript
 * import { fetchThumbnail, saveThumbnailToFile } from "@masinc/ndl";
 * import { ensureDir } from "https://deno.land/std/fs/mod.ts";
 *
 * const result = await fetchThumbnail({ id: "9784422311074" });
 * if (result.isOk()) {
 *   // ディレクトリを作成してから保存
 *   await ensureDir("./thumbnails");
 *   const saveResult = await saveThumbnailToFile(
 *     result.value,
 *     "./thumbnails/9784422311074.jpg"
 *   );
 * }
 * ```
 *
 * @example バッチダウンロード
 * ```typescript
 * const ids = ["9784422311074", "9784000000000"];
 *
 * for (const id of ids) {
 *   const result = await fetchThumbnail({ id });
 *   if (result.isOk()) {
 *     await saveThumbnailToFile(result.value, `./images/${id}.jpg`);
 *     console.log(`保存完了: ${id}`);
 *   }
 * }
 * ```
 *
 * @remarks
 * - この関数はDeno環境専用です
 * - ファイル書き込み権限（--allow-write）が必要です
 * - 既存ファイルは上書きされます
 * - 保存先ディレクトリが存在しない場合はエラーになります
 */
export async function saveThumbnailToFile(
  thumbnailResponse: ThumbnailResponse,
  filepath: string,
): Promise<Result<void, NDLError>> {
  try {
    await Deno.writeFile(filepath, thumbnailResponse.imageData);
    return ok(undefined);
  } catch (error) {
    return err(
      validationError(
        `Failed to save thumbnail: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );
  }
}
