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

// 例3: ISBN検索（自動フォーマット）
console.log("=== 例3: ISBN検索 ===");
const result3 = await searchSRU({
  isbn: "978-4-00-310101-8", // ハイフンは自動的に除去される
});

if (result3.isOk()) {
  const { items, pagination, query } = result3.value;
  console.log(`生成されたCQLクエリ: ${query.cql}`);
  console.log(`検索結果: ${pagination.totalResults}件`);
  
  items.forEach((item: SRUSearchItem, index: number) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.identifier) {
      console.log(`   ID: ${item.identifier}`);
    }
    console.log("");
  });
} else {
  console.error("検索エラー:", result3.error.message);
}
