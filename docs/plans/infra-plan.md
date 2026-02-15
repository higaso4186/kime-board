# Infra 修正計画

apps/api, apps/web と同様に infra を整える。**最小限**の変更で実施する。

## 1. 方針

| 区分 | 内容 |
|------|------|
| **個別デプロイ** | DB（Firestore）、ADK（Cloud Tasks 等 AI 系）は個別に対応可能にする |
| **一括デプロイ** | それ以外（foundation、Cloud Run）は一括でデプロイする |
| **上書き防止** | DB 等、既存リソースや更新がない場合は上書きしない制度設計 |

## 2. 現状

- `infra.ps1` で `foundation`, `db`, `adk`, `cloudrun`, `all` を Component として指定可能
- DB は `prevent_destroy` で destroy を防止済み
- Firestore rules/indexes は `-DeployFirestoreArtifacts` でオプトイン
- Cloud Run は `-EnableCloudRun` でオプトイン（デフォルト無効）

## 3. 変更計画（最小限）

### 3.1 デプロイ単位の明確化

| 単位 | 対象モジュール | 用途 |
|------|----------------|------|
| **個別: db** | `module.db` | Firestore のみ。既存 DB がある環境では apply しない前提 |
| **個別: adk** | `module.adk` | Cloud Tasks キュー等 AI 系。個別に更新したい場合 |
| **一括: services** | `foundation` + `cloud_run` | アプリ基盤・Cloud Run 一式。DB/ADK は含めない |

現状の `all` は全モジュールなので、「一括」として維持しつつ、`services` を新設するか、`all` の意味を「DB/ADK 以外」に限定する。

**最小変更案**: Component に `services` を追加し、`foundation` + `cloud_run` のみを target にする。

### 3.2 上書き防止の制度設計

| リソース | リスク | 対策（現状・追加） |
|----------|--------|---------------------|
| Firestore DB | データ消失 | `prevent_destroy=true` 済み。destroy は不可 |
| Firestore rules/indexes | 既存データには影響なし | `-DeployFirestoreArtifacts` がオプトイン。デフォルトで適用しない |
| Cloud Tasks キュー | キュー設定変更 | 既存キューへの変更は Terraform の update。意図しない変更を避けるため `plan` で確認必須 |
| Cloud Run | デプロイ更新 | `plan` で確認。`-EnableCloudRun` がオプトイン |

**追加対策案**:
- `infra.ps1` の `apply` 時に `Component=db` の場合は、事前に `plan` の差分を表示し、ユーザー確認を促す文言を README に追記
- DB が既に存在する環境で初回セットアップする場合は `terraform import` の手順を README に記載

### 3.3 実行コマンド例（変更後）

```powershell
# 個別: DB のみ
./infra/scripts/infra.ps1 -Action apply -Component db -ProjectId <PROJECT_ID> -DeployFirestoreArtifacts

# 個別: ADK のみ
./infra/scripts/infra.ps1 -Action apply -Component adk -ProjectId <PROJECT_ID>

# 一括: foundation + Cloud Run（DB, ADK は触らない）
./infra/scripts/infra.ps1 -Action apply -Component services -ProjectId <PROJECT_ID> -EnableCloudRun -SyncLocalEnv

# 全件（従来どおり）
./infra/scripts/infra.ps1 -Action apply -Component all -ProjectId <PROJECT_ID> -EnableCloudRun -SyncLocalEnv
```

## 4. 実装タスク（最小）

- [ ] `infra.ps1` に `services` Component を追加（`foundation` + `cloud_run` を target）
- [ ] `infra/README.md` に上記の方針・コマンド例・上書き防止の注意書きを追記
- [ ] 既存 DB の import 手順を README に追記（オプション）

## 5. 関連

- 仕様: [`specs/core/infra.yaml`](../../specs/core/infra.yaml)
- 操作: [`infra/README.md`](../../infra/README.md)
