sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "pepero/exchange/peperoexchange/logic/Trade",
    "sap/m/MessageToast"
            
], function (Controller, Trade, MessageToast) {
    "use strict";

    // B / JHJ: 화면 이동만 담당. 게임 로직은 구현 예정.
    return Controller.extend("pepero.exchange.peperoexchange.controller.Market", {
        onChallenge: function () {
            this.getOwnerComponent().getRouter().navTo("RouteChallenge");
        },
        onResult: function () {
            this.getOwnerComponent().getRouter().navTo("RouteResult");
        },
        onHome: function () {
            this.getOwnerComponent().getRouter().navTo("RouteHome");
        },
        onOpenTrade: async function () {
            if (!this._oTradeDialog) {
                this._oTradeDialog = await this.loadFragment({
                    name: "pepero.exchange.peperoexchange.fragment.Trade"
                });
            }

            this._oTradeDialog.open();
            this.onStockChange();
        },

        onCloseTrade: function () {
            if (this._oTradeDialog) {
                this._oTradeDialog.close();
            }
        },

        onStockChange: function () {
            // 선택 종목 처리
            const oSelect = this.byId("stockSelect");
            const oItem = oSelect.getSelectedItem();

            if (!oItem) {
                return;
            }

            const oStock = oItem.getBindingContext("game").getObject();

            this.byId("currentPriceText")
                .setText("현재가: " + oStock.price.toLocaleString() + " PPR");

            this.byId("holdingText")
                .setText("보유수량: " + oStock.quantity + "주");

            this.onQuantityChange();
        },

        onQuantityChange: function () {
            // 수량/예상금액 처리
            const oSelect = this.byId("stockSelect");
            const oItem = oSelect.getSelectedItem();

            if (!oItem) {
                return;
            }

            const oStock = oItem.getBindingContext("game").getObject();

            const iQty = Number(
                this.byId("qtyInput").getValue()
            ) || 0;

            const iAmount = oStock.price * iQty;
            const iFee = iAmount > 0
                ? Math.ceil(iAmount * 0.003)
                : 0;

            this.byId("expectedAmountText")
                .setText("예상 거래금액: " + iAmount.toLocaleString() + " PPR");

            this.byId("feeText")
                .setText("수수료: " + iFee.toLocaleString() + " PPR");
        },

        onBuy: function () {
            // Trade.js 호출 예정
            const oGameModel = this.getOwnerComponent().getModel("game");

            const oSelect = this.byId("stockSelect");
            const oItem = oSelect.getSelectedItem();

            if (!oItem) {
                return;
            }

            const oContext = oItem.getBindingContext("game");
            const oStock = oContext.getObject();

            const iQty = Number(
                this.byId("qtyInput").getValue()
            );

            const iCash = oGameModel.getProperty("/cash");

            const oResult = Trade.buy(iCash, oStock, iQty);

            if (!oResult.success) {
                MessageToast.show(oResult.message);
                return;
            }

            oGameModel.setProperty("/cash", oResult.nextCash);
            oGameModel.setProperty(
                oContext.getPath() + "/quantity",
                oResult.nextQuantity
            );

            this.onStockChange();
        },

        onSell: function () {
            // Trade.js 호출 예정
            const oGameModel = this.getOwnerComponent().getModel("game");

            const oSelect = this.byId("stockSelect");
            const oItem = oSelect.getSelectedItem();

            if (!oItem) {
                return;
            }

            const oContext = oItem.getBindingContext("game");
            const oStock = oContext.getObject();

            const iQty = Number(
                this.byId("qtyInput").getValue()
            );

            const iCash = oGameModel.getProperty("/cash");

            const oResult = Trade.sell(iCash, oStock, iQty);

            if (!oResult.success) {
                MessageToast.show(oResult.message);
                return;
            }

            oGameModel.setProperty("/cash", oResult.nextCash);
            oGameModel.setProperty(
                oContext.getPath() + "/quantity",
                oResult.nextQuantity
            );

            this.onStockChange();
        }
        
    });
});
