# SRU API 使用例

国立国会図書館の SRU (Search/Retrieve via URL) API を使用した検索例です。

## 実行方法

各例を実行するには：

```bash
deno run --allow-net examples/sru/basic_search.ts
```

## 例一覧

### 1. 基本的な検索 (`basic_search.ts`)

最もシンプルなSRU検索例です。CQLクエリで指定した条件で検索し、結果を整形して表示します。

- 基本的なCQLクエリの使用
- 書誌情報の基本的な表示
- 著者、出版社、日付、資料種別の表示

### 2. 高度なCQLクエリ (`advanced_cql.ts`)

複数のCQL検索条件を使った高度な検索例です。

- 著者名検索 (`creator="太宰治"`)
- 複合検索 (`title="銀河鉄道の夜" AND creator="宮沢賢治"`)
- 年代範囲検索 (`date >= "1900" AND date <= "1950"`)
- OR検索 (`title="作品1" OR title="作品2"`)

### 3. ページネーション (`pagination.ts`)

複数ページにわたる検索結果を取得する例です。

- 総件数とページ数の表示
- 複数ページの順次取得
- 次のレコード位置の利用
- API制限を考慮した待機時間

### 4. Explain操作 (`explain.ts`)

SRUサーバーの機能と設定を取得する例です。

- サーバー情報の取得
- 利用可能なインデックスの一覧
- サポートされているレコードスキーマ
- データベース情報の表示

## CQL (Contextual Query Language) について

SRU APIではCQLという標準的なクエリ言語を使用します。

### 基本的な検索

```cql
title="夏目漱石"
creator="太宰治"
subject="文学"
```

### 複合検索

```cql
title="吾輩は猫である" AND creator="夏目漱石"
creator="宮沢賢治" OR creator="太宰治"
title="文学" NOT subject="評論"
```

### 年代検索

```cql
date="1905"
date >= "1900"
date <= "1950"
date >= "1900" AND date <= "1950"
```

### ワイルドカード検索

```cql
title="夏目*"
creator="*治"
```

## 利用可能なインデックス

NDL SRU APIで利用可能な主要インデックス：

- `title` - タイトル
- `creator` - 著者・作成者
- `subject` - 主題
- `publisher` - 出版者
- `date` - 日付
- `type` - 資料種別
- `language` - 言語
- `identifier` - 識別子

## レコードスキーマ

SRU APIでサポートされているレコードスキーマ：

- `info:srw/schema/1/dc-v1.1` - Dublin Core (デフォルト)
- `info:srw/schema/1/mods-v3.0` - MODS
- `http://www.loc.gov/MARC21/slim` - MARCXML
- `dcndl` - DC-NDL
- `dcterms` - Dublin Core Terms

## API制限について

国立国会図書館のAPIには利用制限があります：

- 連続してリクエストを送る場合は適切な間隔を空ける
- エラーが発生した場合は適切に処理する
- 過度なアクセスは控える

## 結果の構造

`searchSRU` は以下の構造でデータを返します：

```typescript
{
  items: SRUSearchItem[],     // 検索結果
  pagination: {               // ページネーション情報
    totalResults: number,     // 総件数
    currentPage: number,      // 現在のページ
    totalPages: number,       // 総ページ数
    itemsPerPage: number,     // ページあたりの件数
    startIndex: number,       // 開始位置
    nextRecordPosition?: number,  // 次のレコード位置
    resultSetId?: string,     // 結果セットID
  },
  query: {                    // 検索クエリ情報
    cql: string,              // CQLクエリ
    schema?: string,          // レコードスキーマ
  },
  diagnostics?: Array<{       // 診断情報（エラー等）
    code: string,
    message: string,
    details?: string,
  }>,
}
```

各検索結果 (`SRUSearchItem`) には以下の情報が含まれます：

```typescript
{
  title: string,            // タイトル
  identifier?: string,      // レコード識別子
  creators?: string[],      // 著者・作成者
  publishers?: string[],    // 出版者
  date?: string,           // 日付
  subjects?: string[],     // 主題
  type?: string,           // 資料種別
  language?: string,       // 言語
  rawData: unknown,        // 生のレコードデータ
}
```
