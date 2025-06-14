import { z } from "zod/v4";
import { type Result, ok, err } from "neverthrow";
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
  const issues = error.issues.map(issue => {
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
 * Create enum schema from array of strings
 * 
 * @param values - Array of enum values
 * @returns Enum schema
 */
export function enumFrom<T extends readonly [string, ...string[]]>(
  values: T,
): z.ZodEnum<T> {
  return z.enum(values);
}

/**
 * Create union schema from multiple schemas
 * 
 * @param schemas - Array of schemas to union
 * @returns Union schema
 */
export function unionOf<T extends readonly [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]>(
  schemas: T,
): z.ZodUnion<T> {
  if (schemas.length < 2) {
    throw new Error("Union requires at least 2 schemas");
  }
  return z.union(schemas);
}

/**
 * Create object schema with partial fields
 * 
 * @param shape - Object shape definition
 * @param partialKeys - Keys to make optional
 * @returns Object schema with partial fields
 */
export function objectWithPartial<
  T extends z.ZodRawShape,
  K extends keyof T,
>(
  shape: T,
  partialKeys: K[],
): z.ZodObject<z.ZodRawShape> {
  const newShape: z.ZodRawShape = { ...shape };
  
  for (const key of partialKeys) {
    if (shape[key] && typeof (shape[key] as any).optional === 'function') {
      newShape[key] = (shape[key] as any).optional();
    }
  }
  
  return z.object(newShape);
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
  
  // Try to parse as different types based on schema type
  const schemaType = (schema as any)._def?.typeName;
  
  if (schemaType === "ZodNumber") {
    const num = Number(value);
    return safeParse(schema, isNaN(num) ? value as unknown : num as unknown) as Result<T, NDLError<z.ZodError>>;
  }
  
  if (schemaType === "ZodBoolean") {
    const bool = value.toLowerCase();
    if (bool === "true" || bool === "1") {
      return safeParse(schema, true as unknown) as Result<T, NDLError<z.ZodError>>;
    }
    if (bool === "false" || bool === "0") {
      return safeParse(schema, false as unknown) as Result<T, NDLError<z.ZodError>>;
    }
  }
  
  return safeParse(schema, value);
}

/**
 * Compose multiple validation functions
 * 
 * @param validators - Array of validation functions
 * @returns Composed validation function
 */
export function composeValidators<T>(
  ...validators: Array<(data: T) => Result<T, NDLError>>
): (data: T) => Result<T, NDLError> {
  return (data: T) => {
    let result: Result<T, NDLError> = ok(data);
    
    for (const validator of validators) {
      result = result.andThen(validator);
      if (result.isErr()) {
        break;
      }
    }
    
    return result;
  };
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
    (data: Record<string, unknown>) => requiredFields.some(field => data[field as string] !== undefined),
    {
      message: `At least one of these fields is required: ${requiredFields.join(", ")}`,
    },
  );
}