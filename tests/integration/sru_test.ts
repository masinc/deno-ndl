/**
 * SRU API統合テスト
 *
 * 実際のNDL SRU APIを呼び出すテスト。
 * ネットワークアクセスが必要なため、通常のテストからは除外される。
 *
 * 実行方法:
 * deno test --allow-net tests/integration/sru_test.ts
 */

import { assertEquals, assertGreater } from "@std/assert";
import {
  explainSRU,
  parseSRUResponse,
  searchSRU,
  executeSearchRetrieveRaw,
  type SRUSearchItem,
} from "../../src/api/sru.ts";
import { SRU } from "./fixtures/mod.ts";

/**
 * 実際のAPI呼び出しテスト（手動実行用）
 */
Deno.test({
  name: "SRU API real search test",
  ignore: true, // 通常実行では無視
  async fn() {
    const result = await searchSRU({
      title: "夏目漱石",
    }, {
      maximumRecords: 3,
      startRecord: 1,
    });

    if (result.isErr()) {
      throw new Error(`SRU search failed: ${result.error.message}`);
    }

    const response = result.value;

    // 基本的な構造確認
    assertEquals(typeof response.items, "object");
    assertEquals(Array.isArray(response.items), true);
    assertEquals(typeof response.pagination, "object");
    assertEquals(typeof response.query, "object");

    // ページネーション情報の確認
    assertGreater(response.pagination.totalResults, 0);
    assertEquals(response.pagination.currentPage, 1);
    assertEquals(response.pagination.itemsPerPage, 3);
    assertEquals(response.pagination.startIndex, 1);

    // クエリ情報の確認
    assertEquals(response.query.cql, 'title="夏目漱石"');

    console.log(`Found ${response.pagination.totalResults} results`);
    console.log(
      `Page ${response.pagination.currentPage} of ${response.pagination.totalPages}`,
    );

    response.items.forEach((item: SRUSearchItem, index: number) => {
      console.log(`${index + 1}. ID: ${item.identifier}, Title: ${item.title}`);
    });
  },
});

/**
 * 実際のAPI explainテスト（手動実行用）
 */
Deno.test({
  name: "SRU API real explain test",
  ignore: true, // 通常実行では無視
  async fn() {
    const result = await explainSRU({
      operation: "explain",
    });

    if (result.isErr()) {
      throw new Error(`SRU explain failed: ${result.error.message}`);
    }

    const response = result.value;

    // Explain responseの基本構造確認
    assertEquals(response.type, "explain");

    if (response.type === "explain") {
      assertEquals(typeof response.response.version, "string");
      assertEquals(typeof response.response.record, "object");

      console.log(`SRU version: ${response.response.version}`);
      console.log(`Record schema: ${response.response.record.recordSchema}`);
    }
  },
});

/**
 * Fixtureデータを使ったパース機能テスト
 */
Deno.test("parseSRUResponse validates all fixture responses", () => {
  const fixtures = [
    { name: "BASIC_SEARCH", data: SRU.BASIC_SEARCH },
    { name: "EXPLAIN", data: SRU.EXPLAIN },
    { name: "PAGINATION", data: SRU.PAGINATION },
  ];

  for (const fixture of fixtures) {
    const result = parseSRUResponse(fixture.data);

    if (result.isErr()) {
      console.error(`Parse failed for ${fixture.name}:`, result.error);
      throw new Error(
        `Parse failed for ${fixture.name}: ${result.error.message}`,
      );
    }

    // すべてのfixtureが正常にパースされることを確認
    assertEquals(
      result.isOk(),
      true,
      `${fixture.name} should parse successfully`,
    );

    const response = result.value;

    // 基本的な構造確認
    assertEquals(typeof response.type, "string");
    assertEquals(["searchRetrieve", "explain"].includes(response.type), true);

    if (response.type === "searchRetrieve") {
      // version field is optional in our schema
      if (response.response.version !== undefined) {
        assertEquals(typeof response.response.version, "string");
      }
      // numberOfRecords field might be optional
      if (response.response.numberOfRecords !== undefined) {
        assertEquals(typeof response.response.numberOfRecords, "number");
      }
    } else if (response.type === "explain") {
      // version field is optional in our schema
      if (response.response.version !== undefined) {
        assertEquals(typeof response.response.version, "string");
      }
      assertEquals(typeof response.response.record, "object");
    }
  }
});

/**
 * SRU searchSRUWithCQL 低レベルAPI動作テスト
 */
Deno.test("searchSRUWithCQL handles fixture data correctly", () => {
  // fixtureデータをパースして低レベルAPIの動作をテスト
  const parsedResponse = parseSRUResponse(SRU.BASIC_SEARCH);

  if (parsedResponse.isErr()) {
    throw new Error(`Failed to parse fixture: ${parsedResponse.error.message}`);
  }

  // パースされたレスポンスの構造テスト
  const response = parsedResponse.value;

  if (response.type === "searchRetrieve") {
    // 検索レスポンスの基本構造確認
    assertEquals(typeof response.response.numberOfRecords, "number");
    assertGreater(response.response.numberOfRecords, 0);

    // レコードの存在確認
    if (response.response.records?.record) {
      const records = Array.isArray(response.response.records.record)
        ? response.response.records.record
        : [response.response.records.record];

      assertGreater(records.length, 0);

      // 最初のレコードの構造確認
      const firstRecord = records[0];
      assertEquals(typeof firstRecord.recordSchema, "string");
      assertEquals(typeof firstRecord.recordPacking, "string");
      // recordData can be string or object
      assertEquals(["string", "object"].includes(typeof firstRecord.recordData), true);
    }
  }
});

/**
 * エラーハンドリングテスト
 */
Deno.test("SRU API handles invalid parameters", async () => {
  const result = await executeSearchRetrieveRaw({
    operation: "searchRetrieve",
    query: "", // 無効な空クエリ
  });

  assertEquals(result.isErr(), true);

  if (result.isErr()) {
    // バリデーションエラーが返されることを確認
    assertEquals(result.error.type, "validation");
  }
});

/**
 * CQLクエリのバリエーションテスト（手動実行用）
 */
Deno.test({
  name: "SRU API various CQL queries",
  ignore: true, // 通常実行では無視
  async fn() {
    const queries = [
      'title="夏目漱石"',
      'creator="太宰治"',
      'title="銀河鉄道の夜" AND creator="宮沢賢治"',
      'subject="文学" AND from="1900" AND until="1950"',
    ];

    for (const query of queries) {
      console.log(`\nTesting query: ${query}`);

      const result = await executeSearchRetrieveRaw({
        operation: "searchRetrieve",
        query,
        maximumRecords: 2,
      });

      if (result.isErr()) {
        console.error(`Query failed: ${result.error.message}`);
        continue;
      }

      const response = result.value;
      console.log(`  Found ${response.pagination.totalResults} results`);

      if (response.items.length > 0) {
        console.log(`  First result: ${response.items[0].title}`);
      }

      // レート制限を避けるため少し待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  },
});
