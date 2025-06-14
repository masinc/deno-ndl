import { z } from "zod/v4";
import { NonEmptyStringSchema, URLSchema } from "../common.ts";

/**
 * SRU response schemas
 */

/**
 * SRU diagnostic codes and messages
 */
export const SRUDiagnosticSchema = z.object({
  uri: z.string(), // SRU diagnostic URIs use info: scheme which is not a URL
  code: z.string().optional(),
  message: z.string(),
  details: z.string().optional(),
});

/**
 * SRU diagnostic list
 */
export const SRUDiagnosticsSchema = z.object({
  diagnostic: z.union([
    SRUDiagnosticSchema,
    z.array(SRUDiagnosticSchema),
  ]).optional(),
});

/**
 * SRU record data
 */
export const SRURecordDataSchema = z.object({
  "#text": z.string(),
  "@type": z.string().optional(),
});

/**
 * SRU record
 */
export const SRURecordSchema = z.object({
  recordSchema: z.string(), // SRU schema URIs, more flexible than URL
  recordPacking: z.enum(["xml", "string"]),
  recordData: z.union([
    z.string(),
    SRURecordDataSchema,
    z.record(z.string(), z.any()), // Flexible for various XML structures
  ]),
  recordPosition: z.coerce.number().int().positive().optional(),
  recordIdentifier: z.string().optional(),
});

/**
 * SRU records collection
 */
export const SRURecordsSchema = z.object({
  record: z.union([
    SRURecordSchema,
    z.array(SRURecordSchema),
  ]).optional(),
});

/**
 * SRU echo parameters (echoed back from request)
 */
export const SRUEchoedSearchRetrieveRequestSchema = z.object({
  version: z.string(),
  query: z.string(),
  startRecord: z.number().int().positive().optional(),
  maximumRecords: z.number().int().positive().optional(),
  recordPacking: z.string().optional(),
  recordSchema: z.string().optional(),
  resultSetTTL: z.number().int().optional(),
  sortBy: z.string().optional(),
  stylesheet: z.string().optional(),
});

/**
 * SRU next record position information
 */
export const SRUNextRecordPositionSchema = z.number().int().positive()
  .optional();

/**
 * SRU extra response data
 */
export const SRUExtraResponseDataSchema = z.union([
  z.string(),
  z.record(z.string(), z.any()),
]).optional();

/**
 * SRU search retrieve response
 */
export const SRUSearchRetrieveResponseSchema = z.object({
  /**
   * SRU version used
   */
  version: z.string().optional(),

  /**
   * Number of records matching the query
   */
  numberOfRecords: z.coerce.number().int().nonnegative().optional(),

  /**
   * Position of the first record returned
   */
  resultSetId: z.string().optional(),

  /**
   * Time to live for the result set
   */
  resultSetIdleTime: z.number().int().optional(),

  /**
   * Collection of records
   */
  records: SRURecordsSchema.optional(),

  /**
   * Position of next record if more are available
   */
  nextRecordPosition: z.coerce.number().int().positive().optional(),

  /**
   * Echo of the original request parameters
   */
  echoedSearchRetrieveRequest: SRUEchoedSearchRetrieveRequestSchema.optional(),

  /**
   * Any diagnostic messages
   */
  diagnostics: SRUDiagnosticsSchema.optional(),

  /**
   * Additional response data
   */
  extraResponseData: SRUExtraResponseDataSchema.optional(),
});

/**
 * SRU database info for explain response
 */
export const SRUDatabaseInfoSchema = z.object({
  title: NonEmptyStringSchema,
  description: z.string().optional(),
  author: z.string().optional(),
  extent: z.string().optional(),
  history: z.string().optional(),
  langUsage: z.string().optional(),
  restrictions: z.string().optional(),
  subjects: z.string().optional(),
  links: z.array(z.object({
    "@type": z.string(),
    "#text": URLSchema,
  })).optional(),
  implementation: z.object({
    "@identifier": URLSchema,
    "@version": z.string(),
    "#text": z.string().optional(),
  }).optional(),
});

/**
 * SRU index info
 */
export const SRUIndexInfoSchema = z.object({
  set: z.array(z.object({
    "@identifier": URLSchema,
    "@name": z.string(),
    title: z.string(),
    description: z.string().optional(),
  })).optional(),
  index: z.array(z.object({
    title: z.string(),
    map: z.object({
      "@primary": z.boolean().optional(),
      name: z.object({
        "@set": z.string().optional(),
        "#text": z.string(),
      }),
    }),
    configInfo: z.object({
      supports: z.array(z.object({
        "@type": z.string(),
        "#text": z.string(),
      })).optional(),
    }).optional(),
  })).optional(),
});

/**
 * SRU schema info
 */
export const SRUSchemaInfoSchema = z.object({
  schema: z.array(z.object({
    "@identifier": URLSchema,
    "@location": URLSchema.optional(),
    "@name": z.string(),
    "@sort": z.boolean().optional(),
    "@retrieve": z.boolean().optional(),
    title: z.string(),
    description: z.string().optional(),
  })).optional(),
});

/**
 * SRU configuration info
 */
export const SRUConfigInfoSchema = z.object({
  default: z.array(z.object({
    "@type": z.string(),
    "#text": z.string(),
  })).optional(),
  setting: z.array(z.object({
    "@type": z.string(),
    "#text": z.string(),
  })).optional(),
  supports: z.array(z.object({
    "@type": z.string(),
    "#text": z.string(),
  })).optional(),
});

/**
 * SRU explain response record
 */
export const SRUExplainResponseRecordSchema = z.object({
  recordSchema: z.literal("http://explain.z3950.org/dtd/2.0/"),
  recordPacking: z.enum(["xml", "string"]),
  recordData: z.object({
    explain: z.object({
      "@xmlns": z.string(),
      serverInfo: z.object({
        "@protocol": z.string(),
        "@version": z.string(),
        host: z.string(),
        port: z.coerce.number().int().positive(),
        database: z.string(),
      }),
      databaseInfo: SRUDatabaseInfoSchema,
      indexInfo: SRUIndexInfoSchema.optional(),
      schemaInfo: SRUSchemaInfoSchema.optional(),
      configInfo: SRUConfigInfoSchema.optional(),
    }),
  }),
});

/**
 * SRU explain response
 */
export const SRUExplainResponseSchema = z.object({
  /**
   * SRU version used
   */
  version: z.string(),

  /**
   * Explain record containing server capabilities
   */
  record: SRUExplainResponseRecordSchema,

  /**
   * Echo of the original explain request
   */
  echoedExplainRequest: z.object({
    version: z.string(),
    recordPacking: z.string().optional(),
    stylesheet: z.string().optional(),
  }).optional(),

  /**
   * Any diagnostic messages
   */
  diagnostics: SRUDiagnosticsSchema.optional(),

  /**
   * Additional response data
   */
  extraResponseData: SRUExtraResponseDataSchema,
});

/**
 * Generic SRU response wrapper
 */
export const SRUResponseSchema = z.object({
  "@xmlns": z.string().optional(),
  searchRetrieveResponse: SRUSearchRetrieveResponseSchema.optional(),
  explainResponse: SRUExplainResponseSchema.optional(),
});

/**
 * Parsed SRU response (discriminated union)
 */
export const ParsedSRUResponseSchema = z.union([
  z.object({
    type: z.literal("searchRetrieve"),
    response: SRUSearchRetrieveResponseSchema,
  }),
  z.object({
    type: z.literal("explain"),
    response: SRUExplainResponseSchema,
  }),
]);

/**
 * Type exports
 */
export type SRUDiagnostic = z.infer<typeof SRUDiagnosticSchema>;
export type SRUDiagnostics = z.infer<typeof SRUDiagnosticsSchema>;
export type SRURecord = z.infer<typeof SRURecordSchema>;
export type SRURecords = z.infer<typeof SRURecordsSchema>;
export type SRUSearchRetrieveResponse = z.infer<
  typeof SRUSearchRetrieveResponseSchema
>;
export type SRUExplainResponse = z.infer<typeof SRUExplainResponseSchema>;
export type SRUResponse = z.infer<typeof SRUResponseSchema>;
export type ParsedSRUResponse = z.infer<typeof ParsedSRUResponseSchema>;
export type SRUDatabaseInfo = z.infer<typeof SRUDatabaseInfoSchema>;
export type SRUIndexInfo = z.infer<typeof SRUIndexInfoSchema>;
export type SRUSchemaInfo = z.infer<typeof SRUSchemaInfoSchema>;
export type SRUConfigInfo = z.infer<typeof SRUConfigInfoSchema>;
