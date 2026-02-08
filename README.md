# /specs データ一式（Codex投入用）

このフォルダは、仕様（mvp.yaml）・仕様↔実装対応（spec-impl-map.yaml）・AI rules をまとめたものです。

## 収録ファイル
- specs/mvp.yaml
- specs/spec-impl-map.yaml
- specs/ai-rules/
  - project.yaml
  - web.yaml
  - api.yaml
  - agent.yaml
  - infra.yaml
- specs/samples/
  - meeting_structurer_succeeded.json
  - reply_integrator_succeeded.json
  - draft_actions_skill_succeeded.json
  - README.yaml（curl例・説明）

## Codexに依頼する時のおすすめ順
1) specs/mvp.yaml を最初に読ませる
2) specs/spec-impl-map.yaml で「どこを触るべきか」を固定
3) specs/ai-rules/*.yaml で暴走防止
4) specs/samples/*.json をテスト用・契約確認用に使用

## Local Development

ローカルで Frontend / API / Agent をテストする手順は `docs/local/README.md` を参照してください。

## Architecture Docs

設計図と説明スライドは `docs/doc/architecture.html` と `docs/doc/slide.html` を参照してください。

## Infra

Infra provisioning flow (component-by-component and all-in-one) is documented in `infra/README.md`.
Use `infra/scripts/glogin.ps1` before running terraform operations.
