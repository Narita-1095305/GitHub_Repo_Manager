# セットアップガイド

## 前提条件

- Go 1.21以上
- Node.js 18以上
- GitHub OAuth Appの作成

## GitHub OAuth App の設定

1. GitHub Settings > Developer settings > OAuth Apps に移動
2. "New OAuth App" をクリック
3. 以下の設定を入力：
   - Application name: `GitHub Repository Manager`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback`
4. Client IDとClient Secretをメモ

## 環境変数の設定

### バックエンド
```bash
cd backend
cp .env.example .env
```

`.env` ファイルを編集：
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_random_jwt_secret_key
PORT=8080
FRONTEND_URL=http://localhost:3000
```

### フロントエンド
```bash
cd frontend
cp .env.local.example .env.local
```

`.env.local` ファイルを編集：
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

## インストールと起動

### 方法1: Makefileを使用（推奨）
```bash
# 依存関係のインストール
make setup

# 開発サーバーの起動（バックエンド + フロントエンド）
make dev
```

### 方法2: 個別に起動
```bash
# バックエンドの起動
cd backend
go mod tidy
go run main.go

# 別のターミナルでフロントエンドの起動
cd frontend
npm install
npm run dev
```

## アクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8080
- ヘルスチェック: http://localhost:8080/health

## 次のステップ

1. 認証機能の実装
2. リポジトリ一覧表示機能
3. リポジトリ管理機能（可視性変更、アーカイブ、削除）

## トラブルシューティング

### ポートが使用中の場合
- バックエンド: `.env` の `PORT` を変更
- フロントエンド: `npm run dev -- -p 3001` で別ポートを使用

### CORS エラーの場合
- `backend/main.go` の CORS 設定を確認
- フロントエンドのURLが正しく設定されているか確認