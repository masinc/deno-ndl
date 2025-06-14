# Deno NDL API Library - 開発ドキュメント

## プロジェクト概要

国立国会図書館（NDL）APIの型安全なDenoライブラリ開発プロジェクト。 Zod
v4による厳密な型定義とテストファースト開発を採用。

## 開発方針

### アーキテクチャ原則

- **型安全性最優先**: Zod v4によるランタイム検証とTypeScript型の完全な一致
- **テストファースト開発**: 実装前にテストケースを定義
- **モジュラー設計**: 各APIクライアントは独立して使用可能
- **エラー処理の一貫性**: 予測可能なエラーハンドリング

### 技術スタック

- **ランタイム**: Deno 2.0+
- **型システム**: TypeScript 5.0+ with strict mode
- **バリデーション**: Zod v3.25+ (`npm:zod`) - **v4を使用**
- **XMLパース**: fast-xml-parser v5.2+ (`npm:fast-xml-parser`)
- **テスト**: Deno標準テストフレームワーク (`@std/assert`)
- **HTTPクライアント**: Fetch API (Web標準)

### ライブラリimport規約

```typescript
// Zod v4 (必須) - v3のimportは禁止
import { z } from "zod/v4";  // ✅ 正しい
// import { z } from "zod";  // ❌ v3なので禁止

// XML Parser
import { XMLParser } from "fast-xml-parser";

// テスト
import { assert, assertEquals } from "@std/assert";
```

## NDL API仕様

### 1. 検索API

- **SRU** (Search/Retrieve via URL)
- **OpenSearch**
- **OpenURL**

### 2. ハーベストAPI

- **OAI-PMH** (メタデータハーベスティング)

### 3. サムネイルAPI

- 書影画像の取得

## ディレクトリ構成

```
deno-ndl/
├── mod.ts                  # メインエントリーポイント
├── cli.ts                  # CLIエントリーポイント
├── src/
│   ├── api/               # API関数実装
│   │   ├── sru.ts         # searchSRU等
│   │   ├── opensearch.ts  # searchOpenSearch等
│   │   ├── openurl.ts     # resolveOpenURL等
│   │   ├── oai_pmh.ts     # harvestOAIPMH等
│   │   └── thumbnail.ts   # fetchThumbnail等
│   ├── schemas/           # Zodスキーマ定義
│   │   ├── common.ts
│   │   ├── sru/
│   │   ├── opensearch/
│   │   ├── openurl/
│   │   └── oai_pmh/
│   ├── types/             # TypeScript型定義
│   ├── utils/             # ユーティリティ関数
│   ├── result.ts          # Result型定義
│   ├── errors.ts          # エラー型定義
│   └── cli/               # CLIコマンド実装
│       ├── commands/
│       └── formatters/
├── tests/                 # テストファイル
├── examples/              # 使用例
└── docs/                  # 詳細ドキュメント
    ├── architecture.md    # アーキテクチャ詳細
    ├── api-reference.md   # APIリファレンス
    └── development.md     # 開発ガイド
```

## 実装ガイドライン

### コーディング規約

1. **命名規則**
   - API関数: `${動詞}${対象}` (例: `searchSRU`, `fetchOpenSearch`)
   - スキーマ: `${名前}Schema` (例: `SRUResponseSchema`)
   - 型定義: `${名前}` (例: `SearchParams`, `SearchResult`)
   - ユーティリティ: `${動詞}${名前}` (例: `parseXML`, `formatDate`)

2. **関数設計**
   - 純粋関数を優先
   - 副作用は最小限に
   - 高階関数とパイプライン処理を活用
   - 部分適用とカリー化を適切に使用

3. **エラー処理**
   - Result型パターンの採用 (`Result<T, E>`)
   - 例外は境界でのみキャッチ
   - エラーは値として扱う

4. **テスト戦略**
   - 純粋関数の単体テスト優先
   - プロパティベーステスト活用
   - 統合テストは最小限に

## 開発ワークフロー

### ブランチ戦略

- **main**: リリース可能な状態を維持（直接push禁止）
- **feature/**: 機能開発用ブランチ

### 開発サイクル

1. **Issue作成**: タスクをIssueとして記録
2. **ブランチ作成**: `feature/#{issue番号}-機能名`
3. **実装**: テストファーストで開発
4. **PR作成**: `Closes #issue番号`を含める
5. **マージ**: テスト通過後にマージ

### コミットメッセージ

```
<type>: <内容> (#issue番号)
```

**Type**:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `test`: テスト
- `refactor`: リファクタリング
- `chore`: その他

**例**: `feat: SRU検索APIの実装 (#1)`

### GitHub Issues・ラベル管理

#### 標準ラベル

- `bug` - バグ報告
- `enhancement` - 新機能・機能拡張
- `documentation` - ドキュメント関連
- `good first issue` - 初心者向け
- `help wanted` - 支援募集
- `question` - 質問
- `duplicate` - 重複
- `invalid` - 無効
- `wontfix` - 対応しない

#### カスタムラベル

**機能系ラベル**

- `type: core` - コア機能・基盤関連（Result型、エラー処理等）
- `type: cli` - CLI機能関連

**API系ラベル**

- `type: api-sru` - SRU API関連
- `type: api-opensearch` - OpenSearch API関連
- `type: api-openurl` - OpenURL API関連
- `type: api-oai-pmh` - OAI-PMH API関連
- `type: api-thumbnail` - Thumbnail API関連

**優先度ラベル**

- `priority: high` - 優先度高（基盤機能、主要API）
- `priority: medium` - 優先度中（CLI、補助機能）
- `priority: low` - 優先度低（その他API、拡張機能）

#### ラベル使用例

```bash
# 基盤機能のIssue作成
gh issue create --label "type: core,priority: high,enhancement"

# SRU API実装のIssue作成
gh issue create --label "type: api-sru,priority: high,enhancement"

# バグ報告
gh issue create --label "bug,type: api-sru"
```

## 開発環境セットアップ

```bash
# リポジトリクローン
git clone https://github.com/masinc/deno-ndl.git
cd deno-ndl

# 依存関係の確認
deno cache --reload mod.ts

# 新しいIssueから作業開始
gh issue create
gh issue develop #{issue番号} --checkout
```

### 必要な環境

- Deno 2.0+
- Git
- GitHub CLI
- VS Code + Deno拡張機能

## ビルド・テスト

```bash
# テスト実行
deno task test

# 型チェック
deno task check

# リント
deno task lint

# フォーマット
deno task fmt
```

## 参考資料

- [NDL Search API仕様書](https://ndlsearch.ndl.go.jp/help/api/specifications)
- [DC-NDL仕様](https://www.ndl.go.jp/jp/dlib/standards/meta/index.html)
- [Zod Documentation](https://zod.dev/)
- [Deno Manual](https://deno.land/manual)
