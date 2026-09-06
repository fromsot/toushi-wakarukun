// トレンド分析タブ(稼働傾向・確定示唆の集計)向けの、純粋な集計・文字列生成ロジック。
// records/shopsなどのアプリ状態やDOMには一切触れない。
//
// index.htmlより先に lib/utils.js を読み込む必要がある(escapeHtml/trendMoneyに依存するため)。
// この依存はブラウザの<script>タグの読み込み順と、Node側ではrequireの順序で解決する
// (lib/utils.jsの読み込みでglobalThisにescapeHtml/trendMoneyが生えるため)。
(function(global){
    "use strict";

    const TREND_MIN_SAMPLE = 3;
    const TREND_STRONG_SAMPLE = 10;

    const CONFIRMATION_CATEGORIES = [
        { key:"setting_6", label:"6確", className:"setting-6" },
        { key:"setting_5_6", label:"56確", className:"setting-56" },
        { key:"setting_4_5_6", label:"456確", className:"setting-456" },
        { key:"setting_3_plus", label:"3以上", className:"setting-3" },
        { key:"setting_2_plus", label:"2以上", className:"setting-2" },
        { key:"high_setting_behavior", label:"高設定挙動", className:"high-behavior" },
        { key:"other", label:"その他", className:"other" }
    ];

    function emptyConfirmationCounts(){
        return Object.fromEntries(CONFIRMATION_CATEGORIES.map(category => [category.key, 0]));
    }

    function trendSampleLevel(count){
        if(count < TREND_MIN_SAMPLE) return { key:"insufficient", label:"サンプル不足" };
        if(count < TREND_STRONG_SAMPLE) return { key:"reference", label:"参考傾向" };
        return { key:"trend", label:"傾向" };
    }

    function trendPeriodStart(period, now = new Date()){
        if(period === "all") return null;
        if(period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
        const months = { "3months":3, "6months":6, year:12 }[period];
        return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    }

    function trendConfirmationCounts(sourceRecords){
        const counts = emptyConfirmationCounts();
        sourceRecords.forEach(record => {
            if(Object.hasOwn(counts, record.confirmationType)) counts[record.confirmationType] += 1;
        });
        return counts;
    }

    function calculateTrendMetrics(sourceRecords){
        const plays = sourceRecords.length;
        const wins = sourceRecords.filter(record => record.profit > 0).length;
        const losses = sourceRecords.filter(record => record.profit < 0).length;
        const draws = plays - wins - losses;
        const decided = wins + losses;
        const totalProfit = sourceRecords.reduce((sum, record) => sum + Number(record.profit || 0), 0);
        const totalInvestment = sourceRecords.reduce((sum, record) => sum + Number(record.cashInvestment || 0), 0);
        const hourRecords = sourceRecords.filter(record => record.hours !== null && Number.isFinite(Number(record.hours)));
        const expectedRecords = sourceRecords.filter(record => record.expected !== null && Number.isFinite(Number(record.expected)));
        const expectedTotal = expectedRecords.reduce((sum, record) => sum + Number(record.expected), 0);
        const recent = [...sourceRecords].sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0, 5);
        return {
            plays, wins, losses, draws,
            winRate: decided ? wins / decided * 100 : 0,
            totalProfit,
            averageProfit: plays ? totalProfit / plays : 0,
            averageInvestment: plays ? totalInvestment / plays : 0,
            averageHours: hourRecords.length ? hourRecords.reduce((sum, record) => sum + Number(record.hours), 0) / hourRecords.length : null,
            expectedCount: expectedRecords.length,
            expectedTotal,
            expectedAverage: expectedRecords.length ? expectedTotal / expectedRecords.length : null,
            expectedGap: expectedRecords.reduce((sum, record) => sum + Number(record.profit || 0), 0) - expectedTotal,
            recentWins:recent.filter(record => record.profit > 0).length,
            recentLosses:recent.filter(record => record.profit < 0).length,
            recentProfit:recent.reduce((sum, record) => sum + Number(record.profit || 0), 0),
            confirmations:trendConfirmationCounts(sourceRecords),
            sample:trendSampleLevel(plays)
        };
    }

    function groupTrendRecords(sourceRecords, keyResolver){
        const groups = new Map();
        sourceRecords.forEach(record => {
            const key = keyResolver(record);
            if(!key) return;
            if(!groups.has(key)) groups.set(key, []);
            groups.get(key).push(record);
        });
        return [...groups.entries()].map(([key, groupRecords]) => ({ key, records:groupRecords, metrics:calculateTrendMetrics(groupRecords) }));
    }

    function trendConfirmationHtml(counts){
        return `<div class="trend-confirmation-grid">${CONFIRMATION_CATEGORIES.slice(0, 6).map(category => `
            <div><span class="confirmation-badge ${category.className}">${category.label}</span><strong>${counts[category.key]}回</strong></div>
        `).join("")}</div>`;
    }

    function trendMetricCard(item, subtitle = ""){
        const metrics = item.metrics;
        return `<article class="trend-stat-card">
            <div class="trend-card-title"><h4>${global.escapeHtml(item.key)}</h4><span class="sample-badge ${metrics.sample.key}">${metrics.plays}件・${metrics.sample.label}</span></div>
            ${subtitle ? `<p class="trend-card-subtitle">${global.escapeHtml(subtitle)}</p>` : ""}
            <div class="trend-stat-grid">
                <div><span>成績</span><strong>${metrics.wins}勝${metrics.losses}敗${metrics.draws ? `${metrics.draws}分` : ""}</strong></div>
                <div><span>勝率</span><strong>${metrics.winRate.toFixed(1)}%</strong></div>
                <div><span>累計収支</span><strong class="${metrics.totalProfit > 0 ? "profit" : metrics.totalProfit < 0 ? "loss" : "profit-zero"}">${global.trendMoney(metrics.totalProfit)}</strong></div>
                <div><span>平均収支</span><strong>${global.trendMoney(metrics.averageProfit)}</strong></div>
                <div><span>平均投資</span><strong>${Math.round(metrics.averageInvestment).toLocaleString()}円</strong></div>
                <div><span>平均時間</span><strong>${metrics.averageHours === null ? "なし" : `${metrics.averageHours.toFixed(1)}h`}</strong></div>
                <div><span>期待値合計</span><strong>${metrics.expectedCount ? global.trendMoney(metrics.expectedTotal) : "なし"}</strong></div>
                <div><span>期待値乖離</span><strong>${metrics.expectedCount ? global.trendMoney(metrics.expectedGap) : "なし"}</strong></div>
                <div><span>直近成績</span><strong>${metrics.recentWins}勝${metrics.recentLosses}敗</strong></div>
                <div><span>直近収支</span><strong>${global.trendMoney(metrics.recentProfit)}</strong></div>
            </div>${trendConfirmationHtml(metrics.confirmations)}
        </article>`;
    }

    const api = {
        TREND_MIN_SAMPLE,
        TREND_STRONG_SAMPLE,
        CONFIRMATION_CATEGORIES,
        emptyConfirmationCounts,
        trendSampleLevel,
        trendPeriodStart,
        trendConfirmationCounts,
        calculateTrendMetrics,
        groupTrendRecords,
        trendConfirmationHtml,
        trendMetricCard
    };

    Object.assign(global, api);
    if(typeof module !== "undefined" && module.exports){
        module.exports = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : window);
