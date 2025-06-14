import { assertEquals, assertThrows } from "@std/assert";
import {
  DOISchema,
  ISBNSchema,
  ISO8601DateSchema,
  ISSNSchema,
  JPNumberSchema,
  MaximumRecordsSchema,
  NDLRecordFormatSchema,
  NonEmptyStringSchema,
  PaginationSchema,
  PositiveIntegerSchema,
  ResponseFormatSchema,
  StartRecordSchema,
  URLSchema,
} from "../../src/schemas/common.ts";

Deno.test("NonEmptyStringSchema validates correctly", () => {
  // Valid cases
  assertEquals(NonEmptyStringSchema.parse("hello"), "hello");
  assertEquals(NonEmptyStringSchema.parse("test"), "test");

  // Invalid cases
  assertThrows(() => NonEmptyStringSchema.parse(""));
});

Deno.test("URLSchema validates URLs", () => {
  // Valid URLs
  assertEquals(URLSchema.parse("https://example.com"), "https://example.com");
  assertEquals(URLSchema.parse("http://test.org/path"), "http://test.org/path");

  // Invalid URLs
  assertThrows(() => URLSchema.parse("not-a-url"));
  assertThrows(() => URLSchema.parse(""));
});

Deno.test("ISO8601DateSchema validates datetime strings", () => {
  // Valid datetime
  const validDate = "2024-01-01T00:00:00Z";
  assertEquals(ISO8601DateSchema.parse(validDate), validDate);

  // Invalid datetime
  assertThrows(() => ISO8601DateSchema.parse("2024-01-01"));
  assertThrows(() => ISO8601DateSchema.parse("invalid-date"));
});

Deno.test("PositiveIntegerSchema validates positive numbers", () => {
  // Valid positive integers
  assertEquals(PositiveIntegerSchema.parse(1), 1);
  assertEquals(PositiveIntegerSchema.parse(100), 100);

  // Invalid cases
  assertThrows(() => PositiveIntegerSchema.parse(0));
  assertThrows(() => PositiveIntegerSchema.parse(-1));
  assertThrows(() => PositiveIntegerSchema.parse(1.5));
});

Deno.test("StartRecordSchema has default value", () => {
  assertEquals(StartRecordSchema.parse(undefined), 1);
  assertEquals(StartRecordSchema.parse(5), 5);
});

Deno.test("MaximumRecordsSchema validates with constraints", () => {
  assertEquals(MaximumRecordsSchema.parse(undefined), 10);
  assertEquals(MaximumRecordsSchema.parse(50), 50);
  assertEquals(MaximumRecordsSchema.parse(500), 500);

  // Exceeds maximum
  assertThrows(() => MaximumRecordsSchema.parse(501));
});

Deno.test("PaginationSchema validates pagination object", () => {
  const validPagination = {
    startRecord: 1,
    maximumRecords: 20,
    totalRecords: 100,
  };

  const result = PaginationSchema.parse(validPagination);
  assertEquals(result.startRecord, 1);
  assertEquals(result.maximumRecords, 20);
  assertEquals(result.totalRecords, 100);

  // With defaults
  const withDefaults = PaginationSchema.parse({});
  assertEquals(withDefaults.startRecord, 1);
  assertEquals(withDefaults.maximumRecords, 10);
});

Deno.test("ISBNSchema validates ISBN formats", () => {
  // Valid ISBNs
  assertEquals(ISBNSchema.parse("9784123456789"), "9784123456789");
  assertEquals(ISBNSchema.parse("978-4-12-345678-9"), "978-4-12-345678-9");
  assertEquals(ISBNSchema.parse("412345678X"), "412345678X");

  // Invalid ISBNs
  assertThrows(() => ISBNSchema.parse("123"));
  assertThrows(() => ISBNSchema.parse("invalid-isbn"));
});

Deno.test("ISSNSchema validates ISSN format", () => {
  // Valid ISSN
  assertEquals(ISSNSchema.parse("1234-5678"), "1234-5678");
  assertEquals(ISSNSchema.parse("0000-000X"), "0000-000X");

  // Invalid ISSN
  assertThrows(() => ISSNSchema.parse("12345678"));
  assertThrows(() => ISSNSchema.parse("1234-567"));
});

Deno.test("JPNumberSchema validates JP number format", () => {
  // Valid JP number
  assertEquals(JPNumberSchema.parse("JP12345678"), "JP12345678");

  // Invalid JP number
  assertThrows(() => JPNumberSchema.parse("JP1234567"));
  assertThrows(() => JPNumberSchema.parse("12345678"));
  assertThrows(() => JPNumberSchema.parse("JP123456789"));
});

Deno.test("DOISchema validates DOI format", () => {
  // Valid DOI
  assertEquals(DOISchema.parse("10.1000/182"), "10.1000/182");
  assertEquals(DOISchema.parse("10.1038/nature12373"), "10.1038/nature12373");

  // Invalid DOI
  assertThrows(() => DOISchema.parse("doi:10.1000/182"));
  assertThrows(() => DOISchema.parse("10.1000"));
});

Deno.test("ResponseFormatSchema validates format types", () => {
  assertEquals(ResponseFormatSchema.parse("xml"), "xml");
  assertEquals(ResponseFormatSchema.parse("json"), "json");
  assertEquals(ResponseFormatSchema.parse("rss"), "rss");

  assertThrows(() => ResponseFormatSchema.parse("invalid"));
});

Deno.test("NDLRecordFormatSchema validates NDL formats", () => {
  assertEquals(NDLRecordFormatSchema.parse("dcndl"), "dcndl");
  assertEquals(NDLRecordFormatSchema.parse("dc"), "dc");
  assertEquals(NDLRecordFormatSchema.parse("mods"), "mods");

  assertThrows(() => NDLRecordFormatSchema.parse("invalid"));
});
