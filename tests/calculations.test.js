const test = require("node:test");
const assert = require("node:assert/strict");
const {
    calculateCashableDeltaYen,
    calculatePlayFinancials,
    calculateAssetPreview
} = require("../lib/calculations.js");

test("貸出46・交換52・最小景品500円の現行結果を維持する", () => {
    assert.deepEqual(calculatePlayFinancials({
        startMedal:3000, endMedal:3500, cashInvestment:4000,
        rental:46, exchange:52, prizeUnit:500
    }), {
        medalDelta:500,
        cashLentMedal:184,
        cashableDeltaYen:9500,
        profit:5500
    });
});

test("貸出50・交換56の現行結果を維持する", () => {
    assert.deepEqual(calculatePlayFinancials({
        startMedal:1000, endMedal:1560, cashInvestment:2000,
        rental:50, exchange:56, prizeUnit:500
    }), {
        medalDelta:560,
        cashLentMedal:100,
        cashableDeltaYen:10000,
        profit:8000
    });
});

test("等価交換・投資0・勝ちを維持する", () => {
    assert.equal(calculatePlayFinancials({
        startMedal:0, endMedal:500, cashInvestment:0,
        rental:50, exchange:50, prizeUnit:1000
    }).profit, 10000);
});

test("回収0・負けを維持する", () => {
    assert.equal(calculatePlayFinancials({
        startMedal:3000, endMedal:3000, cashInvestment:10000,
        rental:46, exchange:52, prizeUnit:500
    }).profit, -10000);
});

test("最小景品200・500・1000円の切り捨てを維持する", () => {
    assert.equal(calculateCashableDeltaYen(500, 52, 200), 9600);
    assert.equal(calculateCashableDeltaYen(500, 52, 500), 9500);
    assert.equal(calculateCashableDeltaYen(500, 52, 1000), 9000);
});

test("マイナス差分の符号付き切り捨てを維持する", () => {
    assert.equal(calculateCashableDeltaYen(-500, 52, 500), -9500);
});

test("再プレイ上限と期待値は現行収支式へ混入しない", () => {
    const base = {
        startMedal:3000, endMedal:3200, cashInvestment:4000,
        rental:46, exchange:52, prizeUnit:500
    };
    const unlimited = calculatePlayFinancials({ ...base, replayLimit:null, expected:null });
    const limited = calculatePlayFinancials({ ...base, replayLimit:460, expected:5000 });
    assert.deepEqual(limited, unlimited);
});

test("店舗資産の景品単位計算を維持する", () => {
    assert.deepEqual(calculateAssetPreview(3517, 52, 500), {
        cashableYen:67500,
        unitMedals:26
    });
});
