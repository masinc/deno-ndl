/**
 * Test fixtures for NDL API responses
 */

/**
 * Load fixture file content
 * @param filename - Fixture filename
 * @returns File content as string
 */
export function loadFixture(filename: string): string {
  const path = new URL(filename, import.meta.url).pathname;
  return Deno.readTextFileSync(path);
}

/**
 * OpenSearch API fixtures (Real API responses)
 */
export const OPENSEARCH = {
  BASIC_SEARCH: loadFixture("opensearch_basic_search_response.xml"),
  ATOM_FORMAT: loadFixture("opensearch_atom_format_response.xml"),
  PAGINATION: loadFixture("opensearch_pagination_response.xml"),
  EXTRACT_RESULTS: loadFixture("opensearch_extract_results_response.xml"),
  URL_BUILDING: loadFixture("opensearch_url_building_response.xml"),
} as const;

export const SRU = {
  BASIC_SEARCH: loadFixture("sru_basic_search_response.xml"),
  EXPLAIN: loadFixture("sru_explain_response.xml"),
  PAGINATION: loadFixture("sru_pagination_response.xml"),
} as const;
