# GitHub OAuth App セットアップガイド

## 1. GitHub OAuth Appの作成

### ステップ1: GitHub設定ページにアクセス
1. GitHubにログイン
2. 右上のプロフィール画像をクリック
3. **Settings** をクリック
4. 左サイドバーの **Developer settings** をクリック
5. **OAuth Apps** をクリック
6. **New OAuth App** ボタンをクリック

### ステップ2: OAuth App情報を入力

```
Application name: GitHub Repository Manager
Homepage URL: http://localhost:3000
Application description: Manage GitHub repositories with ease
Authorization callback URL: http://localhost:3000/api/auth/callback
```

### ステップ3: Client IDとClient Secretを取得
1. **Register application** をクリック
2. **Client ID** をコピー（公開情報）
3. **Generate a new client secret** をクリック
4. **Client Secret** をコピー（⚠️ 一度しか表示されません）

## 2. 環境変数の設定

### ローカル開発環境

#### バックエンド環境変数
`backend/.env` ファイルを作成：

```bash
cd backend
cp .env.example .env
```

`.env` ファイルを編集：
```env
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here
JWT_SECRET=your_random_jwt_secret_key_minimum_32_characters
PORT=8080
FRONTEND_URL=http://localhost:3000
```

#### フロントエンド環境変数
`frontend/.env.local` ファイルを作成：

```bash
cd frontend
cp .env.local.example .env.local
```

`.env.local` ファイルを編集：
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_actual_client_id_here
```

#### Docker環境用
プロジェクトルートに `.env` ファイルを作成：

```bash
cp .env.example .env
```

`.env` ファイルを編集：
```env
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here
JWT_SECRET=your_random_jwt_secret_key_minimum_32_characters
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
```

## 3. JWT Secretの生成

### 方法1: OpenSSLを使用
```bash
openssl rand -base64 32
```

### 方法2: Node.jsを使用
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 方法3: オンラインジェネレーター
https://generate-secret.vercel.app/32

## 4. 設定例

### 完全な設定例

#### `backend/.env`
```env
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
JWT_SECRET=YourSuperSecretJWTKeyThatIsAtLeast32CharactersLong123
PORT=8080
FRONTEND_URL=http://localhost:3000
```

#### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```

#### プロジェクトルート `.env` (Docker用)
```env
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
JWT_SECRET=YourSuperSecretJWTKeyThatIsAtLeast32CharactersLong123
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
```

## 5. 設定の確認

### 環境変数が正しく設定されているか確認

#### バックエンド
```bash
cd backend
go run main.go
```
ブラウザで http://localhost:8080/health にアクセス

#### フロントエンド
```bash
cd frontend
npm run dev
```
ブラウザで http://localhost:3000 にアクセス

#### Docker
```bash
make docker-dev
```

## 6. トラブルシューティング

### よくあるエラー

#### 1. "Invalid client_id"
- GitHub OAuth AppのClient IDが間違っている
- 環境変数が正しく設定されていない

#### 2. "Redirect URI mismatch"
- GitHub OAuth AppのCallback URLが間違っている
- 正しいURL: `http://localhost:3000/api/auth/callback`

#### 3. "JWT_SECRET not set"
- JWT_SECRETが設定されていない
- 32文字以上の文字列を設定する

#### 4. "CORS error"
- バックエンドのCORS設定を確認
- フロントエンドのURLが正しく設定されているか確認

### デバッグ方法

#### 環境変数の確認
```bash
# バックエンドで環境変数を確認
cd backend
go run -c "fmt.Println(os.Getenv('GITHUB_CLIENT_ID'))"

# フロントエンドで環境変数を確認（ブラウザのコンソール）
console.log(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID)
```

## 7. セキュリティ注意事項

⚠️ **重要**: 以下の情報は絶対に公開しないでください：
- `GITHUB_CLIENT_SECRET`
- `JWT_SECRET`

✅ **公開しても安全**:
- `GITHUB_CLIENT_ID` (NEXT_PUBLIC_で始まる変数)
- `NEXT_PUBLIC_API_URL`

### .gitignoreの確認
以下のファイルが`.gitignore`に含まれていることを確認：
```
.env
.env.local
.env.*.local
```

## 8. 本番環境での設定

本番環境では以下のURLに変更：
- Homepage URL: `https://yourdomain.com`
- Authorization callback URL: `https://yourdomain.com/api/auth/callback`
- FRONTEND_URL: `https://yourdomain.com`