# 認証仕様

## 概要

キメボードは以下の認証モードをサポートする。

| モード | 用途 | Firebase |
|--------|------|----------|
| **認証スキップ** | ローカル開発 | 使用しない |
| **デモログイン** | 本番・ハッカソン | **使用しない**。DEMO_LOGIN_ID/パスワードでログイン |
| **Firebase** | 将来の拡張 | 使用する |

本番環境では Firebase を一切使用せず、デモ用ログインID・パスワードでログインする構成を採用する。

## 認証方式

| 方式           | 状態     | 備考                              |
|----------------|----------|-----------------------------------|
| デモログイン     | 実装済み | 本番向け。Firebase 不使用。DEMO_LOGIN_ID / DEMO_LOGIN_PASSWORD |
| 認証スキップ     | 実装済み | `DISABLE_AUTH=true` でログイン不要 |
| メール/パスワード | 実装済み | Firebase 利用時。サインアップ・ログイン |
| Google ログイン  | 将来対応 | Firebase Auth の OAuth で追加可能 |

リリース環境のログイン情報は [Zenn](https://zenn.dev/higaso_oss) にて公開している。

## アーキテクチャ

### クライアント (apps/web)

- **Firebase Auth SDK**: メール/パスワードのサインアップ・ログイン・ログアウト
- **AuthProvider**: `onAuthStateChanged` でユーザー状態を管理
- **AuthGuard**: 未認証時に `/login` へリダイレクト（公開パス `/login`, `/signup` は除外）
- **API 呼び出し**: `Authorization: Bearer <ID Token>` を付与

### API (apps/api)

- **Firebase Admin SDK**: ID トークンの検証
- **requireFirebaseAuth**: 各ルートでトークン検証、失敗時 401 返却

### ルート

| パス           | 認証 | 説明           |
|----------------|------|----------------|
| `/login`       | 不要 | ログイン画面   |
| `/signup`      | 不要 | 新規登録画面   |
| `/projects`    | 必要 | プロジェクト一覧 |
| `/p/:id/*`     | 必要 | プロジェクト配下 |

## 環境変数

### apps/web

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 認証ドメイン |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket（オプション） |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | メッセージング Sender ID（オプション） |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_DISABLE_AUTH` | `true` で認証をスキップ（ローカル開発用） |
| `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` | `true` で Auth Emulator に接続 |
| `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` | Auth Emulator URL（デフォルト: `http://127.0.0.1:9099`） |

### apps/api

| 変数 | 説明 |
|------|------|
| `GOOGLE_CLOUD_PROJECT` または `FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `FIREBASE_CLIENT_EMAIL` | サービスアカウントのメール |
| `FIREBASE_PRIVATE_KEY` | サービスアカウントの秘密鍵（改行は `\n` でエスケープ） |
| `DISABLE_AUTH` | `true` でトークン検証をスキップ（ローカル開発用） |
| `FIREBASE_AUTH_EMULATOR_HOST` | Auth Emulator ホスト（例: `127.0.0.1:9099`）。設定時は本番資格情報不要 |

## Google ログインへの拡張

1. **Firebase Console**: Authentication → Sign-in method で Google プロバイダを有効化
2. **web**: `signInWithPopup(auth, new GoogleAuthProvider())` を追加
3. **AuthContext**: `signInWithGoogle()` メソッドを追加し、既存の `signIn` と並列で利用可能にする
4. API 側はトークン検証のみのため変更不要（Firebase が発行する ID トークンはプロバイダに依存しない）
