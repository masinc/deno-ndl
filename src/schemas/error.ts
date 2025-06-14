import { z } from "zod/v4";
import { HTTPStatusSchema, ErrorSeveritySchema, NonEmptyStringSchema } from "./common.ts";

/**
 * API error response schemas
 */

/**
 * Basic error detail schema
 */
export const ErrorDetailSchema = z.object({
  code: NonEmptyStringSchema,
  message: NonEmptyStringSchema,
  severity: ErrorSeveritySchema.default("error"),
  field: NonEmptyStringSchema.optional(),
  value: z.unknown().optional(),
});

/**
 * SRU error schema (SRU standard)
 */
export const SRUErrorSchema = z.object({
  "srw:diagnostic": z.object({
    "srw:uri": NonEmptyStringSchema,
    "srw:details": NonEmptyStringSchema.optional(),
    "srw:message": NonEmptyStringSchema.optional(),
  }),
});

/**
 * OAI-PMH error schema
 */
export const OAIPMHErrorSchema = z.object({
  error: z.object({
    "@code": z.enum([
      "badArgument",
      "badResumptionToken",
      "badVerb",
      "cannotDisseminateFormat",
      "idDoesNotExist",
      "noRecordsMatch",
      "noMetadataFormats",
      "noSetHierarchy",
    ]),
    "#text": NonEmptyStringSchema.optional(),
  }),
});

/**
 * HTTP error response schema
 */
export const HTTPErrorResponseSchema = z.object({
  status: HTTPStatusSchema,
  statusText: NonEmptyStringSchema,
  message: NonEmptyStringSchema.optional(),
  details: z.array(ErrorDetailSchema).optional(),
  timestamp: z.string().datetime().optional(),
  path: NonEmptyStringSchema.optional(),
});

/**
 * Network error schema
 */
export const NetworkErrorSchema = z.object({
  type: z.literal("network"),
  message: NonEmptyStringSchema,
  cause: z.object({
    name: NonEmptyStringSchema,
    message: NonEmptyStringSchema,
    code: NonEmptyStringSchema.optional(),
  }).optional(),
});

/**
 * Validation error schema
 */
export const ValidationErrorSchema = z.object({
  type: z.literal("validation"),
  message: NonEmptyStringSchema,
  issues: z.array(z.object({
    path: z.array(z.union([z.string(), z.number()])),
    message: NonEmptyStringSchema,
    code: NonEmptyStringSchema,
    expected: z.unknown().optional(),
    received: z.unknown().optional(),
  })).optional(),
});

/**
 * API error schema
 */
export const APIErrorSchema = z.object({
  type: z.literal("api"),
  message: NonEmptyStringSchema,
  response: HTTPErrorResponseSchema.optional(),
});

/**
 * Generic NDL error schema
 */
export const NDLErrorSchema = z.discriminatedUnion("type", [
  NetworkErrorSchema,
  ValidationErrorSchema,
  APIErrorSchema,
]);

/**
 * Error response wrapper
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: NDLErrorSchema,
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
  requestId: NonEmptyStringSchema.optional(),
});

/**
 * Type exports
 */
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
export type SRUError = z.infer<typeof SRUErrorSchema>;
export type OAIPMHError = z.infer<typeof OAIPMHErrorSchema>;
export type HTTPErrorResponse = z.infer<typeof HTTPErrorResponseSchema>;
export type NetworkError = z.infer<typeof NetworkErrorSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;
export type NDLError = z.infer<typeof NDLErrorSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;