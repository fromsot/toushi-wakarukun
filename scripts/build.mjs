import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePublicConfig, serializePublicConfig } from "./env.mjs";
import { buildCloudflareHeadersFile } from "./security-headers.mjs";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(projectDir, "dist");
const files = ["index.html", "style.css", "manifest.webmanifest", "service-worker.js"];

fs.rmSync(outputDir, { recursive:true, force:true });
fs.mkdirSync(outputDir, { recursive:true });
for(const file of files){
    fs.copyFileSync(path.join(projectDir, file), path.join(outputDir, file));
}
for(const directory of ["icons", "lib"]){
    fs.cpSync(path.join(projectDir, directory), path.join(outputDir, directory), { recursive:true });
}
fs.writeFileSync(path.join(outputDir, "config.js"), serializePublicConfig(resolvePublicConfig(projectDir)));
// Cloudflare Pages向けの_headersはscripts/security-headers.mjsから生成する。
// Vercel向けのvercel.jsonは(Vercelがビルド前に読むため)手動保守のままとし、
// scripts/check-vercel-headers.mjsでこの定義元とのズレをCIで検知する。
fs.writeFileSync(path.join(outputDir, "_headers"), buildCloudflareHeadersFile());
console.log(`Production build created: ${path.relative(projectDir, outputDir)}`);
