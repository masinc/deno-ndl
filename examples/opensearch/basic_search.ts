/**
 * 基本的な検索の例
 *
 * 実行方法:
 * deno run --allow-net examples/opensearch/basic_search.ts
 */

import { searchOpenSearch } from "../../mod.ts";

const result = await searchOpenSearch({
  q: "夏目漱石",
  count: 5,
});

if (result.isErr()) {
  console.error("検索エラー:", result.error.message);
  Deno.exit(1);
}

const { items, pagination } = result.value;

console.log(`検索結果: ${pagination.totalResults}件中 ${items.length}件を表示`);
console.log(`ページ: ${pagination.currentPage} / ${pagination.totalPages}`);
console.log("");

items.forEach((item, index) => {
  console.log(`${index + 1}. ${item.title}`);
  if (item.authors && item.authors.length > 0) {
    console.log(`   著者: ${item.authors.join(", ")}`);
  }
  if (item.publisher) {
    console.log(`   出版社: ${item.publisher}`);
  }
  if (item.isbn) {
    console.log(`   ISBN: ${item.isbn}`);
  }
  if (item.materialType && item.materialType.length > 0) {
    console.log(`   資料種別: ${item.materialType.join(", ")}`);
  }
  console.log(`   URL: ${item.link}`);
  console.log("");
});
