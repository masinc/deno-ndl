import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { apiError, networkError } from "../errors.ts";
import type { NDLError } from "../errors.ts";
import {
  type OpenSearchRequest,
  OpenSearchRequestSchema,
  type OpenSearchResponse,
  OpenSearchResponseSchema,
} from "../schemas/opensearch/mod.ts";
import { buildURL, fetchAsResult } from "../utils/http.ts";
import { safeParse } from "../schemas/utils.ts";

/**
 * OpenSearch API client for NDL Search
 */

/**
 * NDL OpenSearch API base URL
 */
const OPENSEARCH_API_BASE = "https://ndlsearch.ndl.go.jp/api/opensearch";

/**
 * Search NDL using OpenSearch API (Raw XML response)
 *
 * @param params - OpenSearch search parameters
 * @returns Promise<Result<OpenSearchResponse, NDLError>> - Raw parsed XML response
 *
 * @example
 * ```typescript
 * import { searchOpenSearchRaw } from "./api/opensearch.ts";
 *
 * const result = await searchOpenSearchRaw({
 *   q: "夏目漱石",
 *   count: 10,
 *   format: "rss"
 * });
 *
 * if (result.isOk()) {
 *   console.log("Raw XML response:", result.value);
 * } else {
 *   console.error("Search failed:", result.error);
 * }
 * ```
 */
export async function searchOpenSearchRaw(
  params: OpenSearchRequest,
): Promise<Result<OpenSearchResponse, NDLError>> {
  // Validate input parameters
  const paramsResult = safeParse(OpenSearchRequestSchema, params);
  if (paramsResult.isErr()) {
    return err(paramsResult.error);
  }

  const validatedParams = paramsResult.value;

  try {
    // Build API URL with query parameters
    const url = buildURL(OPENSEARCH_API_BASE, {
      q: validatedParams.q,
      count: validatedParams.count?.toString(),
      start: validatedParams.start?.toString(),
      format: validatedParams.format as string,
      hl: validatedParams.hl,
    });

    // Make HTTP request
    const response = await fetchAsResult(url);
    if (response.isErr()) {
      return err(response.error);
    }

    const responseText = response.value;

    // Parse XML response
    const parseResult = await parseOpenSearchResponse(responseText);
    if (parseResult.isErr()) {
      return err(parseResult.error);
    }

    return ok(parseResult.value);
  } catch (error) {
    return err(networkError(
      "Failed to perform OpenSearch request",
      error,
    ));
  }
}

/**
 * Parse OpenSearch XML response (RSS/Atom)
 *
 * @param xmlText - Raw XML response text
 * @returns Promise<Result<OpenSearchResponse, NDLError>>
 */
export async function parseOpenSearchResponse(
  xmlText: string,
): Promise<Result<OpenSearchResponse, NDLError>> {
  try {
    // Import XML parser dynamically to avoid bundling issues
    const { XMLParser } = await import("fast-xml-parser");

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@",
      textNodeName: "#text",
      parseAttributeValue: true,
      allowBooleanAttributes: true,
      trimValues: true,
    });

    const parsed = parser.parse(xmlText);

    // Validate parsed response against schema
    const validationResult = safeParse(OpenSearchResponseSchema, parsed);
    if (validationResult.isErr()) {
      return err(validationResult.error);
    }

    return ok(validationResult.value);
  } catch (error) {
    return err(apiError(
      "Failed to parse OpenSearch XML response",
      error,
    ));
  }
}

/**
 * Build OpenSearch query URL with parameters
 *
 * @param params - OpenSearch request parameters
 * @returns Formatted URL string
 *
 * @example
 * ```typescript
 * const url = buildOpenSearchURL({
 *   q: "search term",
 *   count: 20,
 *   format: "atom"
 * });
 * console.log(url); // "https://ndlsearch.ndl.go.jp/api/opensearch?q=search+term&count=20&format=atom"
 * ```
 */
export function buildOpenSearchURL(params: OpenSearchRequest): string {
  const url = buildURL(OPENSEARCH_API_BASE, {
    q: params.q,
    count: params.count?.toString(),
    start: params.start?.toString(),
    format: params.format,
    hl: params.hl,
  });
  return url.toString();
}

/**
 * Extract search results from OpenSearch response
 *
 * @param response - Parsed OpenSearch response
 * @returns Array of search result items
 */
export function extractSearchResults(response: OpenSearchResponse): Array<{
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
}> {
  if ("rss" in response) {
    const items = response.rss.channel.item || [];
    return items.map((item) => ({
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate,
    }));
  } else if ("feed" in response) {
    const entries = response.feed.entry || [];
    return entries.map((entry) => ({
      title: typeof entry.title === "string"
        ? entry.title
        : entry.title["#text"],
      link: Array.isArray(entry.link)
        ? entry.link[0]["@href"]
        : entry.link?.["@href"] || entry.id,
      description: typeof entry.summary === "string"
        ? entry.summary
        : entry.summary?.["#text"],
      pubDate: entry.published || entry.updated,
    }));
  }

  return [];
}

/**
 * Extract pagination info from OpenSearch response
 *
 * @param response - Parsed OpenSearch response
 * @returns Pagination information
 */
export function extractPaginationInfo(response: OpenSearchResponse): {
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
} {
  if ("rss" in response) {
    return {
      totalResults: response.rss.channel["openSearch:totalResults"],
      startIndex: response.rss.channel["openSearch:startIndex"],
      itemsPerPage: response.rss.channel["openSearch:itemsPerPage"],
    };
  } else if ("feed" in response) {
    return {
      totalResults: response.feed["openSearch:totalResults"],
      startIndex: response.feed["openSearch:startIndex"],
      itemsPerPage: response.feed["openSearch:itemsPerPage"],
    };
  }

  return {
    totalResults: 0,
    startIndex: 0,
    itemsPerPage: 0,
  };
}

/**
 * Simplified search result structure
 */
export interface SearchItem {
  /** 書誌タイトル */
  title: string;
  /** 書誌詳細ページURL */
  link: string;
  /** 書誌説明 */
  description?: string;
  /** 出版日 */
  publishedDate?: string;
  /** 著者名 */
  authors?: string[];
  /** 出版社 */
  publisher?: string;
  /** ISBN */
  isbn?: string;
  /** NDL書誌ID */
  ndlBibId?: string;
  /** 資料種別 */
  materialType?: string[];
}

/**
 * Search response with pagination
 */
export interface SearchResponse {
  /** 検索結果 */
  items: SearchItem[];
  /** ページネーション情報 */
  pagination: {
    /** 総件数 */
    totalResults: number;
    /** 現在のページ（1-based） */
    currentPage: number;
    /** 総ページ数 */
    totalPages: number;
    /** 1ページあたりの件数 */
    itemsPerPage: number;
    /** 開始位置（0-based） */
    startIndex: number;
  };
  /** 検索クエリ */
  query: {
    /** 検索語 */
    q: string;
    /** 検索フォーマット */
    format?: string;
  };
}

/**
 * Search NDL using OpenSearch API
 * 
 * @param params - OpenSearch search parameters
 * @returns Promise<Result<SearchResponse, NDLError>> - Structured search response
 * 
 * @example
 * ```typescript
 * const result = await searchOpenSearch({
 *   q: "夏目漱石",
 *   count: 20,
 *   start: 0,
 * });
 * 
 * if (result.isOk()) {
 *   const { items, pagination } = result.value;
 *   console.log(`Found ${pagination.totalResults} results`);
 *   console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`);
 *   
 *   items.forEach(item => {
 *     console.log(`- ${item.title} by ${item.authors?.join(", ")}`);
 *   });
 * }
 * ```
 */
export async function searchOpenSearch(
  params: OpenSearchRequest,
): Promise<Result<SearchResponse, NDLError>> {
  // 低レベルAPIを呼び出し
  const result = await searchOpenSearchRaw(params);
  
  if (result.isErr()) {
    return err(result.error);
  }

  const response = result.value;
  
  // 基本的な結果抽出
  const basicResults = extractSearchResults(response);
  const paginationInfo = extractPaginationInfo(response);
  
  // より詳細な情報を抽出
  const items: SearchItem[] = [];
  
  if ("rss" in response) {
    const rssItems = response.rss.channel.item || [];
    rssItems.forEach((item, index) => {
      const basicItem = basicResults[index];
      if (!basicItem) return;
      
      const searchItem: SearchItem = {
        title: basicItem.title,
        link: basicItem.link,
        description: basicItem.description,
        publishedDate: basicItem.pubDate,
        materialType: Array.isArray(item.category) ? item.category : item.category ? [item.category] : undefined,
      };
      
      // Dublin Core要素から追加情報を抽出
      if (item["dc:creator"]) {
        searchItem.authors = Array.isArray(item["dc:creator"]) 
          ? item["dc:creator"] 
          : [item["dc:creator"]];
      }
      
      if (item["dc:publisher"]) {
        searchItem.publisher = Array.isArray(item["dc:publisher"])
          ? item["dc:publisher"][0]
          : item["dc:publisher"];
      }
      
      // ISBNを探す
      if (item["dc:identifier"]) {
        const identifiers = Array.isArray(item["dc:identifier"]) 
          ? item["dc:identifier"] 
          : [item["dc:identifier"]];
          
        for (const id of identifiers) {
          if (typeof id === "object" && id["@xsi:type"] === "dcndl:ISBN") {
            searchItem.isbn = String(id["#text"]);
            break;
          } else if (typeof id === "object" && id["@xsi:type"] === "dcndl:NDLBibID") {
            searchItem.ndlBibId = String(id["#text"]);
          }
        }
      }
      
      items.push(searchItem);
    });
  } else if ("feed" in response) {
    // Atom形式の場合の処理（基本情報のみ）
    items.push(...basicResults.map(item => ({
      title: item.title,
      link: item.link,
      description: item.description,
      publishedDate: item.pubDate,
    })));
  }
  
  // ページネーション計算
  const currentPage = Math.floor(paginationInfo.startIndex / paginationInfo.itemsPerPage) + 1;
  const totalPages = Math.ceil(paginationInfo.totalResults / paginationInfo.itemsPerPage);
  
  return ok({
    items,
    pagination: {
      totalResults: paginationInfo.totalResults,
      currentPage,
      totalPages,
      itemsPerPage: paginationInfo.itemsPerPage,
      startIndex: paginationInfo.startIndex,
    },
    query: {
      q: params.q,
      format: params.format as string | undefined,
    },
  });
}
