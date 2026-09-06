// vercel.json はVercelがビルド前に読む静的ファイルのため自動生成できない。
// そのため scripts/security-headers.mjs (単一の定義元) と手動保守の vercel.json が
// ズレていないかをここで検証する。ズレていればCIを落として気づけるようにする。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildVercelHeadersConfig } from "./security-headers.mjs";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vercelConfig = JSON.parse(fs.readFileSync(path.join(projectDir, "vercel.json"), "utf8"));

const expected = buildVercelHeadersConfig();
const actual = vercelConfig.headers;

if(JSON.stringify(actual) !== JSON.stringify(expected)){
    console.error("vercel.json の headers が scripts/security-headers.mjs の定義とズレています。");
    console.error("期待値:\n" + JSON.stringify(expected, null, 2));
    console.error("実際の値:\n" + JSON.stringify(actual, null, 2));
    process.exit(1);
}

console.log("vercel.json のヘッダー設定は security-headers.mjs と一致しています");
