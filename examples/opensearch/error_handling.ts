/**
 * エラーハンドリングの例
 *
 * 実行方法:
 * deno run --allow-net examples/opensearch/error_handling.ts
 */

import {
  isAPIError,
  isNetworkError,
  isValidationError,
  searchOpenSearch,
} from "../../mod.ts";

async function demonstrateErrorHandling() {
  console.log("エラーハンドリングの例");
  console.log("=".repeat(40));

  // 1. 正常な検索
  console.log("\n1. 正常な検索");
  console.log("-".repeat(20));

  const validResult = await searchOpenSearch("夏目漱石", {
    count: 2,
  });

  if (validResult.isOk()) {
    console.log(`✓ 成功: ${validResult.value.items.length}件の結果を取得`);
  } else {
    console.log(`✗ 予期しないエラー: ${validResult.error.message}`);
  }

  // 2. 無効なパラメータでのエラー
  console.log("\n2. 無効なパラメータでのエラー");
  console.log("-".repeat(20));

  const invalidResult = await searchOpenSearch("", { // 空文字列は無効
    count: 5,
  });

  if (invalidResult.isErr()) {
    const error = invalidResult.error;
    console.log(`✓ 期待されたエラー: ${error.message}`);

    if (isValidationError(error)) {
      console.log("  → バリデーションエラーとして正しく検出されました");
    }
  } else {
    console.log("✗ エラーが発生するはずでした");
  }

  // 3. 大量リクエストによるレート制限エラーの可能性
  console.log("\n3. 連続リクエストでのエラーハンドリング");
  console.log("-".repeat(20));

  const requests = Array.from(
    { length: 3 },
    (_, i) =>
      searchOpenSearch(`test${i}`, {
        count: 1,
      }),
  );

  const results = await Promise.all(requests);

  results.forEach((result, index) => {
    if (result.isOk()) {
      console.log(`  リクエスト ${index + 1}: ✓ 成功`);
    } else {
      const error = result.error;
      console.log(`  リクエスト ${index + 1}: ✗ エラー - ${error.message}`);

      if (isAPIError(error)) {
        console.log("    → APIエラー（レート制限の可能性）");
      } else if (isNetworkError(error)) {
        console.log("    → ネットワークエラー");
      } else if (isValidationError(error)) {
        console.log("    → バリデーションエラー");
      }
    }
  });

  console.log("\n✓ エラーハンドリングのデモンストレーション完了");
}

await demonstrateErrorHandling();
