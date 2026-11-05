// C / JJY: 매매 검증·자산 계산 작성 예정.
// 파일 자리만 준비하며 함수·초기 데이터·계산 코드는 아직 구현하지 않는다.
sap.ui.define([], function () {
    "use strict";

    const FEE_RATE = 0.003; // 0.3%의 수수료를 떼기로함.

    function calculateFee(amount) {
        return Math.ceil(amount * FEE_RATE); //수수료 계산하는거
    }

    function validateOrder(stock, qty) {
        if (!stock || typeof stock.price !== "number") {
            return "종목 정보가 올바르지 않습니다.";
        }

        if (!Number.isFinite(stock.price) || stock.price <= 0) {//isFinite() 를 사용하면 NaN, Infinity 등은 걸러짐.
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
            /**
             * 매수가 가능하면 성공 결과를 반환합니다.
             * success: true : 매수 성공
             * nextCash : 현재 현금에서 총 비용 차감
             * nextQuantity : 현재 주식 수량에 매수 수량 추가
             * gross : 주식 거래금액
             * fee : 수수료
             * 근데 Trade.js가 여기서 실제 모델(JSON 모델)의 현금을 변경하지는 않는다는 것임.
             * ---> 변경해야 할 금액과 수량을 계산해서 Market.controller.js에 전달함. 실제 setProperty()는 컨트롤러에서 실행함.
             */
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
        },

        calculateAssets: function (cash, stocks) {
            const stockValue = stocks.reduce((sum, stock) => {
                return sum + stock.price * stock.quantity;
            }, 0);

            return cash + stockValue;
        }

    };
});