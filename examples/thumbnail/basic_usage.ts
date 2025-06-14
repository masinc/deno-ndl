/**
 * NDL Thumbnail API - Basic Usage Example
 *
 * This example demonstrates how to use the NDL Thumbnail API to fetch book cover images.
 */

import { fetchThumbnail, thumbnailExists } from "../../mod.ts";

console.log("=== NDL Thumbnail API - Basic Usage Example ===\n");

// 1. 基本的なサムネイル取得
console.log("=== 1. 基本サムネイル取得 ===");
const smallResult = await fetchThumbnail({
  id: "9784422311074",
});

if (smallResult.isOk()) {
  const response = smallResult.value;
  console.log(`📚 対象ID: ${response.id}`);
  console.log(`📷 画像サイズ: ${response.metadata.size}`);
  console.log(`💾 ファイルサイズ: ${response.metadata.fileSize} bytes`);
  console.log(`🗄️ 画像形式: ${response.metadata.format}`);

  // 画像データを取得して確認
  console.log(`🔢 画像データサイズ: ${response.imageData.length} bytes`);
  console.log(`🌐 画像URL: ${response.imageUrl}`);
} else {
  console.error(`❌ エラー: ${smallResult.error.message}`);
}

// 2. 中サイズのサムネイル取得
console.log("\n=== 2. 別のサムネイル取得 ===");
const mediumResult = await fetchThumbnail({
  id: "9784163902774",
}, {
  timeout: 15000,
  cache: true,
});

if (mediumResult.isOk()) {
  const response = mediumResult.value;
  console.log(`📷 取得成功: ${response.metadata.size}`);
  console.log(`💾 ファイルサイズ: ${response.metadata.fileSize} bytes`);
  console.log(`📷 画像形式: ${response.metadata.format}`);
} else {
  console.error(`❌ エラー: ${mediumResult.error.message}`);
}

// 3. 大サイズのサムネイル取得
console.log("\n=== 3. さらに別のサムネイル取得 ===");
const largeResult = await fetchThumbnail({
  id: "9784163902774",
});

if (largeResult.isOk()) {
  const response = largeResult.value;
  console.log(`📷 ファイル名: thumbnail_${response.id}.jpg`);
  console.log(`💾 ファイルサイズ: ${response.metadata.fileSize} bytes`);
} else {
  console.error(`❌ エラー: ${largeResult.error.message}`);
}

// 4. サムネイル存在確認
console.log("\n=== 4. サムネイル存在確認 ===");
const existsResult = await thumbnailExists({
  id: "9784422311074",
});

if (existsResult.isOk()) {
  const response = existsResult.value;
  console.log(`📚 対象ID: ${response.id}`);
  console.log(`✅ 存在: ${response.exists ? "はい" : "いいえ"}`);
  console.log(`⏰ 確認日時: ${response.checkedAt}`);
} else {
  console.error(`❌ エラー: ${existsResult.error.message}`);
}

console.log("\n🎉 基本的な使用例が完了しました！");
