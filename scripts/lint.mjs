import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");
const failures = [];

for(const file of ["service-worker.js", "lib/calculations.js", "lib/legacy-migration.js"]){
    try{ new vm.Script(fs.readFileSync(path.join(projectDir, file), "utf8"), { filename:file }); }
    catch(error){ failures.push(error.message); }
}

for(const [index, match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries()){
    if(!match[1].trim()) continue;
    try{ new vm.Script(match[1], { filename:`index.html:inline-${index + 1}` }); }
    catch(error){ failures.push(error.message); }
}

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if(duplicateIds.length) failures.push(`重複ID: ${duplicateIds.join(", ")}`);

for(const asset of ["style.css", "config.js", "lib/calculations.js", "lib/legacy-migration.js", "manifest.webmanifest", "service-worker.js"]){
    if(!html.includes(asset)) failures.push(`参照不足: ${asset}`);
}

if(/const SUPABASE_(?:URL|KEY)\s*=\s*["']/.test(html)){
    failures.push("Supabase接続情報がindex.htmlへ直書きされています");
}

if(failures.length){
    console.error(failures.join("\n"));
    process.exit(1);
}
console.log("Static lint passed");
