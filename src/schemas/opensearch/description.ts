import { z } from "zod/v4";
import { NonEmptyStringSchema, URLSchema } from "../common.ts";

/**
 * OpenSearch Description Document schemas
 */

/**
 * OpenSearch URL element schema
 */
export const OpenSearchUrlSchema = z.object({
  "@type": NonEmptyStringSchema,
  "@template": URLSchema,
  "@indexOffset": z.number().int().min(0).optional(),
  "@pageOffset": z.number().int().min(0).optional(),
});

/**
 * OpenSearch Image element schema
 */
export const OpenSearchImageSchema = z.object({
  "#text": URLSchema,
  "@height": z.number().int().positive().optional(),
  "@width": z.number().int().positive().optional(),
  "@type": NonEmptyStringSchema.optional(),
});

/**
 * OpenSearch Query element schema
 */
export const OpenSearchQueryElementSchema = z.object({
  "@role": z.enum([
    "request",
    "example",
    "related",
    "correction",
    "subset",
    "superset",
  ]),
  "@searchTerms": NonEmptyStringSchema.optional(),
  "@count": z.number().int().positive().optional(),
  "@startIndex": z.number().int().min(0).optional(),
  "@startPage": z.number().int().positive().optional(),
  "@language": z.string().optional(),
  "@outputEncoding": z.string().optional(),
  "@inputEncoding": z.string().optional(),
});

/**
 * OpenSearch Description Document schema
 */
export const OpenSearchDescriptionSchema = z.object({
  OpenSearchDescription: z.object({
    "@xmlns": z.literal("http://a9.com/-/spec/opensearch/1.1/"),

    // Required elements
    ShortName: NonEmptyStringSchema,
    Description: NonEmptyStringSchema,
    Url: z.union([
      OpenSearchUrlSchema,
      z.array(OpenSearchUrlSchema),
    ]),

    // Optional elements
    Contact: z.string().email().optional(),
    Tags: NonEmptyStringSchema.optional(),
    LongName: NonEmptyStringSchema.optional(),
    Image: z.union([
      OpenSearchImageSchema,
      z.array(OpenSearchImageSchema),
    ]).optional(),
    Query: z.union([
      OpenSearchQueryElementSchema,
      z.array(OpenSearchQueryElementSchema),
    ]).optional(),
    Developer: NonEmptyStringSchema.optional(),
    Attribution: NonEmptyStringSchema.optional(),
    SyndicationRight: z.enum(["open", "limited", "private", "closed"])
      .optional(),
    AdultContent: z.boolean().optional(),
    Language: z.union([
      z.string(),
      z.array(z.string()),
    ]).optional(),
    OutputEncoding: z.union([
      z.string(),
      z.array(z.string()),
    ]).optional(),
    InputEncoding: z.union([
      z.string(),
      z.array(z.string()),
    ]).optional(),
  }),
});

/**
 * Type exports
 */
export type OpenSearchUrl = z.infer<typeof OpenSearchUrlSchema>;
export type OpenSearchImage = z.infer<typeof OpenSearchImageSchema>;
export type OpenSearchQueryElement = z.infer<
  typeof OpenSearchQueryElementSchema
>;
export type OpenSearchDescription = z.infer<typeof OpenSearchDescriptionSchema>;
