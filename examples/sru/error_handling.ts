/**
 * SRUエラーハンドリングの例
 *
 * 改善されたエラーハンドリング機能のデモンストレーション
 * 
 * 実行方法:
 * deno run --allow-net examples/sru/error_handling.ts
 */

import { searchSRU } from "../../mod.ts";
import {
  formatUserFriendlyErrorMessage,
  isAPIError,
  isNetworkError,
  isQuerySyntaxError,
  isRateLimitError,
  isSRUDiagnosticError,
  isValidationError,
} from "../../src/errors.ts";

console.log("SRUエラーハンドリングの例");
console.log("=".repeat(50));

// 例1: バリデーションエラー
console.log("\n=== 例1: バリデーションエラー ===");
try {
  // 空の検索パラメータ
  const result1 = await searchSRU({} as Record<string, never>);
  
  if (result1.isErr()) {
    const error = result1.error;
    console.log(`エラータイプ: ${error.type}`);
    console.log(`詳細メッセージ: ${error.message}`);
    console.log(`ユーザー向けメッセージ: ${formatUserFriendlyErrorMessage(error)}`);
    console.log(`バリデーションエラー?: ${isValidationError(error)}`);
  }
} catch (error) {
  console.error("予期しないエラー:", error);
}

// 例2: 正常な検索（診断情報があれば表示）
console.log("\n=== 例2: 正常な検索（診断情報の確認） ===");
const result2 = await searchSRU({
  title: "図書館学",
}, {
  maximumRecords: 1,
});

if (result2.isOk()) {
  const { items, diagnostics } = result2.value;
  console.log(`検索結果: ${items.length}件`);
  
  if (diagnostics && diagnostics.length > 0) {
    console.log("診断情報:");
    diagnostics.forEach((d, index) => {
      console.log(`  ${index + 1}. ${d.message}`);
      if (d.code) console.log(`     コード: ${d.code}`);
      if (d.details) console.log(`     詳細: ${d.details}`);
    });
  } else {
    console.log("診断情報: なし");
  }
} else {
  const error = result2.error;
  console.log(`エラータイプ: ${error.type}`);
  console.log(`ユーザー向けメッセージ: ${formatUserFriendlyErrorMessage(error)}`);
  
  // エラータイプ別の処理例
  if (isAPIError(error)) {
    console.log("APIエラーです。サーバー側の問題の可能性があります。");
  } else if (isNetworkError(error)) {
    console.log("ネットワークエラーです。接続を確認してください。");
  } else if (isSRUDiagnosticError(error)) {
    console.log("SRU検索でエラーが発生しました。");
  } else if (isQuerySyntaxError(error)) {
    console.log("クエリ構文エラーです。検索条件を見直してください。");
  } else if (isRateLimitError(error)) {
    console.log("レート制限エラーです。しばらく待ってから再試行してください。");
  }
}

// 例3: 無効な検索条件（形式エラー）
console.log("\n=== 例3: 無効な検索条件 ===");
const result3 = await searchSRU({
  dateRange: {
    from: "invalid-date", // 無効な日付形式
    to: "2024",
  }
} as Record<string, unknown>);

if (result3.isErr()) {
  const error = result3.error;
  console.log(`エラータイプ: ${error.type}`);
  console.log(`ユーザー向けメッセージ: ${formatUserFriendlyErrorMessage(error)}`);
  console.log(`バリデーションエラー?: ${isValidationError(error)}`);
}

// 例4: エラー処理のベストプラクティス
console.log("\n=== 例4: エラー処理のベストプラクティス ===");

async function handleSearchWithRetry(searchParams: Record<string, unknown>, maxRetries: number = 3): Promise<void> {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const result = await searchSRU(searchParams);
    
    if (result.isOk()) {
      const { items, pagination } = result.value;
      console.log(`✓ 検索成功: ${pagination.totalResults}件中${items.length}件を表示`);
      return;
    }
    
    const error = result.error;
    console.log(`試行 ${retryCount + 1}: ${formatUserFriendlyErrorMessage(error)}`);
    
    // リトライすべきエラーかどうかを判定
    if (isRateLimitError(error) || (isAPIError(error) && typeof error.cause === "number" && error.cause >= 500)) {
      retryCount++;
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000; // 指数バックオフ
        console.log(`${waitTime / 1000}秒後に再試行します...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } else {
      // リトライしない方が良いエラー
      console.log("リトライを中止します。");
      break;
    }
  }
  
  if (retryCount >= maxRetries) {
    console.log("最大試行回数に達しました。");
  }
}

// 正常な検索でリトライ処理をテスト
await handleSearchWithRetry({
  creator: "夏目漱石",
}, 2);

console.log("\n✓ エラーハンドリングのデモンストレーション完了");