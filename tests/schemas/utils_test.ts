import { assertEquals } from "@std/assert";
import { z } from "zod/v4";
import {
  arrayOf,
  atLeastOne,
  formatValidationError,
  optional,
  parseXMLAttribute,
  safeParse,
} from "../../src/schemas/utils.ts";

Deno.test("safeParse returns Ok for valid data", () => {
  const schema = z.string();
  const result = safeParse(schema, "hello");

  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.value, "hello");
  }
});

Deno.test("safeParse returns Err for invalid data", () => {
  const schema = z.string();
  const result = safeParse(schema, 123);

  assertEquals(result.isErr(), true);
  if (result.isErr()) {
    assertEquals(result.error.type, "validation");
  }
});

Deno.test("formatValidationError creates readable message", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const result = schema.safeParse({ name: 123, age: "invalid" });
  if (!result.success) {
    const message = formatValidationError(result.error);
    assertEquals(message.includes("name:"), true);
    assertEquals(message.includes("age:"), true);
  }
});

Deno.test("optional creates schema with default", () => {
  const schema = optional(z.string(), "default");

  assertEquals(schema.parse(undefined), "default");
  assertEquals(schema.parse("custom"), "custom");
});

Deno.test("arrayOf creates constrained array schema", () => {
  const schema = arrayOf(z.string(), 1, 3);

  assertEquals(schema.parse(["one"]), ["one"]);
  assertEquals(schema.parse(["one", "two"]), ["one", "two"]);

  // Should throw for empty array (min 1)
  try {
    schema.parse([]);
    throw new Error("Should have thrown");
  } catch (error) {
    assertEquals(error instanceof z.ZodError, true);
  }

  // Should throw for too many items (max 3)
  try {
    schema.parse(["one", "two", "three", "four"]);
    throw new Error("Should have thrown");
  } catch (error) {
    assertEquals(error instanceof z.ZodError, true);
  }
});


Deno.test("parseXMLAttribute handles string attributes", () => {
  const schema = z.string();
  const result = parseXMLAttribute(schema, "hello");

  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.value, "hello");
  }
});

Deno.test("parseXMLAttribute handles number attributes", () => {
  const schema = z.number();
  const result = parseXMLAttribute(schema, "123");

  // Should parse as number
  assertEquals(result.isOk(), true);
});

Deno.test("parseXMLAttribute handles boolean attributes", () => {
  const schema = z.boolean();

  const trueResult = parseXMLAttribute(schema, "true");
  // Should parse as boolean
  assertEquals(trueResult.isOk(), true);
});

Deno.test("parseXMLAttribute handles undefined", () => {
  const schema = z.string().optional();
  const result = parseXMLAttribute(schema, undefined);

  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.value, undefined);
  }
});

Deno.test("atLeastOne validates at least one field is present", () => {
  const baseSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  });

  const schema = atLeastOne(baseSchema, ["name", "email"]);

  // Valid: has name
  assertEquals(schema.parse({ name: "John" }).name, "John");

  // Valid: has email
  assertEquals(
    schema.parse({ email: "john@example.com" }).email,
    "john@example.com",
  );

  // Valid: has both
  const both = schema.parse({ name: "John", email: "john@example.com" });
  assertEquals(both.name, "John");
  assertEquals(both.email, "john@example.com");

  // Invalid: has neither name nor email (phone doesn't count)
  try {
    schema.parse({ phone: "123-456-7890" });
    throw new Error("Should have thrown");
  } catch (error) {
    assertEquals(error instanceof z.ZodError, true);
  }

  // Invalid: empty object
  try {
    schema.parse({});
    throw new Error("Should have thrown");
  } catch (error) {
    assertEquals(error instanceof z.ZodError, true);
  }
});
