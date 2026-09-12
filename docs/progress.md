# Progress

最終更新: 2026-09-12
現在フェーズ: 公開後の安定化・小規模ユーザーテスト準備

## 実装済み・確認済み
- 店舗、貯メダル、稼働履歴、収支分析を扱う静的PWA。
- Supabase Auth / データ保存連携。
- PWA構成（manifest / service worker / icons）。
- Supabase migration管理。
- GitHub Actionsによる品質確認基盤。
- `npm run check`でlint・テスト・セキュリティヘッダー整合・production buildを確認する構成。
- 2026-09-12作業レポート時点でlint、テスト32件、セキュリティヘッダー整合、本番build成功。
- 思い出機能はコードとDB/Storage構成を残しつつ、公開入口をComing Soonとして停止中。

## 作業中
- 公開環境での実機動作確認と小規模テスト準備。

## 未実装・未完了
- 思い出機能のiPhone実機HEIC/JPEG検証、画像軽量化、失敗時の再試行・ロールバック確認。
- テストユーザー募集、簡易操作説明、不具合・感想受付導線。

## 公開状況
- デプロイ可能な構成は確認済み。
- GitHub上のREADMEからVercel / Cloudflare Pages向け構成は確認できる。
- 本ファイル作成時点で、GitHubコードだけから現在の本番URLと稼働中デプロイ先を一意に確定できないため公開URLは「確認不能」とする。

## 次に行うこと
1. 本番URLをRepository内に明記して正本化する。
2. iPhone / Androidで新規登録から収支記録まで確認する。
3. 5〜10人程度の小規模テストを実施する。
4. 思い出機能の再公開条件を満たす。