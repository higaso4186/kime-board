# 会議はしたのに、何も決まってない問題を終わらせる。決裁の可視化『キメボード』

社内PJって、関係者が増えるほど「会議はしているのに、なぜか進まない」状態に落ちがちです。  
Slackで話した、口頭で合意した、議事録も残っている。なのに、次の会議で同じ話をしている。

この停滞の正体はシンプルで、だいたいこれです。

* **決裁（何を選ぶか）が可視化されていない**
* **決裁に必要な情報（不足）が明示されていない**
* **誰がいつまでに何を集めるか（アクション）が生まれていない**

結果、いつまでも「なんとなく会議」が増殖し、最後に上がるのは経営者のこの一言です。

> で、誰がどんなリカバリーをするの？

この“決裁が見えない問題”を、会議の入口から解くために作ったのが **キメボード**です。

---

## キメボードとは（1文で）

**キメボードは、議事録を「決裁ボード」に変換し、不足を質問で埋め、アクションまでつなぐプロダクト**です。

議事録を「読む」ではなく、議事録を **“決めるための形”に変換**します。

---

## そもそも決裁とは何か（キメボードが扱う粒度）

キメボードの前提はこれです。

* **決裁とは、何かを決めること**
* つまり必ず **選択肢（AかBか…）** がある
* そして決裁には「理由」「評価軸」「期限」「責任者」が本当は必要

ところが現実では、議事録やチャットは文章のまま残り、決裁が構造化されません。  
だから「決められない会議」を繰り返します。

---

## 問題の構造（会議が増殖するメカニズム）

社内PJが止まるときのパターンを分解すると、だいたい次の流れです。

### 症状

* 会議後に“決まっていないこと”が残る
* 宿題が曖昧
* 次の会議で同じ議題をリプレイする

### 原因

1. 会議メモが文章のまま残り、**決裁（選択肢）に変換されない**
2. 決裁に必要な**不足情報**が明示されない
3. 不足情報を誰が集めるかが決まらず、**アクションに落ちない**
4. 決裁と会議の関係が崩れて、議題が漂流する

### 結果

* 意思決定が遅れ、調整コスト（会議時間・フォロー）が増える
* 最終的に「言った言わない」「それ誰がやるの？」が発生する

---

## 解決の方針（キメボードがやること）

キメボードは、会議メモを次の4ステップで“前に進む形”へ変換します。

1. **会議メモを入力する**（MVPはコピペ）
2. **決裁（選択肢）として構造化する**
3. **不足情報を質問として生成する**
4. **決裁に紐づくアクションを作る**

ここで大事なのは、AIの役割を絞ることです。  
通知やリマインドはトリガーで十分で、AIが価値を出すのは **「判断が必要なところ」**だけ。

---

## 体験（カスタマージャーニー）

### 1) 入力（Input）

ユーザーは社内PJを作成し、会議メモ（議事録）を貼り付けて登録します。

* MVPはコピペ入力のみ（最短で動くことを優先）
* 将来的には Notion / tldv / Webhook などの入力コネクタを拡張

技術的には、入力は最初に正規化契約へ変換します。

* `source`: `PASTE|NOTION|TLDV|WEBHOOK|API`
* `projectId`
* `meetingMeta`: `title/heldAt/participants`
* `rawText`
* `externalRef`: `system/id/url`

`Meeting.source` は文字列1個ではなく `type + connectorId` を持てる設計です。  
また本文は `FIRESTORE|GCS` を切替可能にし、`checksum`（sha256）で同一入力を識別します。

---

### 2) 変換（決裁への構造化）

登録した会議メモから、キメボードは決裁候補を抽出してボード化します。

決裁は次のような“構造”として扱います。

* 決裁タイトル（短く具体）
* 選択肢（最低2つ）
* 評価軸（何で判断するか）
* 期限（いつまでに決めるか）
* 決裁者/責任者（誰が決めるか/推進するか）
* 根拠（なぜその結論が妥当か）

ここまで揃っていれば「決められる会議」になります。

---

### 3) 不足を質問で埋める（Chat）

決裁に必要な情報が欠けている場合、キメボードは **質問（QUESTION_SET）** を生成します。  
ユーザーはそれに回答（ANSWER_SET）するだけで、決裁が整っていきます。

この体験が地味に効きます。

* 「何が足りないか」が明確になる
* 「誰が答えるか（やるべきこと）」に変換される
* 結果、次の会議が“決める会議”になる

---

### 4) アクションへ落とす（Output）

決裁が整ったら、実行のためのアクションを作ります。  
キメボードではアクションを雑に増やすのではなく、2種類に寄せています。

* **PREP**：決裁を確定するための準備（調査、見積、影響確認など）
* **EXEC**：決裁後の実行（切替、周知、発注など）

粒度ルール:

* 1アクション = 1成果物
* 1アクション = 1担当
* 1アクション = 1期限

テンプレ例（業務別）:

* 営業企画/PREP: 見積例外パターンの棚卸し
* 営業企画/EXEC: 新テンプレ切替周知
* プロダクト/PREP: KPI定義変更の影響確認
* プロダクト/EXEC: ダッシュボード改修の実装

---

## 何が新しいか（差別化ポイント）

「議事録」「タスク管理」「CRM」など既存領域に近いので、新規性はここで明確にします。

### 1) 決裁を「選択肢の構造」として記録する

議事録やタスクは“文章”や“作業”です。  
キメボードは **決裁=選択肢** として記録し、意思決定の形にします。

### 2) 不足情報を“質問”として生成し、決裁を前進させる

止まる原因はだいたい不足情報です。  
質問を生成することで「次に何を埋めれば決裁できるか」が自動で出ます。

### 3) 「決められる状態」を評価する（品質ゲート）

決裁が整っているかを判定する指標（completeness/ready）を持ちます。  
これがあると「決められない会議」を減らせます。

判定イメージ:

* 必須: `owner`, `dueAt`, `options(2+)`, `criteria`, `rationale`
* 推奨: `assumptions`, `reopenTriggers`, `evidence`
* `completeness.score (0..100)` + `missingFields[]` で計算

状態遷移:

* `NEEDS_INFO`: 必須欠損あり or score < 70
* `READY_TO_DECIDE`: 必須欠損なし and score >= 70
* `DECIDED`: `decidedAt/decidedBy/decidedOptionId` が確定
* `REOPEN`: 反証条件成立で再審

---

## 技術アーキテクチャ（詳細）

### 全体構成

Google Cloud上で、責務分離した3サービス構成です。

* **Web**: Next.js App Router（`apps/web`）
* **API**: Next.js Route Handlers（`apps/api`）
* **Agent**: Python + FastAPI + ADK（`apps/agent`）
* **DB**: Firestore（正本）
* **非同期**: Cloud Tasks
* **LLM**: Vertex AI（Gemini）
* **秘匿情報**: Secret Manager
* **ログ**: Cloud Logging + Firestore `agent_runs`

### なぜ3サービス分離か

* WebはUI反復を高速化
* APIは業務整合性と権限を集中管理
* AgentはLLM依存ロジックを隔離

この分離により、画面改修・ドメイン修正・プロンプト改善を独立して回せます。

### 非同期設計（Cloud Tasks）

重い処理を同期APIから切り離します。主要キュータスクは以下。

* `agent_run_meeting_structurer`
* `agent_run_reply_integrator`
* `agent_generate_draft_actions_skill`

代表シーケンス（会議登録）:

1. `POST /api/projects/:projectId/meetings`
2. Meeting作成（`status=ANALYZING`）
3. Cloud Tasks enqueue
4. Agent実行（抽出/不足質問/更新）
5. Meeting更新（`DONE` or `FAILED`）
6. 右パネルでログ・質問を表示

### API境界（UI/Agent共通）

主要エンドポイント:

* `POST /api/projects`
* `POST /api/projects/:projectId/meetings`
* `GET /api/projects/:projectId/decisions`
* `PATCH /api/projects/:projectId/decisions/:decisionId`
* `POST /api/projects/:projectId/decisions/:decisionId/actions`
* `POST /api/projects/:projectId/decisions/:decisionId/chat/thread`
* `POST /api/chat/threads/:threadId/messages`

`ANSWER_SET` 投入時に `reply_integrator` をenqueueし、  
回答内容が決裁カードへ反映される導線を固定しています。

### Firestoreデータ設計（決裁中心）

会議中心ではなく、決裁中心で設計しています。

* `projects/{projectId}`（集計カウンタ保持）
* `meetings/{meetingId}`（入力束 + 解析状態）
* `decisions/{decisionId}`（独立バックログ）
* `actions/{actionId}`（PREP/EXEC）
* `threads/messages`（質問・回答履歴）
* `agent_runs/{runId}`（可観測性）

重要ポイント:

* `projects.counters.*` を非正規化保持（ダッシュボード高速化）
* `Decision.completeness` で不足可視化
* `mergeCandidates` + `requiresHumanApproval` で自動マージ事故を抑止
* `soft_delete` で監査・復元可能性を確保

### Agent設計（ADKワークフロー）

ワークフローは4本:

* `meeting_structurer`（抽出）
* `gap_questioner`（不足質問）
* `reply_integrator`（回答反映）
* `draft_actions_skill`（アクション素案）

設計ルール:

* DB直書き禁止（APIツール経由のみ）
* 上位N件コンテキスト（例: 10）でトークン暴走防止
* SAFE_MODEで自動確定を制限
* スキーマ検証（Pydantic/Zod）で出力整形

### 冪等性・失敗耐性

非同期ではここが最重要です。

* 冪等キー: `meetingId + checksum`, `messageId` など
* Cloud Tasks retry: exponential backoff / max attempts
* 失敗時: `AgentRun=FAILED` を必ず残す
* UI: 再実行導線を提供

### セキュリティ方針

* SecretはSecret Managerへ
* サービス間はOIDC/Service Accountで認証
* 権限は `projects/{projectId}/members/{userId}` で管理
* 本番はSSO/OIDC・監査ログ・IAM tightenへ段階移行

### 可観測性・運用

* `agent_runs` に `status/latency/tokens/error` を記録
* Cloud Loggingで横断追跡
* プロダクトKPI直結で監視
  - 決裁リードタイム
  - 未決滞留数
  - 決裁者未設定率
  - 期限超過率

---

## ローカル検証（再現手順）

ローカルでは以下4プロセスを同時起動します。

* Firestore Emulator
* API（`localhost:3001`）
* Agent（`localhost:8081`）
* Web（`localhost:3000`）

手順は `docs/local/README.md` に集約しています。  
`DISABLE_CLOUD_TASKS=true` の場合も、Agentタスクを直接叩いて連携検証できます。

---

## デモシナリオ（審査で強い“再生可能”な流れ）

デモは次の順で見せます。

1. PJを作成
2. 会議メモを貼り付けて登録
3. 数秒後、決裁候補がボードに出る
4. 不足質問（QUESTION_SET）がチャットに出る
5. 回答（ANSWER_SET）すると決裁が整い、readyが上がる
6. 会議詳細内のアジェンダ素案とアクションが更新される

成功判定が目で見えるように、

* `Meeting.status` が `DONE` に変わる
* `completeness/ready` が閾値を超える
* `NEEDS_INFO -> READY_TO_DECIDE` の状態遷移が見える

---

## OSS公開と事業化の話（「公開したら終わり？」への答え）

ハッカソンで GitHub 公開前提だと「同じものを作られる」懸念があります。  
でも、実務の世界では“作れる”より“運用できる”が価値になります。

事業化の余地は主にここです。

* 入力コネクタ（Notion/tldv/Slack/CRM）
* セキュリティ（SSO/IAP/監査ログ）
* 組織運用テンプレ（部署・業界別の決裁設計）
* 導入支援（既存運用のリファクタリング）

つまりコア概念は公開できても、**運用の勝ちパターン**は簡単に複製できません。  
キメボードは、その“運用”まで含めて価値が伸びる設計にしています。

---

## まとめ

会議が増える原因は、決裁が見えないことです。  
キメボードは議事録を決裁に変換し、不足を質問で埋め、アクションまでつなぎます。

「次の会議を減らす」ための道具として、社内PJの意思決定を前進させます。

---

## 補足（仕様・設計資料）

今回、仕様がブレないように以下を用意しています（共有可能な形式）。

* `specs/core/mvp.yaml`：MVP仕様（ドメイン/状態）
* `specs/core/web.yaml`：画面仕様（S1-S9/UIルール）
* `specs/core/api.yaml`：API・Agent契約
* `specs/core/firestore-collection.yaml`：Firestoreスキーマ
* `specs/core/agent.yaml`：Agent構成とワークフロー
* `specs/core/spec-impl-map.yaml`：仕様と実装の対応
* `docs/doc/architecture.html`：構成図
* `docs/doc/slide.html`：説明スライド
* `docs/doc/color.html`：カラーパレット
* `docs/local/README.md`：ローカル検証手順

リポジトリURLは公開時に追記し、スクリーンショットは `docs/doc/` 配下に集約予定です。
