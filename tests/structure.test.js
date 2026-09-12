const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const html = fs.readFileSync("index.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
const worker = fs.readFileSync("service-worker.js", "utf8");

test("既存localStorage互換キーと移行フラグを維持する", () => {
    for(const key of [
        "records", "counterProfiles", "activeCounterProfile", "counterData",
        "recordsMigrated_", "recordsLegacyOwner", "counterLegacyOwner", "currentPlay_"
    ]) assert.ok(html.includes(key), `${key} が維持されていません`);
});

test("Supabase設定は生成configから読み込み、HTMLへ直書きしない", () => {
    assert.ok(html.includes("window.__APP_CONFIG__?.supabaseUrl"));
    assert.ok(html.includes("window.__APP_CONFIG__?.supabaseAnonKey"));
    assert.doesNotMatch(html, /https:\/\/[a-z]+\.supabase\.co/);
});

test("PWA設定と必要キャッシュを維持する", () => {
    assert.equal(manifest.display, "standalone");
    assert.ok(manifest.icons.some(icon => icon.sizes === "192x192"));
    assert.ok(manifest.icons.some(icon => icon.sizes === "512x512"));
    for(const asset of ["config.js", "lib/calculations.js", "lib/legacy-migration.js", "lib/utils.js", "lib/trend-analysis.js"]){
        assert.ok(worker.includes(asset));
    }
});

test("思い出機能はComing Soonとしてホームから起動できない", () => {
    const memoryMenu = html.match(/<div\s+class="menu-card menu-memory[\s\S]*?<\/div>\s*<\/div>/)?.[0] || "";
    assert.match(memoryMenu, /menu-card-coming-soon/);
    assert.match(memoryMenu, /aria-disabled="true"/);
    assert.match(memoryMenu, /COMING SOON/i);
    assert.doesNotMatch(memoryMenu, /onclick=/);
});
