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
  validationError,
} from "../errors.ts";
import {
  type ParsedSRUResponse,
  ParsedSRUResponseSchema,
  type SimpleSearchParams,
  type SRUExplainRequest,
  SRUExplainRequestSchema,
  type SRURecordSchemaType,
  type SRUResponse,
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
      const validationResult = safeParse(ParsedSRUResponseSchema, parsedResponse);
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
      const validationResult = safeParse(ParsedSRUResponseSchema, parsedResponse);
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
 * Execute SRU search retrieve request (internal function)
 *
 * @param params - SRU search retrieve parameters
 * @returns Promise resolving to parsed SRU response
 */
async function executeSearchRetrieve(
  params: SRUSearchRetrieveRequest,
): Promise<Result<SRUSearchResponse, NDLError>> {
  const rawResult = await executeSearchRetrieveRaw(params);
  
  if (rawResult.isErr()) {
    return err(rawResult.error);
  }

  const response = rawResult.value;

  if (response.type !== "searchRetrieve") {
    return err(
      validationError(
        "Expected searchRetrieve response but got explain response",
      ),
    );
  }

  const items = extractSRUSearchItems(response);
  const pagination = extractSRUPaginationInfo(response, params);

  // Extract diagnostics
  const diagnostics = response.response.diagnostics?.diagnostic;
  const diagnosticArray = diagnostics
    ? (Array.isArray(diagnostics) ? diagnostics : [diagnostics])
    : undefined;

  return ok({
    items,
    pagination,
    query: {
      cql: params.query,
      schema: params.recordSchema,
    },
    diagnostics: diagnosticArray?.map((d) => ({
      code: d.code,
      message: d.message,
      details: d.details,
    })),
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
): Promise<Result<ParsedSRUResponse, NDLError>> {
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
      return err(apiError(
        `SRU API request failed: ${response.status} ${response.statusText}`,
        response.status,
      ));
    }

    const xmlData = await response.text();
    return parseSRUResponse(xmlData);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return err(networkError(
        `Network error during SRU request: ${error.message}`,
      ));
    }

    return err(apiError(
      `Unexpected error during SRU request: ${
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
}

/**
 * High-level SRU search response
 */
export interface SRUSearchResponse {
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
            item.creators = creators.map(c => String(c));
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
            item.publishers = publishers.map(p => String(p));
          }
          
          if (dc["dc:subject"]) {
            const subjects = Array.isArray(dc["dc:subject"]) 
              ? dc["dc:subject"] 
              : [dc["dc:subject"]];
            item.subjects = subjects.map(s => String(s));
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
                item.creators = creators.map(c => String(c));
              }
              
              // Extract publishers
              if (bibResource["dcterms:publisher"] && bibResource["dcterms:publisher"]["foaf:Agent"]) {
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
    };
  }

  const totalResults = response.response.numberOfRecords || 0;
  const itemsPerPage = requestParams.maximumRecords || 10;
  const startIndex = requestParams.startRecord || 1;
  const currentPage = Math.floor((startIndex - 1) / itemsPerPage) + 1;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  return {
    totalResults,
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    nextRecordPosition: response.response.nextRecordPosition,
    resultSetId: response.response.resultSetId,
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
  options?: {
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
  },
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

  return await searchSRUWithCQL(sruParams);
}

/**
 * Low-level SRU search function with raw CQL query
 *
 * @param params - Raw SRU search parameters with CQL query
 * @returns Promise resolving to structured search response
 *
 * @example
 * ```typescript
 * const result = await searchSRUWithCQL({
 *   operation: "searchRetrieve",
 *   query: 'title="夏目漱石" AND creator="作家"',
 *   maximumRecords: 20,
 *   startRecord: 1,
 * });
 *
 * if (result.isOk()) {
 *   const { items, pagination } = result.value;
 *   console.log(`Found ${pagination.totalResults} results`);
 * }
 * ```
 */
export async function searchSRUWithCQL(
  params: SRUSearchRetrieveRequest,
): Promise<Result<SRUSearchResponse, NDLError>> {
  return await executeSearchRetrieve(params);
}
