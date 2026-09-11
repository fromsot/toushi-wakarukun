# 収支ワカールくん

店舗・貯メダル・稼働履歴・収支分析を管理する静的PWAです。画面は既存の`index.html`を維持し、認証とユーザーデータ保存にはSupabaseを使用します。

## システム設計資料

SQL、Supabase、公開サーバー、PWA、業務プロセスのつながりは、[`docs/architecture/README.md`](docs/architecture/README.md)から確認できます。人・AI共通の確認資料としてExcel版も同じディレクトリで管理します。

## ローカル起動

1. `.env.example`を参考に`.env.local`を作成します。
2. `npm run config`でローカル用`config.js`を生成します。
3. 静的HTTPサーバーでプロジェクトルートを配信します。

`file://`で直接確認する場合も、先に`npm run config`を実行してください。

## 品質確認

```sh
npm run check
```

このコマンドは静的lint、現行計算ロジックの回帰テスト、旧localStorage履歴の変換テスト、production buildを順番に実行します。生成物は`dist/`です。

## Vercel

Vercelには次の環境変数をProductionとPreviewへ設定します。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

これらはブラウザで使う公開設定であり、service role keyなどの秘密鍵は絶対に設定・配信しません。build commandは`npm run build`、output directoryは`dist`です。

## Cloudflare Pages / セキュリティヘッダー

VercelとCloudflare Pagesの両方にデプロイするため、CSPなどのセキュリティヘッダーは`scripts/security-headers.mjs`を単一の定義元にしています。

- Cloudflare Pages向けの`_headers`は`npm run build`実行時に`dist/_headers`として自動生成されます(リポジトリ直下に手書きの`_headers`は置きません)。
- Vercel向けの`vercel.json`はVercelがビルド前に読み込む静的ファイルのため自動生成できず、手動で保守します。その代わり`npm run check-headers`(`npm run check`に含まれます)が`vercel.json`の`headers`と`security-headers.mjs`の定義がズレていないかをCIで検証します。

ヘッダーを変更するときは`scripts/security-headers.mjs`を直し、`vercel.json`の`headers`を同じ内容に手で合わせてから`npm run check-headers`を実行してください。

## Supabaseと既存データ

DB変更は`supabase/migrations/`だけで管理します。現在の正本は`shops`、`play_records`、`medal_transactions`等です。旧`localStorage`の`records`は、ユーザー単位の完了フラグを使って既存の`play_records`へ一度だけ移行されます。カウンターと稼働中バックアップの既存キーも維持されています。

新しいmigrationを適用する前に、必ず以下を確認してください。

```sh
npx supabase migration list
npx supabase db push --dry-run
```

## PWA

`manifest.webmanifest`、`service-worker.js`、既存アイコンを使用します。アプリシェルへ構成ファイルと分離した計算・移行モジュールも含め、オフライン再起動時に不足しないようにしています。
