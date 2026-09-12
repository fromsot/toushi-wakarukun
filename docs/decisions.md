# Decisions

最終更新: 2026-09-12

## 2026-09-12 - GitHubを開発情報の正本とする

ChatGPT / Codex / Claude Code / Claude Code Windowsを併用するため、コード・実装状態・開発進捗はGitHubの`main`を正本とする。

理由: AIやPCごとのローカル状態の食い違いを防ぐため。

## 2026-09-12 - 思い出機能はComing Soonを維持する

高解像度画像、HEIC互換性、ブラウザ上の圧縮時メモリ消費について実機検証が完了するまで、思い出機能の公開入口を停止する。

再公開条件: iPhone実機でのHEIC/JPEG検証、画像軽量化、通信失敗時の再試行、途中失敗時のロールバック確認が完了すること。

## 既存方針
- DB変更は`supabase/migrations/`で管理する。
- Secretやservice role keyをブラウザへ配信・Gitへ保存しない。
- セキュリティヘッダーの定義は既存のRepository方針に従う。