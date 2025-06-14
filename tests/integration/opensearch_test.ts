import { assertEquals, assertGreater } from "@std/assert";
import { parseOpenSearchResponse, searchOpenSearch } from "../../src/api/opensearch.ts";
import { OPENSEARCH } from "./fixtures/mod.ts";

/**
 * Integration tests for OpenSearch API
 * These tests use saved fixture data to avoid API rate limits
 *
 * Run with: deno task test:integration
 */

Deno.test("parseOpenSearchResponse parses basic search RSS correctly", async () => {
  const result = await parseOpenSearchResponse(OPENSEARCH.BASIC_SEARCH);

  if (result.isErr()) {
    console.error("Parse failed:", result.error);
    throw new Error(`Parse failed: ${result.error.message}`);
  }

  const response = result.value;

  // Verify it's an RSS response
  assertEquals("rss" in response, true);

  if ("rss" in response) {
    const channel = response.rss.channel;

    // Check basic structure
    assertEquals(typeof channel.title, "string");
    assertEquals(typeof channel.link, "string");
    assertEquals(typeof channel.description, "string");

    // Check OpenSearch elements (実際のAPIでは openSearch プレフィックス)
    assertEquals(typeof channel["openSearch:totalResults"], "number");
    assertEquals(typeof channel["openSearch:startIndex"], "number");
    assertEquals(typeof channel["openSearch:itemsPerPage"], "number");

    // Should have some results
    assertGreater(channel["openSearch:totalResults"], 0);

    // Check items if present
    if (channel.item && Array.isArray(channel.item)) {
      // Check first item structure
      if (channel.item.length > 0) {
        const firstItem = channel.item[0];
        assertEquals(typeof firstItem.title, "string");
        assertEquals(typeof firstItem.link, "string");
      }
    }
  }
});

Deno.test("parseOpenSearchResponse parses pagination RSS correctly", async () => {
  const result = await parseOpenSearchResponse(OPENSEARCH.PAGINATION);

  if (result.isErr()) {
    console.error("Parse failed:", result.error);
    throw new Error(`Parse failed: ${result.error.message}`);
  }

  const response = result.value;

  // Verify it's an RSS response
  assertEquals("rss" in response, true);

  if ("rss" in response) {
    const channel = response.rss.channel;

    // Check basic structure
    assertEquals(typeof channel.title, "string");
    assertEquals(typeof channel.link, "string");
    assertEquals(typeof channel.description, "string");

    // Check OpenSearch elements
    assertEquals(typeof channel["openSearch:totalResults"], "number");
    assertEquals(typeof channel["openSearch:startIndex"], "number");
    assertEquals(typeof channel["openSearch:itemsPerPage"], "number");

    // Should have some results
    assertGreater(channel["openSearch:totalResults"], 0);

    // Check items if present
    if (channel.item && Array.isArray(channel.item)) {
      // Check first item structure
      if (channel.item.length > 0) {
        const firstItem = channel.item[0];
        assertEquals(typeof firstItem.title, "string");
        assertEquals(typeof firstItem.link, "string");
      }
    }
  }
});

Deno.test("parseOpenSearchResponse parses extract results RSS correctly", async () => {
  const result = await parseOpenSearchResponse(OPENSEARCH.EXTRACT_RESULTS);

  if (result.isErr()) {
    console.error("Parse failed:", result.error);
    throw new Error(`Parse failed: ${result.error.message}`);
  }

  const response = result.value;

  if ("rss" in response) {
    const channel = response.rss.channel;

    // Check basic structure
    assertEquals(typeof channel.title, "string");
    assertEquals(typeof channel.link, "string");
    assertEquals(typeof channel.description, "string");

    // Should have some total results
    assertGreater(channel["openSearch:totalResults"], 0);
  }
});

Deno.test("parseOpenSearchResponse validates all fixture responses", async () => {
  // すべてのfixture XMLが正しくパースできることを確認
  const fixtures = [
    { name: "BASIC_SEARCH", data: OPENSEARCH.BASIC_SEARCH },
    { name: "ATOM_FORMAT", data: OPENSEARCH.ATOM_FORMAT },
    { name: "PAGINATION", data: OPENSEARCH.PAGINATION },
    { name: "EXTRACT_RESULTS", data: OPENSEARCH.EXTRACT_RESULTS },
    { name: "URL_BUILDING", data: OPENSEARCH.URL_BUILDING },
  ];

  for (const fixture of fixtures) {
    const result = await parseOpenSearchResponse(fixture.data);
    
    if (result.isErr()) {
      console.error(`Parse failed for ${fixture.name}:`, result.error);
      throw new Error(`Parse failed for ${fixture.name}: ${result.error.message}`);
    }

    // すべてのfixtureが正常にパースされることを確認
    assertEquals(result.isOk(), true, `${fixture.name} should parse successfully`);
    
    const response = result.value;
    
    // RSSまたはAtomのレスポンスであることを確認
    const isRss = "rss" in response;
    const isAtom = "feed" in response;
    assertEquals(isRss || isAtom, true, `${fixture.name} should be RSS or Atom format`);
  }
});

Deno.test("searchOpenSearch high-level API returns structured data", async () => {
  // fixtureデータをパースして高レベルAPIの動作をテスト
  const parsedResponse = await parseOpenSearchResponse(OPENSEARCH.BASIC_SEARCH);
  
  if (parsedResponse.isErr()) {
    throw new Error(`Failed to parse fixture: ${parsedResponse.error.message}`);
  }

  // 高レベルAPIの結果構造をテスト（実際のAPIは呼ばない）
  // searchOpenSearchの内部ロジックをテストするため、
  // extractSearchResultsとextractPaginationInfoを使用
  const { extractSearchResults, extractPaginationInfo } = await import("../../src/api/opensearch.ts");
  
  const basicResults = extractSearchResults(parsedResponse.value);
  const paginationInfo = extractPaginationInfo(parsedResponse.value);
  
  // 基本的な構造確認
  assertEquals(Array.isArray(basicResults), true);
  assertGreater(basicResults.length, 0);
  
  // 最初のアイテムの構造確認
  const firstItem = basicResults[0];
  assertEquals(typeof firstItem.title, "string");
  assertEquals(typeof firstItem.link, "string");
  assertEquals(firstItem.link.startsWith("https://"), true);
  
  // ページネーション情報の確認
  assertEquals(typeof paginationInfo.totalResults, "number");
  assertEquals(typeof paginationInfo.startIndex, "number");
  assertEquals(typeof paginationInfo.itemsPerPage, "number");
  assertGreater(paginationInfo.totalResults, 0);
});
