import { assertEquals, assertThrows } from "@std/assert";
import {
  buildAdvancedCQLQuery,
  buildSimpleCQLQuery,
  createCQLBuilder,
  validateCQLQuery,
} from "../../src/utils/cql-builder.ts";
import type {
  AdvancedSearchParams,
  SimpleSearchParams,
} from "../../src/schemas/sru/query-builder.ts";

Deno.test("CQLQueryBuilder - basic field search", () => {
  const builder = createCQLBuilder();
  const query = builder
    .title("夏目漱石")
    .creator("文学者")
    .build();

  assertEquals(query, 'title="夏目漱石" AND creator="文学者"');
});

Deno.test("CQLQueryBuilder - ISBN search", () => {
  const builder = createCQLBuilder();
  const query = builder
    .isbn("978-4-00-310101-8")
    .build();

  assertEquals(query, 'isbn="9784003101018"');
});

Deno.test("CQLQueryBuilder - language filter", () => {
  const builder = createCQLBuilder();
  const query = builder
    .language(["jpn", "eng"])
    .build();

  assertEquals(query, '(language="jpn" OR language="eng")');
});

Deno.test("CQLQueryBuilder - date range", () => {
  const builder = createCQLBuilder();
  const query = builder
    .dateRange({ from: "2020", to: "2023" })
    .build();

  assertEquals(query, '(date >= "2020" AND date <= "2023")');
});

Deno.test("CQLQueryBuilder - complex query with AND/OR", () => {
  const builder1 = createCQLBuilder().title("夏目漱石");
  const builder2 = createCQLBuilder().creator("森鴎外");
  
  const query = builder1.or(builder2).build();
  assertEquals(query, '(title="夏目漱石") OR (creator="森鴎外")');
});

Deno.test("CQLQueryBuilder - NOT operator", () => {
  const builder = createCQLBuilder();
  const query = builder
    .title("文学")
    .language("eng")
    .not()
    .build();

  assertEquals(query, 'NOT (title="文学" AND language="eng")');
});

Deno.test("buildSimpleCQLQuery - basic parameters", () => {
  const params: SimpleSearchParams = {
    title: "夏目漱石",
    creator: "作家",
    language: "jpn",
  };

  const result = buildSimpleCQLQuery(params);
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(
      result.value,
      'title="夏目漱石" AND creator="作家" AND language="jpn"'
    );
  }
});

Deno.test("buildSimpleCQLQuery - with exclusions", () => {
  const params: SimpleSearchParams = {
    title: "文学",
    exclude: {
      language: "eng",
      creator: "翻訳者",
    },
  };

  const result = buildSimpleCQLQuery(params);
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    const query = result.value;
    assertEquals(query.includes('title="文学"'), true);
    assertEquals(query.includes('NOT'), true);
    assertEquals(query.includes('language="eng"'), true);
    assertEquals(query.includes('creator="翻訳者"'), true);
  }
});

Deno.test("buildSimpleCQLQuery - invalid ISBN", () => {
  const params: SimpleSearchParams = {
    isbn: "invalid-isbn",
  };

  const result = buildSimpleCQLQuery(params);
  assertEquals(result.isErr(), true);
});

Deno.test("buildSimpleCQLQuery - invalid date range", () => {
  const params: SimpleSearchParams = {
    dateRange: {
      from: "2023",
      to: "2020", // Invalid: end before start
    },
  };

  const result = buildSimpleCQLQuery(params);
  assertEquals(result.isErr(), true);
});

Deno.test("buildAdvancedCQLQuery - multiple fields", () => {
  const params: AdvancedSearchParams = {
    fields: [
      { field: "title", value: "夏目漱石", operator: "=" },
      { field: "type", value: "Book", operator: "=" },
    ],
    operator: "AND",
  };

  const result = buildAdvancedCQLQuery(params);
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(
      result.value,
      'title="夏目漱石" AND type="Book"'
    );
  }
});

// TODO: Add nested groups test when feature is implemented

Deno.test("validateCQLQuery - valid query", () => {
  const result = validateCQLQuery('title="夏目漱石" AND creator="作家"');
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(result.value.isValid, true);
    assertEquals(result.value.errors.length, 0);
  }
});

Deno.test("validateCQLQuery - empty query", () => {
  const result = validateCQLQuery("");
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(result.value.isValid, false);
    assertEquals(result.value.errors.includes("Query cannot be empty"), true);
  }
});

Deno.test("validateCQLQuery - unmatched parentheses", () => {
  const result = validateCQLQuery('(title="test" AND creator="author"');
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(result.value.isValid, false);
    assertEquals(result.value.errors.includes("Unmatched parentheses in query"), true);
  }
});

Deno.test("validateCQLQuery - unmatched quotes", () => {
  const result = validateCQLQuery('title="test AND creator="author"');
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(result.value.isValid, false);
    assertEquals(result.value.errors.includes("Unmatched quotes in query"), true);
  }
});

Deno.test("CQLQueryBuilder - escape special characters", () => {
  const builder = createCQLBuilder({ autoEscape: true });
  const query = builder
    .title('Test "quoted" text')
    .build();

  assertEquals(query, 'title="Test \\"quoted\\" text"');
});

Deno.test("CQLQueryBuilder - anywhere search", () => {
  const builder = createCQLBuilder();
  const query = builder
    .anywhere("夏目漱石")
    .build();

  assertEquals(query, 'anywhere="夏目漱石"');
});

Deno.test("CQLQueryBuilder - validation with warnings", () => {
  const builder = createCQLBuilder();
  builder
    .title("test1")
    .creator("test2")
    .subject("test3")
    .publisher("test4")
    .anywhere("test5")
    .field("description", "test6");

  const result = builder.validate();
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(result.value.isValid, true);
    assertEquals(result.value.warnings.length > 0, true);
    assertEquals(result.value.complexity > 5, true);
  }
});

Deno.test("buildSimpleCQLQuery - empty parameters", () => {
  const params: SimpleSearchParams = {};

  const result = buildSimpleCQLQuery(params);
  assertEquals(result.isOk(), true);
  
  if (result.isOk()) {
    assertEquals(result.value, "");
  }
});

Deno.test("CQLQueryBuilder - different operators", () => {
  const builder = createCQLBuilder();
  
  builder.field("title", "夏目漱石", "exact");
  assertEquals(builder.build(), 'title="夏目漱石"');
  
  builder.reset().field("title", "夏目", "starts");
  assertEquals(builder.build(), 'title="夏目*"');
  
  builder.reset().field("title", "漱石", "ends");
  assertEquals(builder.build(), 'title="*漱石"');
});