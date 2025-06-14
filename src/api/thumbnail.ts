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
 * Fetch thumbnail image
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
 * Check if thumbnail exists
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
 * Save thumbnail to file (for Deno environments)
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
