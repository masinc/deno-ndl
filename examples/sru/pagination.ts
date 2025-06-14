/**
 * SRUページネーション機能の例
 *
 * 新しいページネーション機能を使用した検索例
 *
 * 実行方法:
 * deno run --allow-net examples/sru/pagination.ts
 */

import { searchSRU, type SRUSearchItem } from "../../mod.ts";

console.log("SRUページネーション機能の例");
console.log("=".repeat(50));

// 例1: 基本的なページネーション
console.log("\n=== 例1: 基本的なページネーション ===");
const result1 = await searchSRU({
  creator: "夏目漱石",
}, {
  maximumRecords: 3,
  startRecord: 1,
});

if (result1.isOk()) {
  const { items, pagination } = result1.value;

  console.log(`検索結果: ${pagination.totalResults}件`);
  console.log(
    `現在のページ: ${pagination.currentPage} / ${pagination.totalPages}`,
  );
  console.log(`表示件数: ${items.length}件`);
  console.log(`開始位置: ${pagination.startIndex}`);
  console.log("");

  // ページネーション情報
  console.log("ページネーション情報:");
  console.log(`- 前のページあり: ${pagination.hasPreviousPage}`);
  console.log(`- 次のページあり: ${pagination.hasNextPage}`);

  if (pagination.nextPageParams) {
    console.log(
      `- 次のページ: startRecord=${pagination.nextPageParams.startRecord}`,
    );
  }

  if (pagination.previousPageParams) {
    console.log(
      `- 前のページ: startRecord=${pagination.previousPageParams.startRecord}`,
    );
  }

  console.log("\n検索結果:");
  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${pagination.startIndex + index}. ${item.title}`);
  });

  // 次のページを取得する例
  if (pagination.hasNextPage && pagination.nextPageParams) {
    console.log("\n--- 次のページを取得中 ---");

    const nextResult = await searchSRU({
      creator: "夏目漱石",
    }, {
      maximumRecords: pagination.nextPageParams.maximumRecords,
      startRecord: pagination.nextPageParams.startRecord,
    });

    if (nextResult.isOk()) {
      const nextPage = nextResult.value;
      console.log(
        `次のページ (${nextPage.pagination.currentPage}/${nextPage.pagination.totalPages}):`,
      );

      nextPage.items.forEach((item: SRUSearchItem, index: number) => {
        console.log(`${nextPage.pagination.startIndex + index}. ${item.title}`);
      });
    }
  }
} else {
  console.error("検索エラー:", result1.error.message);
}

// 例2: フィルタリングとページネーション
console.log("\n\n=== 例2: フィルタリングとページネーション ===");
const result2 = await searchSRU({
  title: "文学",
}, {
  maximumRecords: 5,
  startRecord: 1,
  filter: {
    language: "jpn",
    dateRange: {
      from: "2000",
      to: "2024",
    },
  },
  sortBy: {
    field: "date",
    order: "desc",
  },
});

if (result2.isOk()) {
  const { items, pagination } = result2.value;

  console.log(`フィルタリング・ソート後: ${items.length}件を表示`);
  console.log(`総検索結果: ${pagination.totalResults}件`);
  console.log(
    `現在のページ: ${pagination.currentPage} / ${pagination.totalPages}`,
  );
  console.log("");

  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.date) {
      console.log(`   日付: ${item.date}`);
    }
    if (item.language) {
      console.log(`   言語: ${item.language}`);
    }
    console.log("");
  });

  // ページ遷移の例
  console.log("ページ遷移の例:");
  console.log(`- 現在: ページ ${pagination.currentPage}`);

  if (pagination.hasPreviousPage) {
    console.log(
      `- 前のページへ: startRecord=${pagination.previousPageParams?.startRecord}`,
    );
  }

  if (pagination.hasNextPage) {
    console.log(
      `- 次のページへ: startRecord=${pagination.nextPageParams?.startRecord}`,
    );
  }
} else {
  console.error("検索エラー:", result2.error.message);
}

console.log("\n✓ ページネーション機能のデモンストレーション完了");
