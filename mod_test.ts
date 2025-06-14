import { assertEquals } from "@std/assert";
import { searchOpenSearch } from "./mod.ts";

Deno.test("mod.ts exports searchOpenSearch", () => {
  assertEquals(typeof searchOpenSearch, "function");
});
