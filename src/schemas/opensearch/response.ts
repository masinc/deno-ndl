import { z } from "zod/v4";
import {
  ISO8601DateSchema,
  NonEmptyStringSchema,
  URLSchema,
} from "../common.ts";

/**
 * OpenSearch API response schemas for RSS/Atom feeds
 */

/**
 * OpenSearch namespace schema
 */
export const OpenSearchNamespaceSchema = z.object({
  "opensearch:totalResults": z.number().int().min(0),
  "opensearch:startIndex": z.number().int().min(0),
  "opensearch:itemsPerPage": z.number().int().min(0),
  "opensearch:Query": z.object({
    role: z.string(),
    searchTerms: NonEmptyStringSchema,
    startPage: z.number().int().min(1).optional(),
  }).optional(),
});

/**
 * RSS channel schema
 */
export const RSSChannelSchema = z.object({
  title: NonEmptyStringSchema,
  link: URLSchema,
  description: NonEmptyStringSchema,
  language: z.string().optional(),
  lastBuildDate: ISO8601DateSchema.optional(),
  generator: NonEmptyStringSchema.optional(),

  // OpenSearch specific elements (実際のAPIでは名前空間プレフィックス付き、文字列で返される)
  "openSearch:totalResults": z.string().transform((val) => parseInt(val, 10)),
  "openSearch:startIndex": z.string().transform((val) => parseInt(val, 10)),
  "openSearch:itemsPerPage": z.string().transform((val) => parseInt(val, 10)),
  "openSearch:Query": z.object({
    "@role": z.string(),
    "@searchTerms": NonEmptyStringSchema,
    "@startPage": z.number().int().min(1).optional(),
  }).optional(),
});

/**
 * RSS item schema
 */
export const RSSItemSchema = z.object({
  title: NonEmptyStringSchema,
  link: URLSchema,
  description: z.string().optional(), // CDATAやHTML内容を許可
  author: z.string().optional(), // 空文字列も許可される
  category: z.union([
    NonEmptyStringSchema,
    z.array(NonEmptyStringSchema),
  ]).optional(),
  comments: URLSchema.optional(),
  enclosure: z.object({
    "@url": URLSchema,
    "@length": z.number().int().min(0),
    "@type": NonEmptyStringSchema,
  }).optional(),
  guid: z.union([
    NonEmptyStringSchema,
    z.object({
      "@isPermaLink": z.union([z.boolean(), z.string()]).optional(), // 実際は"true"/"false"文字列
      "#text": NonEmptyStringSchema,
    }),
  ]).optional(),
  pubDate: z.string().optional(), // RFC2822形式で返される
  source: z.object({
    "@url": URLSchema,
    "#text": NonEmptyStringSchema,
  }).optional(),

  // Dublin Core elements (実際のAPIで使用される)
  "dc:title": z.string().optional(),
  "dcndl:titleTranscription": z.string().optional(),
  "dc:creator": z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  "dcndl:creatorTranscription": z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  "dc:publisher": z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  "dcndl:publicationPlace": z.string().optional(),
  "dc:date": z.union([
    z.number(),
    z.string(),
    z.object({
      "#text": z.union([z.number(), z.string()]),
      "@xsi:type": z.string(),
    }),
  ]).optional(),
  "dcterms:issued": z.union([z.string(), z.number()]).optional(),
  "dcndl:price": z.union([z.string(), z.number()]).optional(),
  "dc:extent": z.string().optional(),
  "dc:identifier": z.union([
    z.object({
      "#text": z.union([z.string(), z.number()]),
      "@xsi:type": z.string(),
    }),
    z.array(z.object({
      "#text": z.union([z.string(), z.number()]),
      "@xsi:type": z.string(),
    })),
  ]).optional(),
  "dc:subject": z.union([
    z.string(),
    z.object({
      "#text": z.union([z.string(), z.number()]),
      "@xsi:type": z.string(),
    }),
    z.array(z.union([
      z.string(),
      z.object({
        "#text": z.union([z.string(), z.number()]),
        "@xsi:type": z.string(),
      }),
    ])),
  ]).optional(),
  "dcndl:genre": z.string().optional(),
  "dcndl:genreTranscription": z.string().optional(),
  "rdfs:seeAlso": z.union([
    z.object({
      "@rdf:resource": URLSchema,
    }),
    z.array(z.object({
      "@rdf:resource": URLSchema,
    })),
  ]).optional(),
  "dc:description": z.union([
    z.string(),
    z.number(),
    z.array(z.union([z.string(), z.number()])),
  ]).optional(),
}).passthrough(); // 他の未知のプロパティも許可

/**
 * RSS feed schema
 */
export const RSSFeedSchema = z.object({
  rss: z.object({
    "@version": z.union([z.string(), z.number()]), // 実際のAPIでは数値2として返される
    "@xmlns:opensearch": z.string().optional(),
    "@xmlns:dc": z.string().optional(),
    "@xmlns:openSearch": z.string().optional(),
    "@xmlns:dcndl": z.string().optional(),
    "@xmlns:dcmitype": z.string().optional(),
    "@xmlns:dcterms": z.string().optional(),
    "@xmlns:xsi": z.string().optional(),
    "@xmlns:rdfs": z.string().optional(),
    "@xmlns:rdf": z.string().optional(),
    channel: RSSChannelSchema.extend({
      item: z.array(RSSItemSchema).optional(),
    }),
  }).passthrough(), // 他の名前空間属性も許可
});

/**
 * Atom entry schema
 */
export const AtomEntrySchema = z.object({
  id: URLSchema,
  title: z.union([
    NonEmptyStringSchema,
    z.object({
      "@type": z.enum(["text", "html", "xhtml"]).optional(),
      "#text": NonEmptyStringSchema,
    }),
  ]),
  link: z.union([
    z.object({
      "@href": URLSchema,
      "@rel": z.string().optional(),
      "@type": z.string().optional(),
    }),
    z.array(z.object({
      "@href": URLSchema,
      "@rel": z.string().optional(),
      "@type": z.string().optional(),
    })),
  ]).optional(),
  summary: z.union([
    NonEmptyStringSchema,
    z.object({
      "@type": z.enum(["text", "html", "xhtml"]).optional(),
      "#text": NonEmptyStringSchema,
    }),
  ]).optional(),
  content: z.union([
    NonEmptyStringSchema,
    z.object({
      "@type": z.enum(["text", "html", "xhtml"]).optional(),
      "#text": NonEmptyStringSchema,
    }),
  ]).optional(),
  author: z.object({
    name: NonEmptyStringSchema,
    email: z.string().email().optional(),
    uri: URLSchema.optional(),
  }).optional(),
  published: ISO8601DateSchema.optional(),
  updated: ISO8601DateSchema.optional(),
  category: z.union([
    z.object({
      "@term": NonEmptyStringSchema,
      "@scheme": URLSchema.optional(),
      "@label": NonEmptyStringSchema.optional(),
    }),
    z.array(z.object({
      "@term": NonEmptyStringSchema,
      "@scheme": URLSchema.optional(),
      "@label": NonEmptyStringSchema.optional(),
    })),
  ]).optional(),
});

/**
 * Atom feed schema
 */
export const AtomFeedSchema = z.object({
  feed: z.object({
    "@xmlns": z.literal("http://www.w3.org/2005/Atom"),
    "@xmlns:opensearch": z.string().optional(),
    id: URLSchema,
    title: z.union([
      NonEmptyStringSchema,
      z.object({
        "@type": z.enum(["text", "html", "xhtml"]).optional(),
        "#text": NonEmptyStringSchema,
      }),
    ]),
    subtitle: z.union([
      NonEmptyStringSchema,
      z.object({
        "@type": z.enum(["text", "html", "xhtml"]).optional(),
        "#text": NonEmptyStringSchema,
      }),
    ]).optional(),
    link: z.union([
      z.object({
        "@href": URLSchema,
        "@rel": z.string().optional(),
        "@type": z.string().optional(),
      }),
      z.array(z.object({
        "@href": URLSchema,
        "@rel": z.string().optional(),
        "@type": z.string().optional(),
      })),
    ]).optional(),
    updated: ISO8601DateSchema,
    author: z.object({
      name: NonEmptyStringSchema,
      email: z.string().email().optional(),
      uri: URLSchema.optional(),
    }).optional(),
    generator: z.union([
      NonEmptyStringSchema,
      z.object({
        "@uri": URLSchema.optional(),
        "@version": NonEmptyStringSchema.optional(),
        "#text": NonEmptyStringSchema,
      }),
    ]).optional(),

    // OpenSearch specific elements (実際のAPIでは名前空間プレフィックス付き、文字列で返される)
    "openSearch:totalResults": z.string().transform((val) => parseInt(val, 10)),
    "openSearch:startIndex": z.string().transform((val) => parseInt(val, 10)),
    "openSearch:itemsPerPage": z.string().transform((val) => parseInt(val, 10)),
    "openSearch:Query": z.object({
      "@role": z.string(),
      "@searchTerms": NonEmptyStringSchema,
      "@startPage": z.number().int().min(1).optional(),
    }).optional(),

    entry: z.array(AtomEntrySchema).optional(),
  }),
});

/**
 * OpenSearch response union
 */
export const OpenSearchResponseSchema = z.union([
  RSSFeedSchema,
  AtomFeedSchema,
]);

/**
 * Type exports
 */
export type OpenSearchNamespace = z.infer<typeof OpenSearchNamespaceSchema>;
export type RSSChannel = z.infer<typeof RSSChannelSchema>;
export type RSSItem = z.infer<typeof RSSItemSchema>;
export type RSSFeed = z.infer<typeof RSSFeedSchema>;
export type AtomEntry = z.infer<typeof AtomEntrySchema>;
export type AtomFeed = z.infer<typeof AtomFeedSchema>;
export type OpenSearchResponse = z.infer<typeof OpenSearchResponseSchema>;
