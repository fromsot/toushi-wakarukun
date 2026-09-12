# AI_WORKFLOW

最終更新: 2026-09-12

このRepositoryをChatGPT / Codex / Claude Code / Claude Code Windowsから扱うための共通ルールです。GitHub上の`main`をコードと開発進捗の正本とします。

## 作業開始
1. `git status`
2. `git fetch origin`
3. `git branch --show-current`
4. `git log -1 --oneline origin/main`
5. `git pull --ff-only origin main`（mainで作業する場合）
6. `README.md`を確認
7. `docs/progress.md`を確認
8. `docs/backlog.md`を確認
9. `docs/decisions.md`を確認
10. 他AIと同じファイルを同時編集していないか確認

## 開発ルール
- 不要な大規模リファクタリングを行わない。
- 既存仕様を勝手に変更しない。
- Secret、API Key、Token、Password、`.env`の値を出力・commitしない。
- DBの破壊操作（DROP/TRUNCATE/無条件DELETE等）を行わない。
- 本番環境への直接変更を避ける。
- Supabase migrationはdry-run/差分確認を優先する。
- `main`へ複数AIが同時に直接変更しない。

## 並行開発
作業単位でbranchを分ける。

- `feature/<task>-codex`
- `feature/<task>-claude`
- `fix/<task>-codex`
- `fix/<task>-claude`

同じファイルを複数AIが同時に編集しない。別AIが作業開始する前に`git fetch`し、最新GitHubを取得する。

## 作業終了
1. build
2. test / lint / project固有check
3. `git diff`確認
4. `docs/progress.md`更新
5. `docs/backlog.md`更新
6. 重要判断があれば`docs/decisions.md`更新
7. commit
8. push
9. Repository / branch / commit SHA / test結果 / 未完了事項を報告

このRepositoryでは品質確認の基本コマンドとして`npm run check`を優先する。