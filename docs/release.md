# リリース手順

このドキュメントでは、deno-ndlライブラリの新バージョンをリリースする手順を説明します。

## 前提条件

- リポジトリへの書き込み権限
- GitHub CLI (`gh`) がインストール・認証済み
- Deno 2.0+ がインストール済み

## リリースフロー

### 1. リリース準備

#### 1.1 開発完了の確認

```bash
# 全テストの実行
deno task check

# 統合テストの実行
deno task test:integration

# 型チェック・リント・フォーマット確認
deno check **/*.ts
deno task lint
deno fmt --check
```

#### 1.2 変更内容の確認

```bash
# 前回リリース以降の変更を確認
git log --oneline $(git describe --tags --abbrev=0)..HEAD

# 変更されたファイルを確認
git diff --name-only $(git describe --tags --abbrev=0)..HEAD
```

### 2. バージョン更新

#### 2.1 バージョニングルール

以下のルールに従ってバージョンを決定：

- **MAJOR** (x.0.0): 破壊的変更 **※現在は使用しない**
  - API署名の変更
  - 既存の機能の削除
  - 互換性のない変更
  - **注意**: 現在のプロジェクトフェーズではMAJORバージョンアップは行わない

- **MINOR** (0.x.0): 後方互換性のある機能追加
  - 新しいAPIの追加
  - 新機能の追加
  - 依存関係の更新（非破壊的）

- **PATCH** (0.0.YYYYMMDDHHMM): 後方互換性のあるバグ修正・改善
  - バグ修正
  - パフォーマンス改善
  - ドキュメント更新
  - **形式**: 現在の日時分 (例: 0.0.202506141530 = 2025年6月14日15時30分)

#### パッチバージョンの生成例

```bash
# 現在の日時分を取得してパッチバージョンを生成
PATCH_VERSION=$(date +"%Y%m%d%H%M")
echo "新しいパッチバージョン: 0.0.${PATCH_VERSION}"

# 例: 2025年6月14日 15:30の場合
# 0.0.202506141530
```

#### 2.2 deno.jsonc更新

```bash
# 現在のバージョンを確認
cat deno.jsonc | grep version

# パッチバージョンの場合: 自動生成
PATCH_VERSION=$(date +"%Y%m%d%H%M")
NEW_VERSION="0.0.${PATCH_VERSION}"
echo "新しいバージョン: ${NEW_VERSION}"

# deno.jsonc のバージョンを更新
sed -i.bak "s/\"version\": \".*\"/\"version\": \"${NEW_VERSION}\"/" deno.jsonc

# 変更を確認
git diff deno.jsonc

# マイナーバージョンの場合: 手動更新
# 例: 0.0.x → 0.1.0
# deno.jsonc の "version" フィールドを手動編集
# 
# 注意: MAJORバージョン (1.0.0) は現在使用しない
```

#### 2.3 CHANGELOG.md更新

```markdown
## [0.0.202506141530] - 2025-06-14

### Added

- 新機能の説明

### Changed

- 変更された機能の説明

### Fixed

- 修正されたバグの説明

### Deprecated

- 非推奨になった機能

### Removed

- 削除された機能

### Security

- セキュリティ関連の修正
```

### 3. リリースコミットとタグ

#### 3.1 リリースコミット

```bash
# バージョン更新をコミット
git add deno.jsonc CHANGELOG.md
git commit -m "chore: bump version to ${NEW_VERSION}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# mainブランチにプッシュ
git push origin main
```

#### 3.2 タグ作成とプッシュ

```bash
# アノテーション付きタグを作成
git tag -a v${NEW_VERSION} -m "Release v${NEW_VERSION}

主な変更:
- 新機能A
- バグ修正B
- パフォーマンス改善C"

# タグをプッシュ（GitHub Actionsがトリガーされる）
git push origin v${NEW_VERSION}
```

### 4. GitHub Actions による自動デプロイ

#### 4.1 GitHub Actions ワークフロー確認

タグプッシュ後、GitHub Actionsが自動実行されます：

1. `.github/workflows/` 内のワークフローが実行される
2. JSRへの自動公開が行われる
3. Actions タブでデプロイ状況を確認

```bash
# GitHub Actions の実行状況確認
gh run list --limit 5

# 特定のワークフロー実行の詳細確認
gh run view [RUN_ID]
```

#### 4.2 デプロイ失敗時の対応

```bash
# Actions ログの確認
gh run view [RUN_ID] --log

# 失敗したジョブの再実行（権限がある場合）
gh run rerun [RUN_ID]
```

### 5. GitHub Release作成

#### 5.1 リリースノート生成

```bash
# GitHub CLIでリリース作成（リリースノート自動生成）
gh release create v0.0.4 --generate-notes --title "v0.0.4"

# または手動でリリースノートを作成
gh release create v0.0.4 --title "v0.0.4" --notes "$(cat <<'EOF'
## 新機能
- 機能Aの追加

## バグ修正
- 問題Bの修正

## その他
- ドキュメント更新

**Full Changelog**: https://github.com/masinc/deno-ndl/compare/v0.0.3...v0.0.4
EOF
)"
```

### 6. リリース後確認

#### 6.1 GitHub Actions成功確認

```bash
# GitHub Actions の実行結果確認
gh run list --workflow="publish.yml" --limit 1

# JSR公開ジョブの確認
gh run view [RUN_ID] --job="publish-jsr"
```

#### 6.2 JSR公開確認

```bash
# JSRでの公開確認
curl -s "https://jsr.io/@masinc/ndl" | grep "0.0.4"

# またはブラウザで確認
# https://jsr.io/@masinc/ndl
```

#### 6.3 インストールテスト

```bash
# 新しいプロジェクトでテスト
mkdir test-install && cd test-install
deno init
deno add jsr:@masinc/ndl@^0.0.4

# 基本的な動作確認
cat > test.ts << 'EOF'
import { searchSRU } from "jsr:@masinc/ndl@^0.0.4";
console.log("Import successful");
EOF

deno run test.ts
```

## トラブルシューティング

### GitHub Actions デプロイエラー

#### JSR公開失敗

```bash
# Actions ログでエラー内容確認
gh run view [RUN_ID] --log

# よくあるエラー:
# - 権限エラー: JSR_TOKEN の設定確認
# - 型チェックエラー: ローカルで deno check 実行
# - バージョン重複: deno.jsonc のバージョン確認
```

#### シークレット設定確認

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を確認：

- `JSR_TOKEN`: JSRのアクセストークン

### 手動JSR公開（緊急時のみ）

GitHub Actions失敗時の緊急対応：

```bash
# ローカルで公開（JSR_TOKENが必要）
export JSR_TOKEN="your_jsr_token"
deno publish

# または
deno publish --token your_jsr_token
```

### バージョン巻き戻し

```bash
# GitHubタグの削除
git tag -d v0.0.4
git push --delete origin v0.0.4

# GitHub Releaseの削除
gh release delete v0.0.4

# JSRでは巻き戻し不可 - 新バージョンで修正版をリリース
```

## チェックリスト

### リリース前

- [ ] 全テストがパス (`deno task check`)
- [ ] 統合テストがパス (`deno task test:integration`)
- [ ] CHANGELOG.mdが更新済み
- [ ] deno.jsonc のバージョンが更新済み
- [ ] APIの破壊的変更がある場合はMAJORバージョンアップ
- [ ] GitHub Actions ワークフローが最新状態

### リリース中

- [ ] リリースコミットが作成済み
- [ ] タグが作成・プッシュ済み
- [ ] GitHub Actions が正常実行
- [ ] GitHub Releaseが作成済み

### リリース後

- [ ] GitHub Actions の成功確認
- [ ] JSRでの公開が確認済み
- [ ] GitHub Releaseページが正常表示
- [ ] 新バージョンでのインストールテストが成功
- [ ] ドキュメントのバージョン表記更新（必要に応じて）

## GitHub Actions ワークフロー

現在のリポジトリでは以下のワークフローが設定されています：

- **Tag Push**: `v*` タグがプッシュされた時にJSR公開が実行される
- **自動テスト**: タグ作成前に全テストが実行される
- **JSR公開**: 成功時のみJSRに自動公開される

## 参考資料

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [JSR Documentation](https://jsr.io/docs)
- [GitHub Actions](https://docs.github.com/actions)
- [GitHub CLI Release](https://cli.github.com/manual/gh_release)
