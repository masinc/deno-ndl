import { err, ok, type Result } from "neverthrow";
import type { NDLError } from "../errors.ts";
import { apiError, networkError } from "../errors.ts";

/**
 * Fetch wrapper that returns Result type
 * Uses the same signature as the standard fetch function
 *
 * @param input - Request URL or Request object
 * @param init - Fetch options
 * @returns Result containing response text or NDL error
 */
export async function fetchAsResult(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Result<string, NDLError<Response | unknown>>> {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      return err(apiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response,
      ));
    }

    const text = await response.text();
    return ok(text);
  } catch (error) {
    return err(networkError("Network request failed", error));
  }
}

/**
 * Build URL with query parameters
 *
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns URL with query parameters
 */
export function buildURL(
  baseUrl: string | URL,
  params: Record<string, string | number | boolean | undefined> = {},
): URL {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}
