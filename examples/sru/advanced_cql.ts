/**
 * SRU高度なCQLクエリの例 - 高レベルAPIと低レベルAPIの比較
 *
 * 実行方法:
 * deno run --allow-net examples/sru/advanced_cql.ts
 */

import { searchSRU, searchSRUWithCQL, type SRUSearchItem } from "../../mod.ts";

async function demonstrateHighLevelAPI() {
  console.log("=== 高レベルAPI: シンプルなパラメータで検索 ===");

  // 高レベルAPIを使用した検索例
  const highLevelExamples = [
    {
      params: { creator: "太宰治" },
      description: "著者名で検索",
    },
    {
      params: { 
        title: "銀河鉄道の夜", 
        creator: "宮沢賢治" 
      },
      description: "タイトルと著者の複合検索",
    },
    {
      params: { 
        subject: "文学", 
        dateRange: { from: "1900", to: "1950" } 
      },
      description: "主題と年代範囲の検索",
    },
    {
      params: { 
        title: "文学", 
        exclude: { language: "eng" as const } 
      },
      description: "除外条件付き検索",
    },
  ];

  for (const { params, description } of highLevelExamples) {
    console.log(`\n${description}`);
    console.log(`パラメータ:`, JSON.stringify(params, null, 2));
    console.log("-".repeat(40));

    const result = await searchSRU(params, { maximumRecords: 3 });

    if (result.isErr()) {
      console.error("検索エラー:", result.error.message);
      continue;
    }

    const { items, pagination, query } = result.value;
    console.log(`生成されたCQL: ${query.cql}`);
    console.log(`総件数: ${pagination.totalResults}件`);

    if (items.length === 0) {
      console.log("検索結果がありません");
    } else {
      items.forEach((item: SRUSearchItem, index: number) => {
        console.log(`\n${index + 1}. ${item.title}`);
        if (item.creators && item.creators.length > 0) {
          console.log(`   著者: ${item.creators.join(", ")}`);
        }
        if (item.date) {
          console.log(`   日付: ${item.date}`);
        }
      });
    }

    // API制限を避けるため少し待機
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

async function demonstrateLowLevelAPI() {
  console.log("\n\n=== 低レベルAPI: 直接CQLクエリを指定 ===");

  // 低レベルAPIを使用した検索例
  const lowLevelExamples = [
    {
      query: 'creator="太宰治"',
      description: "著者名で検索",
    },
    {
      query: 'title="銀河鉄道の夜" AND creator="宮沢賢治"',
      description: "タイトルと著者の複合検索",
    },
    {
      query: 'subject="文学" AND date >= "1900" AND date <= "1950"',
      description: "主題と年代範囲の検索",
    },
    {
      query: 'title="吾輩は猫である" OR title="坊っちゃん"',
      description: "複数タイトルのOR検索",
    },
  ];

  for (const { query, description } of lowLevelExamples) {
    console.log(`\n${description}`);
    console.log(`CQL: ${query}`);
    console.log("-".repeat(40));

    const result = await searchSRUWithCQL({
      operation: "searchRetrieve",
      query,
      maximumRecords: 3,
      startRecord: 1,
    });

    if (result.isErr()) {
      console.error("検索エラー:", result.error.message);
      continue;
    }

    const { items, pagination } = result.value;

    console.log(`総件数: ${pagination.totalResults}件`);

    if (items.length === 0) {
      console.log("検索結果がありません");
    } else {
      items.forEach((item: SRUSearchItem, index: number) => {
        console.log(`\n${index + 1}. ${item.title}`);
        if (item.creators && item.creators.length > 0) {
          console.log(`   著者: ${item.creators.join(", ")}`);
        }
        if (item.date) {
          console.log(`   日付: ${item.date}`);
        }
      });
    }

    // API制限を避けるため少し待機
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

console.log("SRU API使用例 - 高レベルAPIと低レベルAPIの比較");
console.log("=".repeat(60));

await demonstrateHighLevelAPI();
await demonstrateLowLevelAPI();

console.log("\n✓ APIデモンストレーション完了");
console.log("\n📝 まとめ:");
console.log("- 高レベルAPI (searchSRU): シンプルなパラメータでCQLを自動生成");
console.log("- 低レベルAPI (searchSRUWithCQL): 直接CQLクエリを指定");
