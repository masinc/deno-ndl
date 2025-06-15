# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## バージョニング形式

- **0.MINOR.PATCH**: 現在は0.x.x形式を使用（MAJORバージョンは使用しない）
- **PATCH番号**: パッチリリースでは現在の日時分を使用 (YYYYMMDDHHMM)
  - 例: `0.0.202506141530` = 2025年6月14日15時30分のリリース
- **MINOR番号**: 新機能追加時に手動でインクリメント
- **MAJOR番号**: 現在のプロジェクトフェーズでは使用しない

## [0.1.202506150938] - 2025-06-15

### Added

- テストカバレッジシステム実装 - deno coverageによる品質可視化
- 包括的カバレッジタスク追加 (`test:coverage`, `coverage`, `coverage:lcov`,
  `coverage:clean`, `check:coverage`)
- CI/CDワークフローにカバレッジ生成統合
- Codecov外部レポート連携とバッジ表示
- 詳細なカバレッジ使用ドキュメント（README.md「開発とテスト」セクション）

### Technical

- ベースラインカバレッジ確立 (56.1% line coverage, 60.6% branch coverage)
- HTMLレポート自動生成 (`coverage/html/index.html`)
- LCOV形式レポート対応
- GitHub Actions Artifactによるレポート保存
- JSR ScoreとCodecovバッジ追加

## [0.1.202506150757] - 2025-06-15

### Fixed

- JSR公開エラーを修正 - Thumbnailスキーマの明示的型アノテーション追加
- ThumbnailRequestSchema, ThumbnailMetadataSchema, ThumbnailResponseSchema,
  ThumbnailExistsResponseSchemaに明示的型アノテーション追加
- 不要なImageFormatSchemaを削除し直接文字列リテラル型に変更

## [0.1.202506150741] - 2025-06-15

### Added

- Thumbnail API実装 - NDL書影画像取得機能
- サムネイル存在確認API (`thumbnailExists`)
- 画像ファイル保存機能 (`saveThumbnailToFile`)
- Thumbnail API用の包括的なテストスイート
- 実用的な使用例（基本取得・Web表示）

### Technical

- 簡潔なAPIデザイン（IDパラメータのみ）
- 実際のNDL API仕様に準拠した実装
- バイナリデータハンドリング対応
- AbortControllerによるタイムアウト制御

## [0.0.202506150355] - 2025-06-15

### Added

- 包括的なプロジェクトドキュメント更新
- README.md: ユーザー向け簡潔なAPIガイド
- CHANGELOG.md: Keep a Changelog形式の変更履歴
- docs/release.md: 詳細なリリース手順ドキュメント
- 充実したJSDocによるAPIリファレンス
- カスタムバージョニング戦略（日時分ベースパッチ）

### Changed

- APIリファレンスをJSRドキュメント参照に変更
- プロジェクト開発フェーズに応じたドキュメント構成
- CLAUDE.mdにリリース手順参照を追加

### Fixed

- コードフォーマット統一（CI対応）

## [0.0.3] - 2025-06-14

### Added

- 統一されたエラーハンドリングシステム
- 日本語エラーメッセージ対応
- SRUとOpenSearchの型名一貫性
- 拡張されたページネーション機能（`hasPreviousPage`、`hasNextPage`、`nextPageParams`等）
- OpenSearchでのクライアントサイドソート・フィルタ機能
- 豊富な使用例とドキュメント

### Changed

- OpenSearch APIの最適化と統一
- API署名の統一: `searchOpenSearch(query, options)`
- 型名の一貫性: `SearchItem` → `OpenSearchItem`, `SearchResponse` →
  `OpenSearchSearchResponse`
- XMLパーサーの静的インポート化による最適化
- NDL API 1-based ↔ 0-based インデックス変換の自動化

### Fixed

- 実際のNDL APIレスポンスに対応したスキーマ検証
- OpenSearch要素の文字列→数値変換対応
- XML名前空間属性の完全サポート
- CDATA/HTML内容のバリデーション緩和

## [0.0.2] - 2025-06-14

### Added

- SRU (Search/Retrieve via URL) API完全実装
- OpenSearch API実装
- CQLクエリビルダー機能
- 基本的なエラーハンドリング（neverthrow使用）
- Zod v4による型安全なスキーマ検証
- ユニットテスト・統合テストの実装

### Features

- 型安全な書誌検索
- ページネーション対応
- エラー型ガード関数
- 豊富な検索オプション

## [0.0.1] - 2025-06-14 (初期リリース)

### Added

- プロジェクト基盤構築
- 基本的なディレクトリ構成
- Deno 2.0+対応
- 共通スキーマ定義
- 基本的なHTTPクライアント
- 開発環境セットアップ

### Technical

- TypeScript strict mode対応
- Zod v4によるバリデーション
- fast-xml-parser v5.2+によるXMLパース
- JSR公開対応
