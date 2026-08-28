(function(global){
    "use strict";

    function legacyNumber(value){
        return Number(value) || 0;
    }

    function mapLegacyRecordForSupabase(record, shops, userId){
        const matchedShop = shops.find(shop => shop.name === record.shop);
        return {
            user_id:userId,
            shop_id:matchedShop?.id || null,
            shop_name_snapshot:String(record.shop || "未登録店舗"),
            played_on:record.date,
            machine:String(record.machine || ""),
            record_version:1,
            cash_investment:legacyNumber(record.cashInvestment),
            cashable_delta_yen:legacyNumber(record.payoutYen),
            profit:legacyNumber(record.profit),
            hours:legacyNumber(record.hours),
            expected:record.expected ?? null,
            legacy_payload:record
        };
    }

    const api = { mapLegacyRecordForSupabase };
    Object.assign(global, api);
    if(typeof module !== "undefined" && module.exports){
        module.exports = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : window);
