/**
 * OpenSearch APIエラーハンドリングの例
 *
 * この例では以下のエラーハンドリングパターンを示します：
 * - バリデーションエラー（無効なパラメータ）
 * - エラー型の判定と適切な対応
 * - ユーザーフレンドリーなエラーメッセージの表示
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

  // 3. 無効なオプションパラメータ
  console.log("\n3. 無効なオプションパラメータ");
  console.log("-".repeat(20));

  const invalidOptionsResult = await searchOpenSearch("文学", {
    count: 500, // 最大値を超えた値
  });

  if (invalidOptionsResult.isErr()) {
    const error = invalidOptionsResult.error;
    console.log(`✓ 期待されたエラー: ${error.message}`);

    if (isValidationError(error)) {
      console.log("  → パラメータバリデーションエラーとして正しく検出されました");
    }
  } else {
    console.log("✗ エラーが発生するはずでした（最大値超過）");
  }

  // 4. エラー型の判定例
  console.log("\n4. エラー型の判定例");
  console.log("-".repeat(20));

  const errorResult = await searchOpenSearch(""); // 空文字列

  if (errorResult.isErr()) {
    const error = errorResult.error;
    console.log(`エラーメッセージ: ${error.message}`);

    // エラー型に応じた対応例
    if (isValidationError(error)) {
      console.log("  → バリデーションエラー: 入力パラメータを確認してください");
    } else if (isAPIError(error)) {
      console.log(`  → APIエラー: サーバー側の問題の可能性があります`);
    } else if (isNetworkError(error)) {
      console.log("  → ネットワークエラー: 接続状況を確認してください");
    } else {
      console.log("  → その他のエラー: 予期しない問題が発生しました");
    }
  }

  console.log("\n✓ エラーハンドリングのデモンストレーション完了");
}

await demonstrateErrorHandling();
