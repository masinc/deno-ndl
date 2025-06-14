/**
 * 高度な検索の例（複数の検索条件）
 *
 * 実行方法:
 * deno run --allow-net examples/opensearch/advanced_search.ts
 */

import { searchOpenSearch } from "../../mod.ts";

async function advancedSearch() {
  console.log("高度な検索の例");
  console.log("=".repeat(40));

  // 複数の検索パターンを実行
  const searchQueries = [
    { q: "太宰治", description: "著者名で検索" },
    { q: "吾輩は猫である", description: "作品名で検索" },
    { q: "明治 文学", description: "複合語で検索" },
  ];

  for (const { q, description } of searchQueries) {
    console.log(`\n${description}: "${q}"`);
    console.log("-".repeat(30));

    const result = await searchOpenSearch({
      q,
      count: 3,
      start: 0,
    });

    if (result.isErr()) {
      console.error("検索エラー:", result.error.message);
      continue;
    }

    const { items, pagination } = result.value;

    console.log(`総件数: ${pagination.totalResults}件`);

    items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);

      if (item.authors && item.authors.length > 0) {
        console.log(`   著者: ${item.authors.join(", ")}`);
      }

      if (item.publisher) {
        console.log(`   出版社: ${item.publisher}`);
      }

      if (item.publishedDate) {
        console.log(`   出版日: ${item.publishedDate}`);
      }

      if (item.materialType && item.materialType.length > 0) {
        console.log(`   資料種別: ${item.materialType.join(", ")}`);
      }

      if (item.description) {
        const desc = item.description.length > 100
          ? item.description.substring(0, 100) + "..."
          : item.description;
        console.log(`   概要: ${desc.replace(/\n/g, " ")}`);
      }
    });

    // API制限を避けるため少し待機
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

await advancedSearch();
