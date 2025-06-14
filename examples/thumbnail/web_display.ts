/**
 * Thumbnail API Web Display Example
 *
 * Webアプリケーションでの書影表示例
 * Data URLを使用したブラウザ表示
 *
 * 実行方法:
 * deno run --allow-net --allow-write examples/thumbnail/web_display.ts
 */

import { fetchThumbnail, thumbnailExists } from "../../mod.ts";

console.log("Thumbnail API Web表示例");
console.log("=".repeat(30));

// HTMLテンプレート生成
function generateHTMLTemplate(
  thumbnails: Array<{
    id: string;
    title: string;
    dataUrl: string;
    size: string;
    fileSize: number;
  }>,
): string {
  const thumbnailCards = thumbnails.map((thumb) => `
    <div class="thumbnail-card">
      <img src="${thumb.dataUrl}" alt="${thumb.title}" />
      <div class="info">
        <h3>${thumb.title}</h3>
        <p>ID: ${thumb.id}</p>
        <p>サイズ: ${thumb.size}</p>
        <p>ファイルサイズ: ${thumb.fileSize} bytes</p>
      </div>
    </div>
  `).join("\n");

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NDL Thumbnail Gallery</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .thumbnail-card {
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .thumbnail-card img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .info h3 {
      margin: 10px 0 5px 0;
      color: #333;
    }
    .info p {
      margin: 3px 0;
      color: #666;
      font-size: 0.9em;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }
  </style>
</head>
<body>
  <h1>📚 NDL Thumbnail Gallery</h1>
  <div class="gallery">
    ${thumbnailCards}
  </div>
</body>
</html>
  `;
}

// 1. 書影データの取得と検証
console.log("\n=== 1. 書影データの取得 ===");

const booksToDisplay = [
  { isbn: "9784422311074", title: "実際に利用可能な書籍" },
  { isbn: "9784163902774", title: "ノルウェイの森" },
  { isbn: "9784101092058", title: "坊っちゃん" },
];

const thumbnailData: Array<{
  id: string;
  title: string;
  dataUrl: string;
  size: string;
  fileSize: number;
}> = [];

for (const book of booksToDisplay) {
  console.log(`\n📖 処理中: ${book.title} (${book.isbn})`);

  // まず存在確認
  const existsResult = await thumbnailExists({
    id: book.isbn,
  });

  if (existsResult.isOk() && existsResult.value.exists) {
    console.log(`✅ サムネイル存在確認: ${book.title}`);

    // Mサイズのサムネイルを取得
    const thumbnailResult = await fetchThumbnail({
      id: book.isbn,
    });

    if (thumbnailResult.isOk()) {
      const thumbnail = thumbnailResult.value;

      // Data URLを生成（NDLはJPEGのみ）
      const base64 = btoa(String.fromCharCode(...thumbnail.imageData));
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      thumbnailData.push({
        id: book.isbn,
        title: book.title,
        dataUrl,
        size: thumbnail.metadata.size,
        fileSize: thumbnail.metadata.fileSize,
      });

      console.log(`✅ Data URL生成完了: ${book.title}`);
      console.log(`   📐 サイズ: ${thumbnail.metadata.size}`);
      console.log(
        `   💾 ファイルサイズ: ${thumbnail.metadata.fileSize} bytes`,
      );
    } else {
      console.log(
        `❌ 取得失敗: ${book.title} - ${thumbnailResult.error.message}`,
      );
    }
  } else {
    console.log(`⚠️ サムネイルなし: ${book.title}`);
  }
}

// 2. HTMLファイルの生成
console.log("\n=== 2. HTMLギャラリーの生成 ===");

if (thumbnailData.length > 0) {
  const htmlContent = generateHTMLTemplate(thumbnailData);

  // HTMLファイルに保存
  const htmlFilename = "./thumbnail_gallery.html";

  try {
    await Deno.writeTextFile(htmlFilename, htmlContent);
    console.log(`✅ HTMLギャラリー生成完了: ${htmlFilename}`);
    console.log(
      `🌐 ブラウザで開いてください: file://${Deno.cwd()}/${htmlFilename}`,
    );
  } catch (error) {
    console.error(`❌ HTMLファイル保存失敗: ${error}`);
  }
} else {
  console.log("❌ 表示可能なサムネイルがありません");
}

// 3. 統計情報の表示
console.log("\n=== 3. 統計情報 ===");
console.log(`📊 処理結果:`);
console.log(`   対象書籍: ${booksToDisplay.length}冊`);
console.log(`   取得成功: ${thumbnailData.length}冊`);
console.log(
  `   成功率: ${
    Math.round(thumbnailData.length / booksToDisplay.length * 100)
  }%`,
);

if (thumbnailData.length > 0) {
  const totalSize = thumbnailData.reduce(
    (sum, thumb) => sum + thumb.fileSize,
    0,
  );
  const averageSize = Math.round(totalSize / thumbnailData.length);

  console.log(`💾 合計ファイルサイズ: ${totalSize} bytes`);
  console.log(`📏 平均ファイルサイズ: ${averageSize} bytes`);
}

// 4. ダイナミックHTMLの例（仮想的なWebサーバー用コード例）
console.log("\n=== 4. Web API使用例 ===");
console.log(`
// Express.js等での使用例:
app.get('/api/thumbnail/:isbn', async (req, res) => {
  const { isbn } = req.params;
  const size = req.query.size || 'M';
  
  const result = await fetchThumbnail({
    id: isbn
  });
  
  if (result.isOk()) {
    const thumbnail = result.value;
    res.set({
      'Content-Type': thumbnail.metadata.format,
      'Content-Length': thumbnail.metadata.fileSize,
      'Cache-Control': 'public, max-age=86400'
    });
    res.send(Buffer.from(thumbnail.imageData));
  } else {
    res.status(404).json({ error: 'Thumbnail not found' });
  }
});
`);

console.log("\n✅ Web表示例の実行完了");
console.log("\n💡 実用的な使用法:");
console.log("   - Data URLでインライン画像表示");
console.log("   - HTMLギャラリーの動的生成");
console.log("   - WebサーバーでのProxyAPI実装");
console.log("   - 画像キャッシュとCDN連携");
