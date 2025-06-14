import { assertEquals } from "@std/assert";
import {
  networkError,
  apiError,
  validationError,
  isNetworkError,
  isAPIError,
  isValidationError,
} from "../src/errors.ts";

Deno.test("networkError creates correct error", () => {
  const error = networkError("Connection failed", new Error("timeout"));
  
  assertEquals(error.type, "network");
  assertEquals(error.message, "Connection failed");
  assertEquals(error.cause instanceof Error, true);
});

Deno.test("apiError creates correct error", () => {
  const mockResponse = new Response("", { status: 404 });
  const error = apiError("Not found", mockResponse);
  
  assertEquals(error.type, "api");
  assertEquals(error.message, "Not found");
  assertEquals(error.cause instanceof Response, true);
});

Deno.test("validationError creates correct error", () => {
  const validationIssues = [{ message: "Invalid field" }];
  const error = validationError("Schema validation failed", validationIssues);
  
  assertEquals(error.type, "validation");
  assertEquals(error.message, "Schema validation failed");
  assertEquals(Array.isArray(error.cause), true);
});

Deno.test("type guards work correctly", () => {
  const netError = networkError("test");
  const apiErr = apiError("test");
  const valError = validationError("test");
  
  assertEquals(isNetworkError(netError), true);
  assertEquals(isAPIError(netError), false);
  assertEquals(isValidationError(netError), false);
  
  assertEquals(isNetworkError(apiErr), false);
  assertEquals(isAPIError(apiErr), true);
  assertEquals(isValidationError(apiErr), false);
  
  assertEquals(isNetworkError(valError), false);
  assertEquals(isAPIError(valError), false);
  assertEquals(isValidationError(valError), true);
});