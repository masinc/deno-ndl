/**
 * SRUページネーション検索の例
 *
 * 実行方法:
 * deno run --allow-net examples/sru/pagination.ts
 */

import { searchSRU, type SRUSearchItem } from "../../mod.ts";

async function searchWithPagination(cqlQuery: string, pageSize: number = 5) {
  console.log(`CQLクエリ: ${cqlQuery}`);
  console.log("=".repeat(60));

  // 最初のページを取得
  const firstResult = await searchSRU({
    operation: "searchRetrieve",
    query: cqlQuery,
    maximumRecords: pageSize,
    startRecord: 1,
  });

  if (firstResult.isErr()) {
    console.error("検索エラー:", firstResult.error.message);
    return;
  }

  const totalPages = firstResult.value.pagination.totalPages;
  console.log(`総件数: ${firstResult.value.pagination.totalResults}件`);
  console.log(`総ページ数: ${totalPages}ページ`);
  console.log("");

  // 最初の3ページを表示
  const maxPages = Math.min(3, totalPages);

  for (let page = 1; page <= maxPages; page++) {
    const startRecord = (page - 1) * pageSize + 1;

    const result = await searchSRU({
      operation: "searchRetrieve",
      query: cqlQuery,
      maximumRecords: pageSize,
      startRecord,
    });

    if (result.isErr()) {
      console.error(`ページ ${page} の取得エラー:`, result.error.message);
      continue;
    }

    const { items, pagination } = result.value;

    console.log(`--- ページ ${pagination.currentPage} ---`);
    items.forEach((item: SRUSearchItem, index: number) => {
      const itemNumber = startRecord + index;
      console.log(`${itemNumber}. ${item.title}`);
      if (item.creators && item.creators.length > 0) {
        console.log(`    著者: ${item.creators.join(", ")}`);
      }
      if (item.identifier) {
        console.log(`    ID: ${item.identifier}`);
      }
    });
    console.log("");

    // API制限を避けるため少し待機
    if (page < maxPages) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  if (totalPages > 3) {
    console.log(`... 他 ${totalPages - 3} ページあります`);
  }

  // 次のレコード位置の情報があれば表示
  if (firstResult.value.pagination.nextRecordPosition) {
    console.log(
      `次のレコード位置: ${firstResult.value.pagination.nextRecordPosition}`,
    );
  }

  // 結果セットIDがあれば表示
  if (firstResult.value.pagination.resultSetId) {
    console.log(`結果セットID: ${firstResult.value.pagination.resultSetId}`);
  }
}

// 宮沢賢治の作品を検索
await searchWithPagination('creator="宮沢賢治"', 3);
