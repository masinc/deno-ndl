import { assertEquals } from "@std/assert";
import { searchOpenSearch, searchSRU } from "./mod.ts";

Deno.test("mod.ts exports searchOpenSearch", () => {
  assertEquals(typeof searchOpenSearch, "function");
});

Deno.test("mod.ts exports searchSRU", () => {
  assertEquals(typeof searchSRU, "function");
});
