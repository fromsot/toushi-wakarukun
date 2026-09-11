(function(global){
    "use strict";

    // index.htmlのアプリ状態(records/shops/DOM)に依存しない、純粋な汎用ユーティリティ関数群。
    // ブラウザではグローバル関数として、Node(テスト)ではCommonJSモジュールとして利用できる。

    function toNumber(value){
        return Number(value) || 0;
    }

    function escapeHtml(value){
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function safeHttpUrl(value){
        try{
            const url = new URL(value);
            return ["http:", "https:"].includes(url.protocol) ? url.href : "";
        }catch{
            return "";
        }
    }

    function userErrorMessage(error, fallback = "処理を完了できませんでした。時間をおいて再度お試しください。", isOnline = global.navigator?.onLine !== false){
        if(!isOnline) return "オフラインです。通信環境を確認して再度お試しください。";
        const message = String(error?.message || "").toLowerCase();
        if(message.includes("failed to fetch") || message.includes("network") || message.includes("timeout")){
            return "通信に失敗しました。接続を確認して再度お試しください。";
        }
        if(message.includes("jwt") || message.includes("session") || message.includes("not authenticated")){
            return "ログイン状態を確認できませんでした。再ログインしてください。";
        }
        return fallback;
    }

    function formatSigned(value){
        const number = Number(value) || 0;
        return `${number > 0 ? "+" : number === 0 ? "±" : ""}${number.toLocaleString()}`;
    }

    function trendMoney(value){
        const rounded = Math.round(Number(value) || 0);
        return `${rounded > 0 ? "+" : ""}${rounded.toLocaleString()}円`;
    }

    function getLocalDateString(date = new Date()){
        return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2,'0') + '-' +
        String(date.getDate()).padStart(2,'0');
    }

    function normalizeDateString(value){
        if(!value){
            return '';
        }

        const date = new Date(value);

        if(!isNaN(date.getTime())){
            return getLocalDateString(date);
        }

        return String(value).slice(0,10);
    }

    function normalizeShopSearchText(value){
        return String(value || "")
            .normalize("NFKC")
            .toLocaleLowerCase("ja")
            .replace(/\s+/g, "");
    }

    function confirmationLabel(value){
        return ({
            none:"なし",
            setting_6:"6確",
            setting_5_6:"56確",
            setting_4_5_6:"456確",
            setting_3_plus:"3以上",
            setting_2_plus:"2以上",
            high_setting_behavior:"高設定挙動",
            other:"その他"
        })[value] || "なし";
    }

    const api = {
        toNumber,
        escapeHtml,
        safeHttpUrl,
        userErrorMessage,
        formatSigned,
        trendMoney,
        getLocalDateString,
        normalizeDateString,
        normalizeShopSearchText,
        confirmationLabel
    };

    Object.assign(global, api);
    if(typeof module !== "undefined" && module.exports){
        module.exports = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : window);
