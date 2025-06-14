import { assertEquals, assertExists } from "@std/assert";
import { searchSRU, searchSRUWithCQL } from "../../src/api/sru.ts";
import type { SimpleSearchParams } from "../../src/schemas/sru/mod.ts";

Deno.test("searchSRU - simple title search", async () => {
  const params: SimpleSearchParams = {
    title: "夏目漱石",
  };

  const result = await searchSRU(params, {
    maximumRecords: 5,
  });

  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    const response = result.value;
    assertExists(response.items);
    assertExists(response.pagination);
    assertExists(response.query);
    
    assertEquals(response.query.cql, 'title="夏目漱石"');
    assertEquals(response.pagination.itemsPerPage, 5);
  }
});

Deno.test("searchSRU - complex search with multiple fields", async () => {
  const params: SimpleSearchParams = {
    title: "文学",
    creator: "作家",
    language: "jpn",
    dateRange: {
      from: "2000",
      to: "2023",
    },
  };

  const result = await searchSRU(params, {
    maximumRecords: 3,
    startRecord: 1,
  });

  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    const response = result.value;
    assertExists(response.items);
    assertExists(response.pagination);
    
    // Verify CQL query contains all elements
    const cql = response.query.cql;
    assertEquals(cql.includes('title="文学"'), true);
    assertEquals(cql.includes('creator="作家"'), true);
    assertEquals(cql.includes('language="jpn"'), true);
    assertEquals(cql.includes('date >= "2000"'), true);
    assertEquals(cql.includes('date <= "2023"'), true);
  }
});

Deno.test("searchSRU - search with exclusions", async () => {
  const params: SimpleSearchParams = {
    title: "小説",
    exclude: {
      language: "eng",
      creator: "翻訳者",
    },
  };

  const result = await searchSRU(params, {
    maximumRecords: 2,
  });

  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    const response = result.value;
    assertExists(response.query.cql);
    
    const cql = response.query.cql;
    assertEquals(cql.includes('title="小説"'), true);
    assertEquals(cql.includes("NOT"), true);
    assertEquals(cql.includes('language="eng"'), true);
    assertEquals(cql.includes('creator="翻訳者"'), true);
  }
});

Deno.test("searchSRU - empty search parameters", async () => {
  const params: SimpleSearchParams = {};

  const result = await searchSRU(params);

  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    const response = result.value;
    assertEquals(response.items.length, 0);
    assertEquals(response.pagination.totalResults, 0);
    assertEquals(response.query.cql, "");
  }
});

Deno.test("searchSRU - invalid ISBN format", async () => {
  const params: SimpleSearchParams = {
    isbn: "invalid-isbn-format",
  };

  const result = await searchSRU(params);

  assertEquals(result.isErr(), true);
  
  if (result.isErr()) {
    // The error message will contain "Schema validation failed" due to invalid ISBN format
    assertEquals(result.error.message.includes("Schema validation failed"), true);
  }
});

Deno.test("searchSRUWithCQL - raw CQL query", async () => {
  const result = await searchSRUWithCQL({
    operation: "searchRetrieve",
    query: 'title="夏目漱石"',
    maximumRecords: 3,
    startRecord: 1,
  });

  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    const response = result.value;
    assertExists(response.items);
    assertExists(response.pagination);
    assertEquals(response.query.cql, 'title="夏目漱石"');
  }
});

Deno.test("searchSRU - pagination options", async () => {
  const params: SimpleSearchParams = {
    anywhere: "図書",
  };

  const result = await searchSRU(params, {
    maximumRecords: 15,
    startRecord: 21, // Start from page 2 (if 15 per page)
    recordSchema: "dcndl",
  });

  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    const response = result.value;
    assertEquals(response.pagination.itemsPerPage, 15);
    assertEquals(response.pagination.startIndex, 21);
    assertEquals(response.query.schema, "dcndl");
  }
});