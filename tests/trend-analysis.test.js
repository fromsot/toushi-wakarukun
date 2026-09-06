const test = require("node:test");
const assert = require("node:assert/strict");
// lib/utils.jsをlib/trend-analysis.jsより先にrequireし、
// escapeHtml/trendMoneyをglobalThisへ載せておく(本番のscriptタグ読み込み順と同じ)。
require("../lib/utils.js");
const {
    TREND_MIN_SAMPLE,
    TREND_STRONG_SAMPLE,
    CONFIRMATION_CATEGORIES,
    emptyConfirmationCounts,
    trendSampleLevel,
    trendPeriodStart,
    trendConfirmationCounts,
    calculateTrendMetrics,
    groupTrendRecords,
    trendMetricCard
} = require("../lib/trend-analysis.js");

function playRecord({ profit = 0, hours = null, expected = null, confirmationType = "none", date = "2026-01-01", cashInvestment = 0 } = {}){
    return { profit, hours, expected, confirmationType, date, cashInvestment };
}

test("emptyConfirmationCountsはCONFIRMATION_CATEGORIESの各キーを0で初期化する", () => {
    const counts = emptyConfirmationCounts();
    for(const category of CONFIRMATION_CATEGORIES){
        assert.equal(counts[category.key], 0);
    }
});

test("trendSampleLevelはTREND_MIN_SAMPLE/TREND_STRONG_SAMPLEの境界で判定する", () => {
    assert.equal(trendSampleLevel(TREND_MIN_SAMPLE - 1).key, "insufficient");
    assert.equal(trendSampleLevel(TREND_MIN_SAMPLE).key, "reference");
    assert.equal(trendSampleLevel(TREND_STRONG_SAMPLE - 1).key, "reference");
    assert.equal(trendSampleLevel(TREND_STRONG_SAMPLE).key, "trend");
});

test("trendPeriodStartは期間指定に応じた開始日を返す", () => {
    const now = new Date(2026, 8, 6);
    assert.equal(trendPeriodStart("all", now), null);
    assert.deepEqual(trendPeriodStart("month", now), new Date(2026, 8, 1));
    assert.deepEqual(trendPeriodStart("3months", now), new Date(2026, 5, 6));
    assert.deepEqual(trendPeriodStart("year", now), new Date(2025, 8, 6));
});

test("trendConfirmationCountsは既知のconfirmationTypeだけを集計する", () => {
    const counts = trendConfirmationCounts([
        playRecord({ confirmationType:"setting_6" }),
        playRecord({ confirmationType:"setting_6" }),
        playRecord({ confirmationType:"unknown_type" })
    ]);
    assert.equal(counts.setting_6, 2);
});

test("calculateTrendMetricsは件数・勝率・収支を正しく集計する", () => {
    const metrics = calculateTrendMetrics([
        playRecord({ profit:1000, cashInvestment:500 }),
        playRecord({ profit:-500, cashInvestment:500 }),
        playRecord({ profit:0, cashInvestment:500 })
    ]);
    assert.equal(metrics.plays, 3);
    assert.equal(metrics.wins, 1);
    assert.equal(metrics.losses, 1);
    assert.equal(metrics.draws, 1);
    assert.equal(metrics.winRate, 50);
    assert.equal(metrics.totalProfit, 500);
    assert.equal(metrics.averageInvestment, 500);
});

test("calculateTrendMetricsは期待値未入力の場合nullを返す", () => {
    const metrics = calculateTrendMetrics([playRecord({ profit:100 })]);
    assert.equal(metrics.expectedCount, 0);
    assert.equal(metrics.expectedAverage, null);
    assert.equal(metrics.averageHours, null);
});

test("groupTrendRecordsはキーごとにグループ化し集計する", () => {
    const groups = groupTrendRecords([
        { ...playRecord({ profit:1000 }), shop:"A店" },
        { ...playRecord({ profit:-200 }), shop:"A店" },
        { ...playRecord({ profit:300 }), shop:"B店" }
    ], record => record.shop);
    const shopA = groups.find(item => item.key === "A店");
    const shopB = groups.find(item => item.key === "B店");
    assert.equal(shopA.metrics.plays, 2);
    assert.equal(shopA.metrics.totalProfit, 800);
    assert.equal(shopB.metrics.plays, 1);
});

test("trendMetricCardはHTML特殊文字をエスケープして描画する", () => {
    const html = trendMetricCard({
        key:'<script>alert(1)</script>',
        metrics:calculateTrendMetrics([playRecord({ profit:1000 })])
    });
    assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
    assert.ok(!html.includes("<script>alert(1)</script>"));
});
