(function(global){
    "use strict";

    function calculateCashableDeltaYen(medalDelta, exchange, prizeUnit){
        if(!exchange || exchange <= 0 || !prizeUnit || prizeUnit <= 0){
            return 0;
        }

        const direction = Math.sign(medalDelta);
        const absoluteValue = Math.abs(medalDelta) / exchange * 1000;
        return direction * Math.floor(absoluteValue / prizeUnit) * prizeUnit;
    }

    function calculatePlayFinancials({
        startMedal,
        endMedal,
        cashInvestment,
        rental,
        exchange,
        prizeUnit
    }){
        const medalDelta = endMedal - startMedal;
        const cashLentMedal = cashInvestment / 1000 * rental;
        const cashableDeltaYen = calculateCashableDeltaYen(
            medalDelta,
            exchange,
            prizeUnit
        );
        const profit = cashableDeltaYen - cashInvestment;

        return { medalDelta, cashLentMedal, cashableDeltaYen, profit };
    }

    function calculateAssetPreview(medal, exchange, prizeUnit){
        const unitMedals = Math.ceil(exchange * prizeUnit / 1000);
        const blocks = unitMedals > 0
            ? Math.floor(Math.max(medal, 0) / unitMedals)
            : 0;
        return { cashableYen: blocks * prizeUnit, unitMedals };
    }

    const api = {
        calculateCashableDeltaYen,
        calculatePlayFinancials,
        calculateAssetPreview
    };

    Object.assign(global, api);
    if(typeof module !== "undefined" && module.exports){
        module.exports = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : window);
