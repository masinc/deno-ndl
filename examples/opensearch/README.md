# OpenSearch API 使用例

国立国会図書館の OpenSearch API を使用した検索例です。

## 実行方法

各例を実行するには：

```bash
deno run --allow-net examples/opensearch/basic_search.ts
```

## 例一覧

### 1. 基本的な検索 (`basic_search.ts`)

最もシンプルな検索例です。指定したキーワードで検索し、結果を整形して表示します。

- 書誌情報の基本的な表示
- 著者、出版社、ISBN、資料種別の表示

### 2. ページネーション (`pagination.ts`)

複数ページにわたる検索結果を取得する例です。

- 総件数とページ数の表示
- 複数ページの順次取得
- API制限を考慮した待機時間

### 3. 高度な検索 (`advanced_search.ts`)

複数の検索条件を使った高度な検索例です。

- 著者名検索
- 作品名検索
- 複合語検索
- 詳細な書誌情報の表示

### 4. エラーハンドリング (`error_handling.ts`)

様々なエラーケースの処理方法を示す例です。

- 正常なケース
- バリデーションエラー
- APIエラー（レート制限など）
- ネットワークエラー

## API制限について

国立国会図書館のAPIには利用制限があります：

- 連続してリクエストを送る場合は適切な間隔を空ける
- エラーが発生した場合は適切に処理する
- 過度なアクセスは控える

## 結果の構造

`searchOpenSearch` は以下の構造でデータを返します：

```typescript
{
  items: OpenSearchItem[],      // 検索結果
  pagination: {             // ページネーション情報
    totalResults: number,   // 総件数
    currentPage: number,    // 現在のページ
    totalPages: number,     // 総ページ数
    itemsPerPage: number,   // ページあたりの件数
    startIndex: number,     // 開始位置
  },
  query: {                  // 検索クエリ
    q: string,              // 検索語
    format?: string,        // フォーマット
  }
}
```

各検索結果 (`OpenSearchItem`) には以下の情報が含まれます：

```typescript
{
  title: string,            // タイトル
  link: string,             // 詳細ページURL
  description?: string,     // 説明
  publishedDate?: string,   // 出版日
  authors?: string[],       // 著者
  publisher?: string,       // 出版社
  isbn?: string,            // ISBN
  ndlBibId?: string,        // NDL書誌ID
  materialType?: string[],  // 資料種別
}
```
