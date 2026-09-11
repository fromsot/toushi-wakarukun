# 収支ワカールくん システム設計資料

このディレクトリは、アプリの構成、SQL、サーバ接続、データ保存先、業務プロセスを共有するための設計資料置き場です。

## ファイル

- `収支ワカールくん_システム設計資料.xlsx`
  - 人とAIが確認・編集できるExcel版の設計資料
  - システム概要、サーバ接続、SQL関連、テーブル定義、RPC、業務フロー、保存先、公開運用、migrationを収録

## 正本の優先順位

設計内容に差異がある場合は、次の順で現在の実装を判断します。

1. `supabase/migrations/*.sql`
2. `index.html`、`lib/*.js`、`service-worker.js`
3. `scripts/*.mjs`、`vercel.json`、`.github/workflows/*.yml`
4. このディレクトリのExcel資料

Excelは実装を説明する資料です。Excelだけを先に変更して、実装済みとして扱わないでください。

## AIが更新するときの手順

1. Gitの現在ブランチと未コミット変更を確認する
2. 上記の正本ファイルを読む
3. Supabase変更は既存migrationと実DBの状態を確認する
4. Excel内の該当シートだけを更新する
5. シートの文字切れ、数式エラー、参照エラーを確認する
6. Excelの「根拠」シートも必要に応じて更新する
7. コード変更を伴う場合は `npm run check` を実行する
8. Git差分で、意図しないファイルが変更されていないことを確認する

## 更新が必要になる主な変更

- テーブル、カラム、foreign key、RLS、indexの変更
- RPC、function、trigger、viewの追加・変更
- localStorage keyやデータ正本の変更
- Cloudflare Pages、Vercel、Supabaseの接続変更
- 認証、店舗登録、稼働終了、残高修正、換金、削除フローの変更
- Service Worker、PWAキャッシュ、CI、build方法の変更
- Coming Soon機能の公開・停止

## 更新時の注意

- 既存データを削除しない
- 破壊的SQLを無断で実行しない
- RLSの `auth.uid() = user_id` 境界を維持する
- 過去稼働の店舗条件snapshotを最新店舗設定で上書きしない
- 貯メダル残高と `medal_transactions` の整合性を維持する
- localStorage互換データを不用意に削除しない

