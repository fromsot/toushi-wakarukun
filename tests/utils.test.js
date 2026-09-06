const test = require("node:test");
const assert = require("node:assert/strict");
const {
    toNumber,
    escapeHtml,
    safeHttpUrl,
    formatSigned,
    trendMoney,
    getLocalDateString,
    normalizeDateString,
    normalizeShopSearchText,
    confirmationLabel
} = require("../lib/utils.js");

test("toNumberは数値化できない値を0にする", () => {
    assert.equal(toNumber("12"), 12);
    assert.equal(toNumber("abc"), 0);
    assert.equal(toNumber(null), 0);
    assert.equal(toNumber(undefined), 0);
});

test("escapeHtmlはHTML特殊文字とシングルクォートをエスケープする", () => {
    assert.equal(
        escapeHtml(`<script>alert("x")</script>&'`),
        "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#039;"
    );
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
});

test("safeHttpUrlはhttp/https以外のプロトコルを空文字にする", () => {
    assert.equal(safeHttpUrl("https://example.com/a"), "https://example.com/a");
    assert.equal(safeHttpUrl("javascript:alert(1)"), "");
    assert.equal(safeHttpUrl("not a url"), "");
});

test("formatSignedは符号付きの表示文字列を返す", () => {
    assert.equal(formatSigned(1000), "+1,000");
    assert.equal(formatSigned(-500), "-500");
    assert.equal(formatSigned(0), "±0");
});

test("trendMoneyは四捨五入して円表記にする", () => {
    assert.equal(trendMoney(1234.6), "+1,235円");
    assert.equal(trendMoney(-500), "-500円");
    assert.equal(trendMoney(0), "0円");
});

test("getLocalDateStringはローカル日付をYYYY-MM-DDで返す", () => {
    assert.equal(getLocalDateString(new Date(2026, 8, 6)), "2026-09-06");
});

test("normalizeDateStringは不正な日付文字列も先頭10文字に丸める", () => {
    assert.equal(normalizeDateString("2026-09-06T10:00:00"), "2026-09-06");
    assert.equal(normalizeDateString(""), "");
    assert.equal(normalizeDateString("not-a-date-value"), "not-a-date");
});

test("normalizeShopSearchTextは全角半角・大文字小文字・空白を正規化する", () => {
    assert.equal(normalizeShopSearchText("マルハン　渋谷"), normalizeShopSearchText("マルハン渋谷"));
    assert.equal(normalizeShopSearchText("ABC Hall"), normalizeShopSearchText("abchall"));
});

test("confirmationLabelは未知の値をなしとして扱う", () => {
    assert.equal(confirmationLabel("setting_6"), "6確");
    assert.equal(confirmationLabel("unknown"), "なし");
    assert.equal(confirmationLabel(undefined), "なし");
});
