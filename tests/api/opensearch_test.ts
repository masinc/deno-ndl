import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  buildOpenSearchURL,
  extractPaginationInfo,
  extractSearchResults,
} from "../../src/api/opensearch.ts";
import type {
  AtomFeed,
  OpenSearchRequest,
  RSSFeed,
} from "../../src/schemas/opensearch/mod.ts";

Deno.test("buildOpenSearchURL creates correct URL", () => {
  const params: OpenSearchRequest = {
    q: "夏目漱石",
    count: 10,
    start: 0,
    format: "rss",
    hl: "ja",
  };

  const url = buildOpenSearchURL(params);

  assertEquals(url.includes("ndlsearch.ndl.go.jp/api/opensearch"), true);
  assertStringIncludes(url, "q=%E5%A4%8F%E7%9B%AE%E6%BC%B1%E7%9F%B3"); // URI encoded
  assertStringIncludes(url, "count=10");
  assertStringIncludes(url, "start=0");
  assertStringIncludes(url, "format=rss");
  assertStringIncludes(url, "hl=ja");
});

Deno.test("buildOpenSearchURL handles minimal parameters", () => {
  const params: OpenSearchRequest = {
    q: "test",
  };

  const url = buildOpenSearchURL(params);

  assertEquals(url.includes("ndlsearch.ndl.go.jp/api/opensearch"), true);
  assertStringIncludes(url, "q=test");
  assertEquals(url.includes("count="), false);
  assertEquals(url.includes("start="), false);
});

Deno.test("extractSearchResults handles RSS feed", () => {
  const rssResponse: RSSFeed = {
    rss: {
      "@version": 2, // 実際のAPIでは数値
      channel: {
        title: "NDL Search Results",
        link: "https://ndlsearch.ndl.go.jp/",
        description: "Search results",
        "openSearch:totalResults": 100, // 実際のAPIでは openSearch プレフィックス
        "openSearch:startIndex": 0,
        "openSearch:itemsPerPage": 10,
        item: [
          {
            title: "Test Book 1",
            link: "https://example.com/book1",
            description: "Description of book 1",
            pubDate: "Sun, 1 Jan 2024 00:00:00 +0900", // RFC2822形式
          },
          {
            title: "Test Book 2",
            link: "https://example.com/book2",
            description: "Description of book 2",
            pubDate: "Mon, 2 Jan 2024 00:00:00 +0900",
          },
        ],
      },
    },
  };

  const results = extractSearchResults(rssResponse);

  assertEquals(results.length, 2);
  assertEquals(results[0].title, "Test Book 1");
  assertEquals(results[0].link, "https://example.com/book1");
  assertEquals(results[0].description, "Description of book 1");
  assertEquals(results[0].pubDate, "Sun, 1 Jan 2024 00:00:00 +0900");
});

Deno.test("extractSearchResults handles Atom feed", () => {
  const atomResponse: AtomFeed = {
    feed: {
      "@xmlns": "http://www.w3.org/2005/Atom",
      id: "https://ndlsearch.ndl.go.jp/",
      title: "NDL Search Results",
      updated: "2024-01-01T00:00:00Z",
      "openSearch:totalResults": 50,
      "openSearch:startIndex": 0,
      "openSearch:itemsPerPage": 10,
      entry: [
        {
          id: "https://example.com/entry1",
          title: "Test Entry 1",
          link: {
            "@href": "https://example.com/entry1",
            "@rel": "alternate",
          },
          summary: "Summary of entry 1",
          published: "2024-01-01T00:00:00Z",
        },
        {
          id: "https://example.com/entry2",
          title: {
            "@type": "text",
            "#text": "Test Entry 2",
          },
          link: {
            "@href": "https://example.com/entry2",
          },
          summary: {
            "@type": "html",
            "#text": "Summary of entry 2",
          },
          updated: "2024-01-02T00:00:00Z",
        },
      ],
    },
  };

  const results = extractSearchResults(atomResponse);

  assertEquals(results.length, 2);
  assertEquals(results[0].title, "Test Entry 1");
  assertEquals(results[0].link, "https://example.com/entry1");
  assertEquals(results[0].description, "Summary of entry 1");
  assertEquals(results[0].pubDate, "2024-01-01T00:00:00Z");

  // Test complex title and summary
  assertEquals(results[1].title, "Test Entry 2");
  assertEquals(results[1].description, "Summary of entry 2");
});

Deno.test("extractSearchResults handles empty results", () => {
  const emptyRssResponse: RSSFeed = {
    rss: {
      "@version": 2,
      channel: {
        title: "NDL Search Results",
        link: "https://ndlsearch.ndl.go.jp/",
        description: "No results",
        "openSearch:totalResults": 0,
        "openSearch:startIndex": 0,
        "openSearch:itemsPerPage": 10,
      },
    },
  };

  const results = extractSearchResults(emptyRssResponse);
  assertEquals(results.length, 0);
});

Deno.test("extractPaginationInfo extracts RSS pagination", () => {
  const rssResponse: RSSFeed = {
    rss: {
      "@version": 2,
      channel: {
        title: "Test",
        link: "https://example.com",
        description: "Test",
        "openSearch:totalResults": 150,
        "openSearch:startIndex": 20,
        "openSearch:itemsPerPage": 10,
      },
    },
  };

  const pagination = extractPaginationInfo(rssResponse);

  assertEquals(pagination.totalResults, 150);
  assertEquals(pagination.startIndex, 20);
  assertEquals(pagination.itemsPerPage, 10);
});

Deno.test("extractPaginationInfo extracts Atom pagination", () => {
  const atomResponse: AtomFeed = {
    feed: {
      "@xmlns": "http://www.w3.org/2005/Atom",
      id: "https://example.com",
      title: "Test",
      updated: "2024-01-01T00:00:00Z",
      "openSearch:totalResults": 200,
      "openSearch:startIndex": 30,
      "openSearch:itemsPerPage": 20,
    },
  };

  const pagination = extractPaginationInfo(atomResponse);

  assertEquals(pagination.totalResults, 200);
  assertEquals(pagination.startIndex, 30);
  assertEquals(pagination.itemsPerPage, 20);
});

Deno.test("extractSearchResults handles complex RSS items with DC elements", () => {
  const complexRssResponse: RSSFeed = {
    rss: {
      "@version": 2,
      channel: {
        title: "Complex RSS Response",
        link: "https://ndlsearch.ndl.go.jp/",
        description: "Complex test data",
        "openSearch:totalResults": 1,
        "openSearch:startIndex": 0,
        "openSearch:itemsPerPage": 1,
        item: [
          {
            title: "複雑な書誌データのテスト",
            link: "https://example.com/complex",
            description: "複雑な構造のテストデータ",
            author: "", // 空文字列のauthor
            category: ["図書", "紙"],
            guid: {
              "#text": "https://example.com/complex",
              "@isPermaLink": true,
            },
            pubDate: "Tue, 14 Aug 2012 20:37:08 +0900",
            "dc:title": "複雑な書誌データのテスト",
            "dcndl:titleTranscription": "フクザツナ ショシ データ ノ テスト",
            "dc:creator": ["著者1", "著者2"], // 配列のcreator
            "dcndl:creatorTranscription": ["チョシャ1", "チョシャ2"],
            "dc:publisher": ["テスト出版社", "副出版社"],
            "dc:date": {
              "#text": "2012",
              "@xsi:type": "dcterms:W3CDTF",
            },
            "dcterms:issued": 2012.8,
            "dcndl:price": 1500,
            "dc:identifier": [
              {
                "#text": "978-4-7765-3199-9",
                "@xsi:type": "dcndl:ISBN",
              },
              {
                "#text": 12345678,
                "@xsi:type": "dcndl:NDLBibID",
              },
            ],
            "dc:subject": [
              "テスト分類",
              {
                "#text": "TEST001",
                "@xsi:type": "dcndl:NDLC",
              },
            ],
            "rdfs:seeAlso": [
              {
                "@rdf:resource": "https://example1.com/",
              },
              {
                "@rdf:resource": "https://example2.com/",
              },
            ],
          },
        ],
      },
    },
  };

  const results = extractSearchResults(complexRssResponse);
  
  assertEquals(results.length, 1);
  assertEquals(results[0].title, "複雑な書誌データのテスト");
  assertEquals(results[0].link, "https://example.com/complex");
  assertEquals(results[0].description, "複雑な構造のテストデータ");
  assertEquals(results[0].pubDate, "Tue, 14 Aug 2012 20:37:08 +0900");
});

Deno.test("extractSearchResults handles single DC elements", () => {
  const singleDcRssResponse: RSSFeed = {
    rss: {
      "@version": 2,
      channel: {
        title: "Single DC Elements Test",
        link: "https://ndlsearch.ndl.go.jp/",
        description: "Single DC elements test",
        "openSearch:totalResults": 1,
        "openSearch:startIndex": 0,
        "openSearch:itemsPerPage": 1,
        item: [
          {
            title: "単一DC要素テスト",
            link: "https://example.com/single",
            description: "単一DC要素のテストデータ",
            author: "単一著者",
            category: "図書",
            guid: "https://example.com/single", // 文字列のguid
            pubDate: "Mon, 1 Jan 2024 00:00:00 +0900",
            "dc:creator": "単一著者", // 文字列のcreator
            "dc:publisher": "単一出版社",
            "dc:identifier": {
              "#text": "978-1-2345-6789-0",
              "@xsi:type": "dcndl:ISBN",
            },
            "dc:subject": {
              "#text": "SINGLE001",
              "@xsi:type": "dcndl:NDLC",
            },
            "rdfs:seeAlso": {
              "@rdf:resource": "https://single-example.com/",
            },
          },
        ],
      },
    },
  };

  const results = extractSearchResults(singleDcRssResponse);
  
  assertEquals(results.length, 1);
  assertEquals(results[0].title, "単一DC要素テスト");
  assertEquals(results[0].link, "https://example.com/single");
  assertEquals(results[0].description, "単一DC要素のテストデータ");
  assertEquals(results[0].pubDate, "Mon, 1 Jan 2024 00:00:00 +0900");
});
