const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { mapLegacyRecordForSupabase } = require("../lib/legacy-migration.js");

const fixture = JSON.parse(fs.readFileSync(
    path.join(__dirname, "fixtures", "legacy-records.json"),
    "utf8"
));

test("旧recordsを欠落・重複なしでSupabase形式へ変換する", () => {
    const rows = fixture.records.map(record =>
        mapLegacyRecordForSupabase(record, fixture.shops, fixture.userId)
    );
    assert.equal(rows.length, fixture.records.length);
    assert.deepEqual(rows.map(row => row.shop_id), [10, 20]);
    assert.deepEqual(rows.map(row => row.record_version), [1, 1]);
    assert.equal(rows.reduce((sum, row) => sum + row.cash_investment, 0), 14000);
    assert.equal(rows.reduce((sum, row) => sum + row.cashable_delta_yen, 0), 9500);
    assert.equal(rows.reduce((sum, row) => sum + row.profit, 0), -4500);
    assert.deepEqual(rows.map(row => row.expected), [3000, null]);
    assert.deepEqual(rows.map(row => row.legacy_payload), fixture.records);
});

test("未登録店舗の旧履歴も削除せずスナップショットを維持する", () => {
    const legacy = { date:"2026-08-03", shop:"未登録店", machine:"北斗", profit:1000 };
    const row = mapLegacyRecordForSupabase(legacy, fixture.shops, fixture.userId);
    assert.equal(row.shop_id, null);
    assert.equal(row.shop_name_snapshot, "未登録店");
    assert.deepEqual(row.legacy_payload, legacy);
});
