# Docker セットアップガイド

## 前提条件

- Docker Desktop または OrbStack
- Docker Compose

## 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```bash
cp .env.example .env
```

`.env` ファイルを編集：
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
```

## 開発環境での起動

### 方法1: Makefileを使用（推奨）

```bash
# 開発環境の起動（ホットリロード付き）
make docker-dev

# ログの確認
make docker-logs

# 停止
make docker-down
```

### 方法2: Docker Composeを直接使用

```bash
# 開発環境の起動
docker-compose -f docker-compose.dev.yml up --build

# バックグラウンドで起動
docker-compose -f docker-compose.dev.yml up --build -d

# 停止
docker-compose -f docker-compose.dev.yml down
```

## 本番環境での起動

```bash
# 本番環境の起動
make docker-prod

# または
docker-compose up --build -d
```

## アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8080
- **ヘルスチェック**: http://localhost:8080/health

## 開発環境の特徴

### バックエンド (Go)
- **ホットリロード**: Air を使用してコード変更時に自動再起動
- **デバッグモード**: GIN_MODE=debug
- **ボリュームマウント**: ローカルコードの変更が即座に反映

### フロントエンド (Next.js)
- **ホットリロード**: Next.js の開発サーバー
- **ボリュームマウント**: ローカルコードの変更が即座に反映
- **node_modules**: Docker ボリュームで高速化

## 本番環境の特徴

### バックエンド
- **マルチステージビルド**: 最小限のイメージサイズ
- **Alpine Linux**: セキュリティと軽量性
- **ヘルスチェック**: 自動的な健全性監視

### フロントエンド
- **Standalone出力**: Next.js の最適化されたビルド
- **非rootユーザー**: セキュリティ強化
- **静的ファイル最適化**: 高速配信

## トラブルシューティング

### ポートが使用中の場合

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :8080

# Docker コンテナを停止
make docker-down
```

### Docker イメージの再ビルド

```bash
# キャッシュを無視して再ビルド
docker-compose build --no-cache

# または開発環境で
docker-compose -f docker-compose.dev.yml build --no-cache
```

### ボリュームの問題

```bash
# ボリュームを含めて完全にクリーンアップ
make docker-clean

# または
docker-compose down -v --remove-orphans
docker system prune -f
```

### ログの確認

```bash
# 全サービスのログ
make docker-logs

# 特定のサービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 便利なコマンド

```bash
# コンテナの状態確認
docker-compose ps

# コンテナ内でコマンド実行
docker-compose exec backend sh
docker-compose exec frontend sh

# イメージサイズの確認
docker images | grep github-repo-manager
```

## OrbStack での最適化

OrbStack を使用している場合の推奨設定：

1. **リソース制限**: OrbStack の設定でCPU/メモリを適切に設定
2. **ファイル共有**: OrbStack の高速ファイル共有機能を活用
3. **ネットワーク**: OrbStack のネイティブネットワーキング使用