# Deno NDL API Library

国立国会図書館（NDL）APIの型安全なDenoライブラリです。

[![JSR](https://jsr.io/badges/@masinc/ndl)](https://jsr.io/@masinc/ndl)

## 特徴

- 🔒 **型安全**: TypeScriptとZodによる厳密な型検証
- 🚀 **Deno標準**: Deno 2.0+対応、Webプラットフォーム準拠
- 🛡️ **エラーハンドリング**: neverthrowによる関数型エラー処理
- 📝 **豊富なドキュメント**: 充実した使用例とAPIリファレンス
- ⚡ **パフォーマンス**: 最適化されたXMLパースと静的インポート

## サポートAPI

### ✅ 実装済み

- **SRU (Search/Retrieve via URL)** - 書誌検索API
- **OpenSearch** - OpenSearch形式検索API

### 🚧 今後実装予定

- **OpenURL** - 書誌情報解決API
- **OAI-PMH** - メタデータハーベスティングAPI
- **Thumbnail** - 書影画像取得API

## インストール

### JSRから（推奨）

```bash
deno add jsr:@masinc/ndl
```

### Import maps使用

```json
{
  "imports": {
    "@masinc/ndl": "jsr:@masinc/ndl@^0.0.3"
  }
}
```

## 基本的な使用方法

### SRU API

```typescript
import { searchSRU } from "@masinc/ndl";

const result = await searchSRU("夏目漱石", { count: 10 });

if (result.isOk()) {
  const { items, pagination } = result.value;
  console.log(`見つかった件数: ${pagination.totalResults}`);
  
  items.forEach(item => {
    console.log(`${item.title} by ${item.authors?.join(", ")}`);
  });
} else {
  console.error("検索エラー:", result.error.message);
}
```

### OpenSearch API

```typescript
import { searchOpenSearch } from "@masinc/ndl";

const result = await searchOpenSearch("芥川龍之介", { count: 5 });

if (result.isOk()) {
  result.value.items.forEach(item => {
    console.log(`${item.title}`);
  });
} else {
  console.error("検索失敗:", result.error.message);
}
```

## エラーハンドリング

このライブラリは[neverthrow](https://github.com/supermacro/neverthrow)を使用した関数型エラーハンドリングを採用しています。

```typescript
import { searchSRU, isAPIError, isNetworkError } from "@masinc/ndl";

const result = await searchSRU("検索語", { count: 10 });

if (result.isErr()) {
  const error = result.error;
  
  if (isAPIError(error)) {
    console.error(`APIエラー (${error.statusCode}): ${error.message}`);
  } else if (isNetworkError(error)) {
    console.error(`ネットワークエラー: ${error.message}`);
  } else {
    console.error(`エラー: ${error.message}`);
  }
}
```

## 詳細情報

詳細なAPIリファレンスは [JSR](https://jsr.io/@masinc/ndl) をご覧ください。

## ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) ファイルをご覧ください。

## 関連リンク

- [国立国会図書館検索API](https://ndlsearch.ndl.go.jp/help/api/specifications)
- [DC-NDL仕様](https://www.ndl.go.jp/jp/dlib/standards/meta/index.html)
- [Deno](https://deno.land/)
- [JSR](https://jsr.io/)

## 更新履歴

更新履歴は [CHANGELOG.md](./CHANGELOG.md) をご覧ください。