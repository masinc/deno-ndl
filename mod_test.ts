import { assertEquals } from "@std/assert";
import { explainSRU, searchOpenSearch, searchSRU } from "./mod.ts";

Deno.test("mod.ts exports searchOpenSearch", () => {
  assertEquals(typeof searchOpenSearch, "function");
});

Deno.test("mod.ts exports searchSRU", () => {
  assertEquals(typeof searchSRU, "function");
});

Deno.test("mod.ts exports explainSRU", () => {
  assertEquals(typeof explainSRU, "function");
});
