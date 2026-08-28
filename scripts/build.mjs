import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePublicConfig, serializePublicConfig } from "./env.mjs";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(projectDir, "dist");
const files = ["index.html", "style.css", "manifest.webmanifest", "service-worker.js", "_headers"];

fs.rmSync(outputDir, { recursive:true, force:true });
fs.mkdirSync(outputDir, { recursive:true });
for(const file of files){
    fs.copyFileSync(path.join(projectDir, file), path.join(outputDir, file));
}
for(const directory of ["icons", "lib"]){
    fs.cpSync(path.join(projectDir, directory), path.join(outputDir, directory), { recursive:true });
}
fs.writeFileSync(path.join(outputDir, "config.js"), serializePublicConfig(resolvePublicConfig(projectDir)));
console.log(`Production build created: ${path.relative(projectDir, outputDir)}`);
