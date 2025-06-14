/**
 * SRU基本的な検索の例（高レベルAPI使用）
 *
 * 新しい高レベルAPIを使用してCQLクエリを意識せずに検索できます。
 * 
 * 実行方法:
 * deno run --allow-net examples/sru/basic_search.ts
 */

import { searchSRU, type SRUSearchItem } from "../../mod.ts";

// 例1: シンプルなタイトル検索
console.log("=== 例1: シンプルなタイトル検索 ===");
const result1 = await searchSRU({
  anywhere: "図書館",
}, {
  maximumRecords: 5,
});

if (result1.isOk()) {
  const { items, pagination, query } = result1.value;
  console.log(`生成されたCQLクエリ: ${query.cql}`);
  console.log(`検索結果: ${pagination.totalResults}件中 ${items.length}件を表示`);
  console.log(`ページ: ${pagination.currentPage} / ${pagination.totalPages}`);
  console.log("");

  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.creators && item.creators.length > 0) {
      console.log(`   著者: ${item.creators.join(", ")}`);
    }
    if (item.date) {
      console.log(`   日付: ${item.date}`);
    }
    console.log("");
  });
} else {
  console.error("検索エラー:", result1.error.message);
}

// 例2: 複数条件での検索
console.log("=== 例2: 複数条件での検索 ===");
const result2 = await searchSRU({
  title: "図書",
  language: "jpn",
  dateRange: {
    from: "2020",
    to: "2024",
  },
}, {
  maximumRecords: 3,
});

if (result2.isOk()) {
  const { items, pagination, query } = result2.value;
  console.log(`生成されたCQLクエリ: ${query.cql}`);
  console.log(`検索結果: ${pagination.totalResults}件中 ${items.length}件を表示`);
  console.log("");

  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.creators && item.creators.length > 0) {
      console.log(`   著者: ${item.creators.join(", ")}`);
    }
    if (item.publishers && item.publishers.length > 0) {
      console.log(`   出版社: ${item.publishers.join(", ")}`);
    }
    if (item.language) {
      console.log(`   言語: ${item.language}`);
    }
    console.log("");
  });
} else {
  console.error("検索エラー:", result2.error.message);
}

// 例3: フィルタリング機能 - 言語で絞り込み
console.log("=== 例3: フィルタリング機能 ===");
const result3 = await searchSRU({
  anywhere: "図書",
}, {
  maximumRecords: 5,
  filter: {
    language: "jpn", // 日本語のみ
  },
});

if (result3.isOk()) {
  const { items, query } = result3.value;
  console.log(`生成されたCQLクエリ: ${query.cql}`);
  console.log(`フィルタリング後: ${items.length}件を表示`);
  console.log("");

  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.language) {
      console.log(`   言語: ${item.language}`);
    }
    console.log("");
  });
} else {
  console.error("検索エラー:", result3.error.message);
}

// 例4: ソート機能 - タイトル順
console.log("=== 例4: ソート機能 ===");
const result4 = await searchSRU({
  creator: "太宰治",
}, {
  maximumRecords: 5,
  sortBy: {
    field: "title",
    order: "asc", // タイトル昇順
  },
});

if (result4.isOk()) {
  const { items, query } = result4.value;
  console.log(`生成されたCQLクエリ: ${query.cql}`);
  console.log(`ソート後: ${items.length}件を表示（タイトル昇順）`);
  console.log("");

  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.creators && item.creators.length > 0) {
      console.log(`   著者: ${item.creators.join(", ")}`);
    }
    console.log("");
  });
} else {
  console.error("検索エラー:", result4.error.message);
}

// 例5: ページネーション情報の活用
console.log("=== 例5: ページネーション情報 ===");
const result5 = await searchSRU({
  title: "文学",
}, {
  maximumRecords: 3,
  startRecord: 1,
});

if (result5.isOk()) {
  const { items, pagination, query } = result5.value;
  console.log(`生成されたCQLクエリ: ${query.cql}`);
  console.log(`検索結果: ${pagination.totalResults}件中 ${items.length}件を表示`);
  console.log(`現在のページ: ${pagination.currentPage} / ${pagination.totalPages}`);
  
  // ページネーション情報の表示
  console.log(`前のページあり: ${pagination.hasPreviousPage}`);
  console.log(`次のページあり: ${pagination.hasNextPage}`);
  
  if (pagination.nextPageParams) {
    console.log(`次のページパラメータ: startRecord=${pagination.nextPageParams.startRecord}, maximumRecords=${pagination.nextPageParams.maximumRecords}`);
  }
  
  console.log("");
  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.date) {
      console.log(`   日付: ${item.date}`);
    }
    console.log("");
  });
} else {
  console.error("検索エラー:", result5.error.message);
}
