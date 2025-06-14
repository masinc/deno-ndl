import { assertEquals } from "@std/assert";
import { buildURL } from "../../src/utils/http.ts";

Deno.test("buildURL with no parameters", () => {
  const url = buildURL("https://example.com/api");

  assertEquals(url.toString(), "https://example.com/api");
});

Deno.test("buildURL with string parameters", () => {
  const url = buildURL("https://example.com/api", {
    query: "test",
    format: "xml",
  });

  assertEquals(url.toString(), "https://example.com/api?query=test&format=xml");
});

Deno.test("buildURL with mixed parameter types", () => {
  const url = buildURL("https://example.com/api", {
    query: "search term",
    startRecord: 1,
    maximumRecords: 10,
    sortKeys: undefined,
    includeMetadata: true,
  });

  const expected =
    "https://example.com/api?query=search+term&startRecord=1&maximumRecords=10&includeMetadata=true";
  assertEquals(url.toString(), expected);
});

Deno.test("buildURL with URL object as base", () => {
  const baseUrl = new URL("https://example.com/api");
  const url = buildURL(baseUrl, { param: "value" });

  assertEquals(url.toString(), "https://example.com/api?param=value");
});

Deno.test("buildURL filters undefined values", () => {
  const url = buildURL("https://example.com/api", {
    defined: "value",
    undefined: undefined,
    empty: "",
    zero: 0,
  });

  assertEquals(
    url.toString(),
    "https://example.com/api?defined=value&empty=&zero=0",
  );
});
