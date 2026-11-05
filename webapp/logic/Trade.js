// C / JJY: 매매 검증·자산 계산 작성 예정.
// 파일 자리만 준비하며 함수·초기 데이터·계산 코드는 아직 구현하지 않는다.
sap.ui.define([], function () {
    "use strict";

    const FEE_RATE = 0.003; // 0.3%

    function calculateFee(amount) {
        return Math.ceil(amount * FEE_RATE);
    }

    function validateOrder(stock, qty) {
        if (!stock || typeof stock.price !== "number") {
            return "종목 정보가 올바르지 않습니다.";
        }

        if (!Number.isFinite(stock.price) || stock.price <= 0) {
            return "종목 가격이 올바르지 않습니다.";
        }

        if (!Number.isInteger(qty) || qty <= 0) {
            return "수량은 1 이상의 정수여야 합니다.";
        }

        return null;
    }

    return {

        buy: function (cash, stock, qty) {
            const sError = validateOrder(stock, qty);

            if (sError) {
                return {
                    success: false,
                    message: sError
                };
            }

            if (!Number.isInteger(stock.quantity) || stock.quantity < 0) {
                return {
                    success: false,
                    message: "보유 수량 정보가 올바르지 않습니다."
                };
            }

            if (!Number.isFinite(cash) || cash < 0) {
                return {
                    success: false,
                    message: "보유 현금 정보가 올바르지 않습니다."
                };
            }

            const gross = stock.price * qty;
            const fee = calculateFee(gross);
            const totalCost = gross + fee;

            if (cash < totalCost) {
                return {
                    success: false,
                    message: "보유 현금이 부족합니다."
                };
            }

            return {
                success: true,
                nextCash: cash - totalCost,
                nextQuantity: stock.quantity + qty,
                gross: gross,
                fee: fee
            };
        },

        sell: function (cash, stock, qty) {
            const sError = validateOrder(stock, qty);

            if (sError) {
                return {
                    success: false,
                    message: sError
                };
            }

            if (!Number.isFinite(cash) || cash < 0) {
                return {
                    success: false,
                    message: "보유 현금 정보가 올바르지 않습니다."
                };
            }

            if (!Number.isInteger(stock.quantity) || stock.quantity < 0) {
                return {
                    success: false,
                    message: "보유 수량 정보가 올바르지 않습니다."
                };
            }

            if (stock.quantity < qty) {
                return {
                    success: false,
                    message: "보유 수량이 부족합니다."
                };
            }

            const gross = stock.price * qty;
            const fee = calculateFee(gross);
            const netAmount = gross - fee;

            return {
                success: true,
                nextCash: cash + netAmount,
                nextQuantity: stock.quantity - qty,
                gross: gross,
                fee: fee
            };
        }

    };
});