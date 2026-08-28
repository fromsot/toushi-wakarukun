import fs from "node:fs";
import path from "node:path";

export function readLocalEnv(projectDir){
    const file = path.join(projectDir, ".env.local");
    if(!fs.existsSync(file)) return {};
    return Object.fromEntries(fs.readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith("#") && line.includes("="))
        .map(line => {
            const separator = line.indexOf("=");
            return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
        }));
}

export function resolvePublicConfig(projectDir){
    const local = readLocalEnv(projectDir);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || local.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(!supabaseUrl || !supabaseAnonKey){
        throw new Error("NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。");
    }
    return { supabaseUrl, supabaseAnonKey };
}

export function serializePublicConfig(config){
    return `window.__APP_CONFIG__ = Object.freeze(${JSON.stringify(config, null, 2)});\n`;
}
