/**
 * SRU APIエラーハンドリングの例
 *
 * この例では以下のエラーハンドリングパターンを示します：
 * - バリデーションエラー（無効なパラメータ）
 * - SRU診断情報の処理
 * - エラー型の判定と適切な対応
 * - ユーザーフレンドリーなエラーメッセージの活用
 *
 * 注意: この例では実際のNDL APIを呼び出しますが、
 * 安全なパラメータのみを使用し、レート制限に配慮しています。
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
    console.log(
      `ユーザー向けメッセージ: ${formatUserFriendlyErrorMessage(error)}`,
    );
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
  console.log(
    `ユーザー向けメッセージ: ${formatUserFriendlyErrorMessage(error)}`,
  );

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
  },
} as Record<string, unknown>);

if (result3.isErr()) {
  const error = result3.error;
  console.log(`エラータイプ: ${error.type}`);
  console.log(
    `ユーザー向けメッセージ: ${formatUserFriendlyErrorMessage(error)}`,
  );
  console.log(`バリデーションエラー?: ${isValidationError(error)}`);
}

// 例4: エラーメッセージのユーザーフレンドリー化
console.log("\n=== 例4: エラーメッセージのユーザーフレンドリー化 ===");

// 無効なISBN形式での検索
const result4 = await searchSRU({
  isbn: "invalid-isbn-format", // 無効なISBN形式
});

if (result4.isErr()) {
  const error = result4.error;
  console.log(`エラータイプ: ${error.type}`);
  console.log(`技術的メッセージ: ${error.message}`);
  console.log(
    `ユーザー向けメッセージ: ${formatUserFriendlyErrorMessage(error)}`,
  );
} else {
  console.log("エラーが発生するはずでした（無効なISBN）");
}

// 例5: 複数の検索条件での複合エラー
console.log("\n=== 例5: 複数の検索条件での複合エラー ===");

const result5 = await searchSRU({
  title: "", // 空文字列
  creator: "", // 空文字列
  dateRange: {
    from: "2025", // 未来の日付
    to: "2020", // from > to の無効な範囲
  },
} as Record<string, unknown>);

if (result5.isErr()) {
  const error = result5.error;
  console.log(`エラータイプ: ${error.type}`);
  console.log(`詳細: ${error.message}`);
  console.log(`ユーザー向け: ${formatUserFriendlyErrorMessage(error)}`);

  // エラー種類の詳細判定
  if (isValidationError(error)) {
    console.log("→ 入力パラメータの検証でエラーが発生しました");
  } else if (isQuerySyntaxError(error)) {
    console.log("→ CQLクエリの構文に問題があります");
  }
}

console.log("\n✓ エラーハンドリングのデモンストレーション完了");
