import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePublicConfig, serializePublicConfig } from "./env.mjs";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = resolvePublicConfig(projectDir);
fs.writeFileSync(path.join(projectDir, "config.js"), serializePublicConfig(config));
console.log("config.js generated");
