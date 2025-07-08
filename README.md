# GitHub Repository Manager

Go + Next.jsで構築されたGitHubリポジトリ管理アプリケーション

## 🎯 機能

- GitHubリポジトリの可視性変更（Public ↔ Private）
- リポジトリのアーカイブ状態変更
- リポジトリの安全な削除（確認ダイアログ付き）

## 🚀 クイックスタート

### 1. 環境変数設定（自動）
```bash
./setup-env.sh
```

### 2. 起動方法

#### ローカル開発
```bash
make setup  # 初回のみ
make dev
```

#### Docker開発環境（推奨）
```bash
make docker-dev
```

### 3. アクセス
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8080

## 📚 ドキュメント

- [📋 プロジェクト進捗状況](PROJECT_STATUS.md) - 完了した作業と次のステップ
- [🔧 セットアップガイド](SETUP.md) - 詳細なセットアップ手順
- [🐳 Docker使用ガイド](DOCKER.md) - Docker環境での開発
- [🔐 GitHub OAuth設定](GITHUB_OAUTH_SETUP.md) - OAuth App作成手順

## 🧪 テスト

```bash
# Playwright テスト実行
make test

# UI付きテスト実行
make test-ui

# ブラウザ表示テスト
make test-headed
```

## 🛠 技術スタック

### バックエンド
- Go 1.21+ / Gin Framework
- GitHub OAuth2 + JWT認証
- Docker + Air（ホットリロード）

### フロントエンド
- Next.js 14 (App Router) / TypeScript
- Tailwind CSS / React Query
- Playwright（E2Eテスト）

### 開発環境
- Docker Compose（開発・本番対応）
- Makefile（開発コマンド統一）
- 自動環境設定スクリプト

## 📊 プロジェクト状況

- ✅ プロジェクト構造・基盤完成
- ✅ テスト環境完成
- ✅ ホームページ完成
- ✅ Docker環境完成
- 🔄 認証機能実装中
- 🔄 ダッシュボード機能（準備済み）
- 🔄 リポジトリ管理機能（設計済み）

詳細は [PROJECT_STATUS.md](PROJECT_STATUS.md) を参照