import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import { validationError } from "../errors.ts";
import type { NDLError } from "../errors.ts";

/**
 * Schema validation utilities
 */

/**
 * Safe parse with Result type
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result containing parsed data or validation error
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<T, NDLError<z.ZodError>> {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  return err(validationError(
    "Schema validation failed",
    result.error,
  ));
}

/**
 * Transform validation error to readable format
 *
 * @param error - Zod error object
 * @returns Formatted error message
 */
export function formatValidationError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });

  return `Validation failed: ${issues.join(", ")}`;
}

/**
 * Create optional schema with default
 *
 * @param schema - Base schema
 * @param defaultValue - Default value
 * @returns Optional schema with default
 */
export function optional<T>(
  schema: z.ZodSchema<T>,
  defaultValue: T,
): z.ZodDefault<z.ZodOptional<z.ZodSchema<T>>> {
  return schema.optional().default(defaultValue);
}

/**
 * Create array schema with min/max constraints
 *
 * @param itemSchema - Schema for array items
 * @param min - Minimum array length
 * @param max - Maximum array length
 * @returns Constrained array schema
 */
export function arrayOf<T>(
  itemSchema: z.ZodSchema<T>,
  min = 0,
  max?: number,
): z.ZodArray<z.ZodSchema<T>> {
  let schema = z.array(itemSchema).min(min);
  if (max !== undefined) {
    schema = schema.max(max);
  }
  return schema;
}

/**
 * Validate and transform XML attribute to schema
 *
 * @param schema - Target schema
 * @param value - XML attribute value (always string)
 * @returns Parsed value or validation error
 */
export function parseXMLAttribute<T>(
  schema: z.ZodSchema<T>,
  value: string | undefined,
): Result<T, NDLError<z.ZodError>> {
  if (value === undefined) {
    return safeParse(schema, undefined);
  }

  // Try parsing as number first
  const num = Number(value);
  if (!isNaN(num)) {
    const numResult = safeParse(schema, num as unknown);
    if (numResult.isOk()) {
      return numResult as Result<T, NDLError<z.ZodError>>;
    }
  }

  // Try parsing as boolean
  const lowerValue = value.toLowerCase();
  if (lowerValue === "true" || lowerValue === "1") {
    const boolResult = safeParse(schema, true as unknown);
    if (boolResult.isOk()) {
      return boolResult as Result<T, NDLError<z.ZodError>>;
    }
  }
  if (lowerValue === "false" || lowerValue === "0") {
    const boolResult = safeParse(schema, false as unknown);
    if (boolResult.isOk()) {
      return boolResult as Result<T, NDLError<z.ZodError>>;
    }
  }

  // Fall back to string parsing
  return safeParse(schema, value);
}

/**
 * Create a schema that validates at least one field is present
 *
 * @param schema - Base object schema
 * @param requiredFields - At least one of these fields must be present
 * @returns Schema with at-least-one validation
 */
export function atLeastOne<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  requiredFields: (keyof T)[],
): z.ZodType<z.infer<z.ZodObject<T>>> {
  return schema.refine(
    (data: Record<string, unknown>) =>
      requiredFields.some((field) => data[field as string] !== undefined),
    {
      message: `At least one of these fields is required: ${
        requiredFields.join(", ")
      }`,
    },
  );
}
