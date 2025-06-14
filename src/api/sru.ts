/**
 * SRU (Search/Retrieve via URL) API implementation for NDL
 *
 * This module provides functions to interact with the National Diet Library's
 * SRU API for bibliographic searches using CQL (Contextual Query Language).
 *
 * @module
 */

import { XMLParser } from "fast-xml-parser";
import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { buildURL } from "../utils/http.ts";
import {
  apiError,
  type NDLError,
  networkError,
  querySyntaxError,
  rateLimitError,
  sruDiagnosticError,
  validationError,
} from "../errors.ts";
import {
  type ParsedSRUResponse,
  ParsedSRUResponseSchema,
  type SimpleSearchParams,
  type SRUExplainRequest,
  SRUExplainRequestSchema,
  type SRURecordSchemaType,
  SRUResponseSchema,
  type SRUSearchRetrieveRequest,
  SRUSearchRetrieveRequestSchema,
  type SRUVersion,
} from "../schemas/sru/mod.ts";
import { safeParse } from "../schemas/utils.ts";
import { buildSimpleCQLQuery } from "../utils/cql-builder.ts";

/**
 * NDL SRU API base URL
 */
const NDL_SRU_BASE_URL = "https://ndlsearch.ndl.go.jp/api/sru";

/**
 * Default XML parser configuration for SRU responses
 */
const XML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  parseAttributeValue: false, // Keep attributes as strings
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
 * Create XML parser instance
 */
function createXMLParser(): XMLParser {
  return new XMLParser(XML_PARSER_OPTIONS);
}

/**
 * Build SRU search retrieve URL
 *
 * @param params - SRU search retrieve parameters
 * @returns Complete URL for SRU API request
 */
export function buildSRUSearchURL(params: SRUSearchRetrieveRequest): string {
  const searchParams: Record<string, string | number | boolean> = {};

  // Required parameters
  searchParams.operation = params.operation;
  searchParams.query = params.query;

  // Optional parameters
  if (params.version) searchParams.version = params.version;
  if (params.startRecord) searchParams.startRecord = params.startRecord;
  if (params.maximumRecords) {
    searchParams.maximumRecords = params.maximumRecords;
  }
  if (params.recordSchema) searchParams.recordSchema = params.recordSchema;
  if (params.recordPacking) searchParams.recordPacking = params.recordPacking;
  if (params.sortBy) searchParams.sortBy = params.sortBy;
  if (params.resultSetTTL) searchParams.resultSetTTL = params.resultSetTTL;
  if (params.stylesheet) searchParams.stylesheet = params.stylesheet;
  if (params.inprocess !== undefined) searchParams.inprocess = params.inprocess;
  if (params.lang) searchParams.lang = params.lang;

  return buildURL(NDL_SRU_BASE_URL, searchParams).toString();
}

/**
 * Build SRU explain URL
 *
 * @param params - SRU explain parameters
 * @returns Complete URL for SRU explain request
 */
export function buildSRUExplainURL(params: SRUExplainRequest): string {
  const searchParams: Record<string, string | number | boolean> = {};

  // Required parameters
  searchParams.operation = params.operation;

  // Optional parameters
  if (params.version) searchParams.version = params.version;
  if (params.recordPacking) searchParams.recordPacking = params.recordPacking;
  if (params.stylesheet) searchParams.stylesheet = params.stylesheet;

  return buildURL(NDL_SRU_BASE_URL, searchParams).toString();
}

/**
 * Parse SRU XML response
 *
 * @param xmlData - Raw XML response from SRU API
 * @returns Parsed and validated SRU response
 */
export function parseSRUResponse(
  xmlData: string,
): Result<ParsedSRUResponse, NDLError> {
  try {
    const parser = createXMLParser();
    const parsed = parser.parse(xmlData);

    // First validate against the raw SRU response schema
    const rawValidation = safeParse(SRUResponseSchema, parsed);
    if (rawValidation.isErr()) {
      return err(validationError(
        `Invalid SRU response format: ${rawValidation.error.message}`,
        rawValidation.error,
      ));
    }

    const rawResponse = rawValidation.value;

    // Transform to discriminated union format
    if (rawResponse.searchRetrieveResponse) {
      const parsedResponse: ParsedSRUResponse = {
        type: "searchRetrieve",
        response: rawResponse.searchRetrieveResponse,
      };

      // Validate the transformed response
      const validationResult = safeParse(
        ParsedSRUResponseSchema,
        parsedResponse,
      );
      if (validationResult.isErr()) {
        return err(validationError(
          `Invalid SRU search response format: ${validationResult.error.message}`,
          validationResult.error,
        ));
      }

      return ok(validationResult.value);
    } else if (rawResponse.explainResponse) {
      const parsedResponse: ParsedSRUResponse = {
        type: "explain",
        response: rawResponse.explainResponse,
      };

      // Validate the transformed response
      const validationResult = safeParse(
        ParsedSRUResponseSchema,
        parsedResponse,
      );
      if (validationResult.isErr()) {
        return err(validationError(
          `Invalid SRU explain response format: ${validationResult.error.message}`,
          validationResult.error,
        ));
      }

      return ok(validationResult.value);
    } else {
      return err(validationError(
        "Invalid SRU response: no searchRetrieveResponse or explainResponse found",
      ));
    }
  } catch (error) {
    return err(validationError(
      `Failed to parse SRU XML response: ${
        error instanceof Error ? error.message : String(error)
      }`,
    ));
  }
}

/**
 * Analyze SRU diagnostics and create appropriate error
 *
 * @param diagnostics - SRU diagnostic array
 * @returns Appropriate NDL error or null if no error
 */
function analyzeSRUDiagnostics(
  diagnostics?: Array<{
    uri?: string;
    code?: string;
    message: string;
    details?: string;
  }>,
): NDLError | null {
  if (!diagnostics || diagnostics.length === 0) {
    return null;
  }

  // Check for common SRU diagnostic codes
  for (const diagnostic of diagnostics) {
    const uri = diagnostic.uri || "";
    const message = diagnostic.message;

    // Query syntax errors
    if (
      uri.includes("query/syntax") || message.toLowerCase().includes("syntax")
    ) {
      return querySyntaxError(
        `CQLクエリの構文エラー: ${message}`,
        diagnostic,
      );
    }

    // Unsupported query errors
    if (
      uri.includes("query/feature") ||
      message.toLowerCase().includes("unsupported")
    ) {
      return querySyntaxError(
        `サポートされていない検索機能: ${message}`,
        diagnostic,
      );
    }

    // Result set errors
    if (uri.includes("resultset") || message.toLowerCase().includes("result")) {
      return sruDiagnosticError(
        `検索結果の処理エラー: ${message}`,
        diagnostic,
      );
    }

    // General diagnostic error
    if (diagnostic.code && parseInt(diagnostic.code) >= 10) {
      return sruDiagnosticError(
        `検索エラー (コード: ${diagnostic.code}): ${message}`,
        diagnostic,
      );
    }
  }

  // Default diagnostic error
  const firstDiagnostic = diagnostics[0];
  return sruDiagnosticError(
    `検索処理でエラーが発生しました: ${firstDiagnostic.message}`,
    firstDiagnostic,
  );
}

/**
 * Execute SRU search retrieve request (internal function)
 *
 * @param params - SRU search retrieve parameters
 * @param includeRawXML - Whether to include raw XML in response
 * @returns Promise resolving to parsed SRU response
 */
async function executeSearchRetrieve(
  params: SRUSearchRetrieveRequest,
  includeRawXML?: boolean,
): Promise<Result<SRUSearchResponse, NDLError>> {
  const rawResult = await executeSearchRetrieveRaw(params, includeRawXML);

  if (rawResult.isErr()) {
    return err(rawResult.error);
  }

  const { response, rawXML } = rawResult.value;

  if (response.type !== "searchRetrieve") {
    return err(
      validationError(
        "Expected searchRetrieve response but got explain response",
      ),
    );
  }

  // Extract diagnostics and check for errors
  const diagnostics = response.response.diagnostics?.diagnostic;
  const diagnosticArray = diagnostics
    ? (Array.isArray(diagnostics) ? diagnostics : [diagnostics])
    : undefined;

  // Convert SRU diagnostics to structured format
  const structuredDiagnostics = diagnosticArray?.map((d) => ({
    uri: d.uri,
    code: d.code,
    message: d.message,
    details: d.details,
  }));

  // Check if diagnostics indicate an error
  const diagnosticError = analyzeSRUDiagnostics(structuredDiagnostics);
  if (diagnosticError) {
    return err(diagnosticError);
  }

  const items = extractSRUSearchItems(response);
  const pagination = extractSRUPaginationInfo(response, params);

  const baseResponse = {
    items,
    pagination,
    query: {
      cql: params.query,
      schema: params.recordSchema,
    },
    diagnostics: structuredDiagnostics,
  };

  return ok({
    ...baseResponse,
    ...(rawXML && { rawXML }),
  });
}

/**
 * Execute SRU search retrieve request (raw response)
 *
 * @param params - SRU search retrieve parameters
 * @returns Promise resolving to parsed SRU response
 */
export async function executeSearchRetrieveRaw(
  params: SRUSearchRetrieveRequest,
  includeRawXML?: boolean,
): Promise<Result<{ response: ParsedSRUResponse; rawXML?: string }, NDLError>> {
  // Validate input parameters
  const validationResult = safeParse(SRUSearchRetrieveRequestSchema, params);
  if (validationResult.isErr()) {
    return err(validationError(
      `Invalid SRU search parameters: ${validationResult.error.message}`,
      validationResult.error,
    ));
  }

  const validatedParams = validationResult.value;
  const url = buildSRUSearchURL(validatedParams);

  try {
    const response = await fetch(url);

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
          userMessage = "SRU APIエンドポイントが見つかりません。";
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
            `SRU APIリクエストが失敗しました（ステータス: ${response.status}）`;
      }

      return err(apiError(userMessage, response.status));
    }

    const xmlData = await response.text();
    const parseResult = parseSRUResponse(xmlData);

    if (parseResult.isErr()) {
      return err(parseResult.error);
    }

    return ok({
      response: parseResult.value,
      ...(includeRawXML && { rawXML: xmlData }),
    });
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
 * Execute SRU explain request
 *
 * @param params - SRU explain parameters (optional)
 * @returns Promise resolving to parsed SRU explain response
 */
export async function explainSRU(
  params: SRUExplainRequest = { operation: "explain" },
): Promise<Result<ParsedSRUResponse, NDLError>> {
  // Validate input parameters
  const validationResult = safeParse(SRUExplainRequestSchema, params);
  if (validationResult.isErr()) {
    return err(validationError(
      `Invalid SRU explain parameters: ${validationResult.error.message}`,
      validationResult.error,
    ));
  }

  const validatedParams = validationResult.value;
  const url = buildSRUExplainURL(validatedParams);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return err(apiError(
        `SRU explain request failed: ${response.status} ${response.statusText}`,
        response.status,
      ));
    }

    const xmlData = await response.text();
    return parseSRUResponse(xmlData);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return err(networkError(
        `Network error during SRU explain request: ${error.message}`,
      ));
    }

    return err(apiError(
      `Unexpected error during SRU explain request: ${
        error instanceof Error ? error.message : String(error)
      }`,
      0,
    ));
  }
}

/**
 * High-level search interface for SRU API
 */
export interface SRUSearchItem {
  /**
   * Record title
   */
  title: string;

  /**
   * Record identifier
   */
  identifier?: string;

  /**
   * Authors/creators
   */
  creators?: string[];

  /**
   * Publishers
   */
  publishers?: string[];

  /**
   * Publication date
   */
  date?: string;

  /**
   * Subjects/keywords
   */
  subjects?: string[];

  /**
   * Record type/format
   */
  type?: string;

  /**
   * Language
   */
  language?: string;

  /**
   * Raw record data
   */
  rawData: unknown;
}

/**
 * Pagination information for SRU search results
 */
export interface SRUPaginationInfo {
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
   * Starting index of current page (1-based)
   */
  startIndex: number;

  /**
   * Position of next record if available
   */
  nextRecordPosition?: number;

  /**
   * Result set identifier for future requests
   */
  resultSetId?: string;

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
    startRecord: number;
    maximumRecords: number;
  };

  /**
   * Parameters for the previous page
   */
  previousPageParams?: {
    startRecord: number;
    maximumRecords: number;
  };
}

/**
 * SRU search options interface
 */
export interface SRUSearchOptions {
  /**
   * Maximum number of records to return (default: 10)
   */
  maximumRecords?: number;
  /**
   * Starting record position (default: 1)
   */
  startRecord?: number;
  /**
   * Record schema (default: "dcndl")
   */
  recordSchema?: SRURecordSchemaType;
  /**
   * SRU version (default: "1.2")
   */
  version?: SRUVersion;
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
 * Base SRU search response interface
 */
interface BaseSRUSearchResponse {
  /**
   * Search result items
   */
  items: SRUSearchItem[];

  /**
   * Pagination information
   */
  pagination: SRUPaginationInfo;

  /**
   * Query information
   */
  query: {
    /**
     * Original CQL query
     */
    cql: string;

    /**
     * Record schema used
     */
    schema?: string;
  };

  /**
   * Diagnostic messages if any
   */
  diagnostics?: Array<{
    code?: string;
    message: string;
    details?: string;
  }>;
}

/**
 * High-level SRU search response with optional rawXML field
 */
export interface SRUSearchResponse extends BaseSRUSearchResponse {
  /**
   * Raw XML response from NDL API (only included when includeRawXML option is true)
   */
  rawXML?: string;
}

/**
 * Extract search items from SRU response
 *
 * @param response - Parsed SRU response
 * @returns Array of search items
 */
export function extractSRUSearchItems(
  response: ParsedSRUResponse,
): SRUSearchItem[] {
  if (response.type !== "searchRetrieve") {
    return [];
  }

  const records = response.response.records?.record;
  if (!records) {
    return [];
  }

  const recordArray = Array.isArray(records) ? records : [records];

  return recordArray.map((record) => {
    const item: SRUSearchItem = {
      title: "Unknown Title",
      rawData: record.recordData,
    };

    // Extract basic information from record data
    try {
      if (typeof record.recordData === "string") {
        // Parse the escaped XML content
        const parser = createXMLParser();
        const parsedData = parser.parse(record.recordData);

        // Handle Dublin Core records (srw_dc:dc schema)
        const dc = parsedData["srw_dc:dc"];
        if (dc) {
          if (dc["dc:title"]) {
            item.title = String(dc["dc:title"]);
          }

          if (dc["dc:creator"]) {
            const creators = Array.isArray(dc["dc:creator"])
              ? dc["dc:creator"]
              : [dc["dc:creator"]];
            item.creators = creators.map((c) => String(c));
          }

          if (dc["dc:date"]) {
            item.date = String(dc["dc:date"]);
          }

          if (dc["dc:language"]) {
            item.language = String(dc["dc:language"]);
          }

          if (dc["dc:type"]) {
            item.type = String(dc["dc:type"]);
          }

          if (dc["dc:publisher"]) {
            const publishers = Array.isArray(dc["dc:publisher"])
              ? dc["dc:publisher"]
              : [dc["dc:publisher"]];
            item.publishers = publishers.map((p) => String(p));
          }

          if (dc["dc:subject"]) {
            const subjects = Array.isArray(dc["dc:subject"])
              ? dc["dc:subject"]
              : [dc["dc:subject"]];
            item.subjects = subjects.map((s) => String(s));
          }
        }

        // Handle DCNDL RDF records (dcndl schema)
        const rdf = parsedData["rdf:RDF"];
        if (rdf && rdf["dcndl:BibResource"]) {
          const bibResources = Array.isArray(rdf["dcndl:BibResource"])
            ? rdf["dcndl:BibResource"]
            : [rdf["dcndl:BibResource"]];

          // Find the main bibliographic resource (usually the first one with title)
          for (const bibResource of bibResources) {
            if (bibResource["dcterms:title"]) {
              item.title = String(bibResource["dcterms:title"]);

              // Extract creators
              if (bibResource["dc:creator"]) {
                const creators = Array.isArray(bibResource["dc:creator"])
                  ? bibResource["dc:creator"]
                  : [bibResource["dc:creator"]];
                item.creators = creators.map((c) => String(c));
              }

              // Extract publishers
              if (
                bibResource["dcterms:publisher"] &&
                bibResource["dcterms:publisher"]["foaf:Agent"]
              ) {
                const agent = bibResource["dcterms:publisher"]["foaf:Agent"];
                if (agent["foaf:name"]) {
                  item.publishers = [String(agent["foaf:name"])];
                }
              }

              // Extract date
              if (bibResource["dcterms:date"]) {
                item.date = String(bibResource["dcterms:date"]);
              }

              // Extract language
              if (bibResource["dcterms:language"]) {
                const lang = bibResource["dcterms:language"];
                if (typeof lang === "object" && lang["@rdf:datatype"]) {
                  // Language is specified as ISO code
                  item.language = String(lang["#text"] || lang);
                } else {
                  item.language = String(lang);
                }
              }

              break; // Use the first resource with title
            }
          }
        }
      }

      if (record.recordIdentifier) {
        item.identifier = record.recordIdentifier;
      }
    } catch {
      // If extraction fails, keep the default values
    }

    return item;
  });
}

/**
 * Extract pagination information from SRU response
 *
 * @param response - Parsed SRU response
 * @param requestParams - Original request parameters
 * @returns Pagination information
 */
export function extractSRUPaginationInfo(
  response: ParsedSRUResponse,
  requestParams: SRUSearchRetrieveRequest,
): SRUPaginationInfo {
  if (response.type !== "searchRetrieve") {
    return {
      totalResults: 0,
      currentPage: 1,
      totalPages: 0,
      itemsPerPage: requestParams.maximumRecords || 10,
      startIndex: requestParams.startRecord || 1,
      hasPreviousPage: false,
      hasNextPage: false,
      nextPageParams: undefined,
      previousPageParams: undefined,
    };
  }

  const totalResults = response.response.numberOfRecords || 0;
  const itemsPerPage = requestParams.maximumRecords || 10;
  const startIndex = requestParams.startRecord || 1;
  const currentPage = Math.floor((startIndex - 1) / itemsPerPage) + 1;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const nextPageParams = hasNextPage
    ? {
      startRecord: startIndex + itemsPerPage,
      maximumRecords: itemsPerPage,
    }
    : undefined;

  const previousPageParams = hasPreviousPage
    ? {
      startRecord: Math.max(1, startIndex - itemsPerPage),
      maximumRecords: itemsPerPage,
    }
    : undefined;

  return {
    totalResults,
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    nextRecordPosition: response.response.nextRecordPosition,
    resultSetId: response.response.resultSetId,
    hasPreviousPage,
    hasNextPage,
    nextPageParams,
    previousPageParams,
  };
}

/**
 * High-level SRU search function with simple parameters
 *
 * @param searchParams - Simple search parameters
 * @param options - Optional SRU request options
 * @returns Promise resolving to structured search response
 *
 * @example
 * ```typescript
 * // Simple search by title and author
 * const result = await searchSRU({
 *   title: "夏目漱石",
 *   creator: "作家",
 *   language: "jpn",
 * });
 *
 * if (result.isOk()) {
 *   const { items, pagination } = result.value;
 *   console.log(`Found ${pagination.totalResults} results`);
 *   console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`);
 *
 *   items.forEach(item => {
 *     console.log(`- ${item.title} by ${item.creators?.join(", ")}`);
 *   });
 * } else {
 *   console.error("Search failed:", result.error.message);
 * }
 * ```
 */
export async function searchSRU(
  searchParams: SimpleSearchParams,
  options?: SRUSearchOptions,
): Promise<Result<SRUSearchResponse, NDLError>> {
  // Build CQL query from simple parameters
  const cqlResult = buildSimpleCQLQuery(searchParams);
  if (cqlResult.isErr()) {
    return err(cqlResult.error);
  }

  const cqlQuery = cqlResult.value;

  // If no search parameters provided, return empty results
  if (!cqlQuery) {
    return ok({
      items: [],
      pagination: {
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
        itemsPerPage: options?.maximumRecords || 10,
        startIndex: options?.startRecord || 1,
        hasPreviousPage: false,
        hasNextPage: false,
        nextPageParams: undefined,
        previousPageParams: undefined,
      },
      query: {
        cql: "",
        schema: options?.recordSchema || "dcndl",
      },
    });
  }

  // Build SRU request parameters
  const sruParams: SRUSearchRetrieveRequest = {
    operation: "searchRetrieve",
    query: cqlQuery,
    maximumRecords: options?.maximumRecords || 10,
    startRecord: options?.startRecord || 1,
    recordSchema: options?.recordSchema || "dcndl",
    version: options?.version || "1.2",
  };

  const result = await executeSearchRetrieve(sruParams, options?.includeRawXML);

  if (result.isErr()) {
    return err(result.error);
  }

  let { items } = result.value;

  // Apply client-side filtering
  if (options?.filter) {
    if (options.filter.language) {
      const languages = Array.isArray(options.filter.language)
        ? options.filter.language
        : [options.filter.language];
      items = items.filter((item) =>
        item.language && languages.includes(item.language)
      );
    }

    if (options.filter.dateRange) {
      const { from, to } = options.filter.dateRange;
      items = items.filter((item) => {
        if (!item.date) return true;
        const year = item.date.match(/(\d{4})/)?.[1];
        if (!year) return true;
        if (from && year < from) return false;
        if (to && year > to) return false;
        return true;
      });
    }

    if (options.filter.creator) {
      items = items.filter((item) =>
        item.creators?.some((creator) =>
          creator.toLowerCase().includes(options.filter!.creator!.toLowerCase())
        )
      );
    }
  }

  // Apply client-side sorting
  if (options?.sortBy) {
    const { field, order = "asc" } = options.sortBy;

    items = [...items].sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case "title": {
          comparison = a.title.localeCompare(b.title, "ja", { numeric: true });
          break;
        }
        case "creator": {
          const aCreator = a.creators?.[0] || "";
          const bCreator = b.creators?.[0] || "";
          comparison = aCreator.localeCompare(bCreator, "ja", {
            numeric: true,
          });
          break;
        }
        case "date": {
          const aYear = a.date?.match(/(\d{4})/)?.[1] || "0000";
          const bYear = b.date?.match(/(\d{4})/)?.[1] || "0000";
          comparison = aYear.localeCompare(bYear);
          break;
        }
      }

      return order === "desc" ? -comparison : comparison;
    });
  }

  // Return modified response
  return ok({
    ...result.value,
    items,
  });
}
