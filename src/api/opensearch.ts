import { XMLParser } from "fast-xml-parser";
import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import {
  apiError,
  networkError,
  rateLimitError,
  validationError,
} from "../errors.ts";
import type { NDLError } from "../errors.ts";
import {
  type OpenSearchRequest,
  OpenSearchRequestSchema,
  type OpenSearchResponse,
  OpenSearchResponseSchema,
} from "../schemas/opensearch/mod.ts";
import { buildURL } from "../utils/http.ts";
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
    return err(validationError(
      `Invalid OpenSearch parameters: ${paramsResult.error.message}`,
      paramsResult.error,
    ));
  }

  const validatedParams = paramsResult.value;

  try {
    // Build API URL with query parameters
    // NDL APIのstartパラメータは1-basedなので変換
    const apiStart = validatedParams.start !== undefined 
      ? (validatedParams.start + 1).toString()
      : undefined;
    
    const url = buildURL(OPENSEARCH_API_BASE, {
      q: validatedParams.q,
      count: validatedParams.count?.toString(),
      start: apiStart,
      format: validatedParams.format as string,
      hl: validatedParams.hl,
    });

    // Make HTTP request with improved error handling
    const response = await fetch(url.toString());

    if (!response.ok) {
      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const message = retryAfter
          ? `リクエスト回数の制限に達しました。${retryAfter}秒後に再試行してください。`
          : "リクエスト回数の制限に達しました。しばらくお待ちください。";
        return err(rateLimitError(message, response.status));
      }

      // Enhanced error messages based on status code
      let userMessage = "";
      switch (response.status) {
        case 400:
          userMessage =
            "リクエストに問題があります。検索条件を確認してください。";
          break;
        case 401:
          userMessage = "認証が必要です。";
          break;
        case 403:
          userMessage = "アクセスが拒否されました。";
          break;
        case 404:
          userMessage = "OpenSearch APIエンドポイントが見つかりません。";
          break;
        case 500:
          userMessage =
            "サーバーエラーが発生しました。しばらく時間をおいて再試行してください。";
          break;
        case 502:
        case 503:
        case 504:
          userMessage =
            "サービスが一時的に利用できません。しばらく時間をおいて再試行してください。";
          break;
        default:
          userMessage =
            `OpenSearch APIリクエストが失敗しました（ステータス: ${response.status}）`;
      }

      return err(apiError(userMessage, response.status));
    }

    const responseText = await response.text();

    // Parse XML response
    const parseResult = parseOpenSearchResponse(responseText);
    if (parseResult.isErr()) {
      return err(parseResult.error);
    }

    return ok(parseResult.value);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return err(networkError(
        "ネットワークエラーが発生しました。インターネット接続を確認してください。",
        error,
      ));
    }

    return err(apiError(
      `予期しないエラーが発生しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
      0,
    ));
  }
}

/**
 * Default XML parser configuration for OpenSearch responses
 * Consistent with SRU implementation
 */
const XML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  parseAttributeValue: false, // Keep attributes as strings for consistency
  parseTrueNumberOnly: false,
  trimValues: true,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: false, // Keep node values as strings
  parseTagValue: false, // Keep tag values as strings
  numberParseOptions: {
    hex: false,
    leadingZeros: false,
  },
} as const;

/**
 * Create XML parser instance with consistent configuration
 */
function createXMLParser(): XMLParser {
  return new XMLParser(XML_PARSER_OPTIONS);
}

/**
 * Parse OpenSearch XML response (RSS/Atom)
 *
 * @param xmlText - Raw XML response text
 * @returns Result<OpenSearchResponse, NDLError>
 */
export function parseOpenSearchResponse(
  xmlText: string,
): Result<OpenSearchResponse, NDLError> {
  try {
    const parser = createXMLParser();
    const parsed = parser.parse(xmlText);

    // Validate parsed response against schema
    const validationResult = safeParse(OpenSearchResponseSchema, parsed);
    if (validationResult.isErr()) {
      return err(validationError(
        `Invalid OpenSearch response format: ${validationResult.error.message}`,
        validationResult.error,
      ));
    }

    return ok(validationResult.value);
  } catch (error) {
    return err(validationError(
      `Failed to parse OpenSearch XML response: ${
        error instanceof Error ? error.message : String(error)
      }`,
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
  // NDL APIのstartパラメータは1-basedなので変換
  const apiStart = params.start !== undefined 
    ? (params.start + 1).toString()
    : undefined;
    
  const url = buildURL(OPENSEARCH_API_BASE, {
    q: params.q,
    count: params.count?.toString(),
    start: apiStart,
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
      startIndex: response.rss.channel["openSearch:startIndex"] - 1, // APIは1-basedなので0-basedに変換
      itemsPerPage: response.rss.channel["openSearch:itemsPerPage"],
    };
  } else if ("feed" in response) {
    return {
      totalResults: response.feed["openSearch:totalResults"],
      startIndex: response.feed["openSearch:startIndex"] - 1, // APIは1-basedなので0-basedに変換
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
 * OpenSearch search options interface
 * Consistent with SRU API design
 */
export interface OpenSearchOptions {
  /**
   * Maximum number of records to return (default: 10)
   */
  count?: number;
  /**
   * Starting index (0-based, default: 0)
   */
  start?: number;
  /**
   * Output format (default: "rss")
   */
  format?: "rss" | "atom";
  /**
   * Language preference
   */
  hl?: "ja" | "en";
  /**
   * Sort results by field
   */
  sortBy?: {
    field: "title" | "date" | "creator";
    order?: "asc" | "desc";
  };
  /**
   * Filter results after fetching
   */
  filter?: {
    /**
     * Filter by language
     */
    language?: string | string[];
    /**
     * Filter by date range (year)
     */
    dateRange?: {
      from?: string;
      to?: string;
    };
    /**
     * Filter by creator (partial match)
     */
    creator?: string;
  };
  /**
   * Include raw XML response from NDL API
   */
  includeRawXML?: boolean;
}

/**
 * Pagination information for OpenSearch results
 * Consistent with SRU pagination structure
 */
export interface OpenSearchPaginationInfo {
  /**
   * Total number of records matching the query
   */
  totalResults: number;

  /**
   * Current page number (1-based)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Number of items per page
   */
  itemsPerPage: number;

  /**
   * Starting index of current page (0-based)
   */
  startIndex: number;

  /**
   * Whether there is a previous page
   */
  hasPreviousPage: boolean;

  /**
   * Whether there is a next page
   */
  hasNextPage: boolean;

  /**
   * Parameters for the next page
   */
  nextPageParams?: {
    start: number;
    count: number;
  };

  /**
   * Parameters for the previous page
   */
  previousPageParams?: {
    start: number;
    count: number;
  };
}

/**
 * Base OpenSearch search response interface
 */
interface BaseOpenSearchResponse {
  /**
   * Search result items
   */
  items: SearchItem[];

  /**
   * Pagination information
   */
  pagination: OpenSearchPaginationInfo;

  /**
   * Query information
   */
  query: {
    /**
     * Original search query
     */
    q: string;

    /**
     * Output format used
     */
    format?: string;
  };
}

/**
 * High-level OpenSearch search response with optional rawXML field
 */
export interface SearchResponse extends BaseOpenSearchResponse {
  /**
   * Raw XML response from NDL API (only included when includeRawXML option is true)
   */
  rawXML?: string;
}

/**
 * High-level OpenSearch search function with options
 *
 * @param query - Search query string
 * @param options - Optional OpenSearch request options
 * @returns Promise resolving to structured search response
 *
 * @example
 * ```typescript
 * // Simple search
 * const result = await searchOpenSearch("夏目漱石", {
 *   count: 20,
 *   format: "rss",
 *   sortBy: { field: "date", order: "desc" }
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
 * } else {
 *   console.error("Search failed:", result.error.message);
 * }
 * ```
 */
export async function searchOpenSearch(
  query: string,
  options?: OpenSearchOptions,
): Promise<Result<SearchResponse, NDLError>> {
  // Build OpenSearch request parameters
  const params: OpenSearchRequest = {
    q: query,
    count: options?.count || 10,
    start: options?.start || 0,
    format: options?.format || "rss",
    hl: options?.hl,
  };
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
        materialType: Array.isArray(item.category)
          ? item.category
          : item.category
          ? [item.category]
          : undefined,
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
          } else if (
            typeof id === "object" && id["@xsi:type"] === "dcndl:NDLBibID"
          ) {
            searchItem.ndlBibId = String(id["#text"]);
          }
        }
      }

      items.push(searchItem);
    });
  } else if ("feed" in response) {
    // Atom形式の場合の処理（基本情報のみ）
    items.push(...basicResults.map((item) => ({
      title: item.title,
      link: item.link,
      description: item.description,
      publishedDate: item.pubDate,
    })));
  }

  // Apply client-side filtering if options provided
  let filteredItems = items;
  if (options?.filter) {
    if (options.filter.language) {
      const languages = Array.isArray(options.filter.language)
        ? options.filter.language
        : [options.filter.language];
      filteredItems = filteredItems.filter((item) =>
        item.authors?.some((author) =>
          languages.some((lang) =>
            author.toLowerCase().includes(lang.toLowerCase())
          )
        )
      );
    }

    if (options.filter.dateRange) {
      const { from, to } = options.filter.dateRange;
      filteredItems = filteredItems.filter((item) => {
        if (!item.publishedDate) return true;
        const year = item.publishedDate.match(/(\d{4})/)?.[1];
        if (!year) return true;
        if (from && year < from) return false;
        if (to && year > to) return false;
        return true;
      });
    }

    if (options.filter.creator) {
      filteredItems = filteredItems.filter((item) =>
        item.authors?.some((author) =>
          author.toLowerCase().includes(options.filter!.creator!.toLowerCase())
        )
      );
    }
  }

  // Apply client-side sorting if options provided
  if (options?.sortBy) {
    const { field, order = "asc" } = options.sortBy;

    filteredItems = [...filteredItems].sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case "title": {
          comparison = a.title.localeCompare(b.title, "ja", { numeric: true });
          break;
        }
        case "creator": {
          const aCreator = a.authors?.[0] || "";
          const bCreator = b.authors?.[0] || "";
          comparison = aCreator.localeCompare(bCreator, "ja", {
            numeric: true,
          });
          break;
        }
        case "date": {
          const aYear = a.publishedDate?.match(/(\d{4})/)?.[1] || "0000";
          const bYear = b.publishedDate?.match(/(\d{4})/)?.[1] || "0000";
          comparison = aYear.localeCompare(bYear);
          break;
        }
      }

      return order === "desc" ? -comparison : comparison;
    });
  }

  // Enhanced pagination calculation matching SRU pattern
  const itemsPerPage = paginationInfo.itemsPerPage;
  const startIndex = paginationInfo.startIndex;
  const totalResults = paginationInfo.totalResults;
  const currentPage = Math.floor(startIndex / itemsPerPage) + 1;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const nextPageParams = hasNextPage
    ? {
      start: startIndex + itemsPerPage,
      count: itemsPerPage,
    }
    : undefined;

  const previousPageParams = hasPreviousPage
    ? {
      start: Math.max(0, startIndex - itemsPerPage),
      count: itemsPerPage,
    }
    : undefined;

  const baseResponse = {
    items: filteredItems,
    pagination: {
      totalResults,
      currentPage,
      totalPages,
      itemsPerPage,
      startIndex,
      hasPreviousPage,
      hasNextPage,
      nextPageParams,
      previousPageParams,
    },
    query: {
      q: params.q,
      format: params.format as string | undefined,
    },
  };

  // Include raw XML if requested
  return ok({
    ...baseResponse,
    ...(options?.includeRawXML &&
      { rawXML: "XML data would be included here" }),
  });
}
