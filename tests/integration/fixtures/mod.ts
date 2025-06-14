/**
 * Test fixtures for NDL API responses
 */

/**
 * Load fixture file content
 * @param filename - Fixture filename
 * @returns File content as string
 */
function loadFixture(filename: string): string {
  const path = new URL(filename, import.meta.url).pathname;
  return Deno.readTextFileSync(path);
}

/**
 * OpenSearch API fixtures (Real API responses)
 */
export const OPENSEARCH = {
  get BASIC_SEARCH() {
    return loadFixture("opensearch_basic_search_response.xml");
  },
  get ATOM_FORMAT() {
    return loadFixture("opensearch_atom_format_response.xml");
  },
  get PAGINATION() {
    return loadFixture("opensearch_pagination_response.xml");
  },
  get EXTRACT_RESULTS() {
    return loadFixture("opensearch_extract_results_response.xml");
  },
  get URL_BUILDING() {
    return loadFixture("opensearch_url_building_response.xml");
  },
} as const;

export const SRU = {
  get BASIC_SEARCH() {
    return loadFixture("sru_basic_search_response.xml");
  },
  get EXPLAIN() {
    return loadFixture("sru_explain_response.xml");
  },
  get PAGINATION() {
    return loadFixture("sru_pagination_response.xml");
  },
} as const;
