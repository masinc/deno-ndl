import { assertEquals, assertThrows } from "@std/assert";
import {
  CQLQuerySchema,
  SRUExplainRequestSchema,
  SRUOperationSchema,
  SRURecordSchemaSchemaExported as SRURecordSchemaSchema,
  SRUSearchRetrieveRequestSchema,
  SRUVersionSchema,
} from "../../src/schemas/sru/mod.ts";

Deno.test("SRUOperationSchema validates operation types", () => {
  assertEquals(SRUOperationSchema.parse("searchRetrieve"), "searchRetrieve");
  assertEquals(SRUOperationSchema.parse("explain"), "explain");
  assertEquals(SRUOperationSchema.parse(undefined), "searchRetrieve"); // default

  assertThrows(() => SRUOperationSchema.parse("invalid"));
});

Deno.test("SRUVersionSchema validates version numbers", () => {
  assertEquals(SRUVersionSchema.parse("1.1"), "1.1");
  assertEquals(SRUVersionSchema.parse("1.2"), "1.2");
  assertEquals(SRUVersionSchema.parse(undefined), "1.2"); // default

  assertThrows(() => SRUVersionSchema.parse("2.0"));
  assertThrows(() => SRUVersionSchema.parse("1.0"));
});

Deno.test("CQLQuerySchema validates query strings", () => {
  assertEquals(CQLQuerySchema.parse("title=test"), "title=test");
  assertEquals(
    CQLQuerySchema.parse('title="complex query"'),
    'title="complex query"',
  );
  assertEquals(
    CQLQuerySchema.parse("title=test AND creator=author"),
    "title=test AND creator=author",
  );

  assertThrows(() => CQLQuerySchema.parse(""));
});

Deno.test("SRURecordSchemaSchema validates schema identifiers", () => {
  assertEquals(
    SRURecordSchemaSchema.parse("info:srw/schema/1/dc-v1.1"),
    "info:srw/schema/1/dc-v1.1",
  );
  assertEquals(
    SRURecordSchemaSchema.parse("info:srw/schema/1/mods-v3.0"),
    "info:srw/schema/1/mods-v3.0",
  );
  assertEquals(SRURecordSchemaSchema.parse("dcndl"), "dcndl");
  assertEquals(
    SRURecordSchemaSchema.parse(undefined),
    "info:srw/schema/1/dc-v1.1",
  ); // default

  assertThrows(() => SRURecordSchemaSchema.parse("invalid-schema"));
});

Deno.test("SRUSearchRetrieveRequestSchema validates complete request", () => {
  const validRequest = {
    operation: "searchRetrieve" as const,
    query: "title=test",
    startRecord: 1,
    maximumRecords: 10,
    recordSchema: "info:srw/schema/1/dc-v1.1" as const,
  };

  const parsed = SRUSearchRetrieveRequestSchema.parse(validRequest);
  assertEquals(parsed.operation, "searchRetrieve");
  assertEquals(parsed.query, "title=test");
  assertEquals(parsed.startRecord, 1);
  assertEquals(parsed.maximumRecords, 10);
  assertEquals(parsed.recordSchema, "info:srw/schema/1/dc-v1.1");
});

Deno.test("SRUSearchRetrieveRequestSchema validates minimal request", () => {
  const minimalRequest = {
    operation: "searchRetrieve" as const,
    query: "test",
  };

  const parsed = SRUSearchRetrieveRequestSchema.parse(minimalRequest);
  assertEquals(parsed.operation, "searchRetrieve");
  assertEquals(parsed.query, "test");
  assertEquals(parsed.startRecord, undefined);
  assertEquals(parsed.maximumRecords, undefined);
});

Deno.test("SRUSearchRetrieveRequestSchema validates NDL-specific parameters", () => {
  const request = {
    operation: "searchRetrieve" as const,
    query: "test",
    inprocess: true,
    lang: "ja" as const,
  };

  const parsed = SRUSearchRetrieveRequestSchema.parse(request);
  assertEquals(parsed.inprocess, true);
  assertEquals(parsed.lang, "ja");
});

Deno.test("SRUSearchRetrieveRequestSchema rejects invalid data", () => {
  assertThrows(() =>
    SRUSearchRetrieveRequestSchema.parse({
      operation: "searchRetrieve",
      query: "", // empty query
    })
  );

  assertThrows(() =>
    SRUSearchRetrieveRequestSchema.parse({
      operation: "searchRetrieve",
      query: "test",
      startRecord: 0, // must be positive
    })
  );

  assertThrows(() =>
    SRUSearchRetrieveRequestSchema.parse({
      operation: "searchRetrieve",
      query: "test",
      maximumRecords: 0, // must be positive
    })
  );

  assertThrows(() =>
    SRUSearchRetrieveRequestSchema.parse({
      operation: "searchRetrieve",
      query: "test",
      maximumRecords: 1000, // exceeds maximum
    })
  );
});

Deno.test("SRUExplainRequestSchema validates explain request", () => {
  const request = {
    operation: "explain" as const,
    version: "1.2" as const,
    recordPacking: "xml" as const,
  };

  const parsed = SRUExplainRequestSchema.parse(request);
  assertEquals(parsed.operation, "explain");
  assertEquals(parsed.version, "1.2");
  assertEquals(parsed.recordPacking, "xml");
});

Deno.test("SRUExplainRequestSchema validates minimal explain request", () => {
  const request = {
    operation: "explain" as const,
  };

  const parsed = SRUExplainRequestSchema.parse(request);
  assertEquals(parsed.operation, "explain");
  assertEquals(parsed.version, undefined);
});

Deno.test("SRUSearchRetrieveRequestSchema validates sort specification", () => {
  const request = {
    operation: "searchRetrieve" as const,
    query: "test",
    sortBy: "title ascending",
  };

  const parsed = SRUSearchRetrieveRequestSchema.parse(request);
  assertEquals(parsed.sortBy, "title ascending");
});

Deno.test("SRUSearchRetrieveRequestSchema validates result set TTL", () => {
  const request = {
    operation: "searchRetrieve" as const,
    query: "test",
    resultSetTTL: 300,
  };

  const parsed = SRUSearchRetrieveRequestSchema.parse(request);
  assertEquals(parsed.resultSetTTL, 300);

  // Test maximum TTL
  assertThrows(() =>
    SRUSearchRetrieveRequestSchema.parse({
      operation: "searchRetrieve" as const,
      query: "test",
      resultSetTTL: 4000, // exceeds 3600 seconds
    })
  );
});

Deno.test("SRUSearchRetrieveRequestSchema validates stylesheet URL", () => {
  const request = {
    operation: "searchRetrieve" as const,
    query: "test",
    stylesheet: "https://example.com/style.xsl",
  };

  const parsed = SRUSearchRetrieveRequestSchema.parse(request);
  assertEquals(parsed.stylesheet, "https://example.com/style.xsl");

  // Test invalid URL
  assertThrows(() =>
    SRUSearchRetrieveRequestSchema.parse({
      operation: "searchRetrieve" as const,
      query: "test",
      stylesheet: "not-a-url",
    })
  );
});

Deno.test("SRUSearchRetrieveRequestSchema validates language parameter", () => {
  const requestJa = {
    operation: "searchRetrieve" as const,
    query: "test",
    lang: "ja" as const,
  };

  const requestEn = {
    operation: "searchRetrieve" as const,
    query: "test",
    lang: "en" as const,
  };

  assertEquals(SRUSearchRetrieveRequestSchema.parse(requestJa).lang, "ja");
  assertEquals(SRUSearchRetrieveRequestSchema.parse(requestEn).lang, "en");

  assertThrows(() =>
    SRUSearchRetrieveRequestSchema.parse({
      operation: "searchRetrieve" as const,
      query: "test",
      lang: "fr", // not supported
    })
  );
});
