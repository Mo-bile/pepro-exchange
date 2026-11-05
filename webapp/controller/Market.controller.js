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
                    name: "pepero.exchange.peperoexchange.fragment.Trade" //Trade.fragment.xml의 거래창을 불러와
                });
            }

            this._oTradeDialog.open();//저장된 거래창을 화면에 띄웁니다. open()은 UI5가 제공하는 기능임
            this.onStockChange();//같은 컨트롤러에 있는 onStockChange() 함수를 실행. 거래창에 선택된 종목의 가격과 보유 수량을 표시하기 위해서
        },

        onCloseTrade: function () {
            if (this._oTradeDialog) {
                this._oTradeDialog.close(); //거래창을 닫습니다
            }
        },

        onStockChange: function () {
            // 선택 종목 처리
            const oSelect = this.byId("stockSelect"); //: XML 화면에서 id="stockSelect"인 요소를 찾기.
            const oItem = oSelect.getSelectedItem(); //선택창 안에서 사용자가 현재 마우스로 클릭한게 어디에 임시 저장되잇고. 이게 실행되면 그 저장된 곳에서 가져옴.

            if (!oItem) {
                return;
            }

            const oStock = oItem.getBindingContext("game").getObject();
            /**
             * oItem : 현재 선택한 주식 항목
             * getBindingContext("game") : 그 항목과 연결된 game 모델의 데이터 위치를 가져옴.
             * getObject() : 그 위치에 들어 있는 실제 데이터를 가져옵니다.
             * oStock.name  .. 이렇게 사용할 수 있음.
             */

            this.byId("currentPriceText")
                .setText("현재가: " + oStock.price.toLocaleString() + " PPR");

            this.byId("holdingText")
                .setText("보유수량: " + oStock.quantity + "주");

            this.onQuantityChange();
        },

        onQuantityChange: function () {
            // 수량/예상금액 처리
            const oSelect = this.byId("stockSelect"); //: XML 화면에서 id="stockSelect"인 요소를 찾기.
            const oItem = oSelect.getSelectedItem();  //사용자가 선택한 아이템 가져옴

            if (!oItem) {
                return;
            }

            const oStock = oItem.getBindingContext("game").getObject(); //getObject() : 그 위치에 들어 있는 실제 데이터를 가져옴. oStock.price 이렇게 사용할 수 있음.

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
            const oGameModel = this.getOwnerComponent().getModel("game"); //앱이 실행될 때 생성되는 최상위 컴포넌트(Component.js)에 모델을 등록해 두었음. 그 모델을 가져옴.

            const oSelect = this.byId("stockSelect");
            const oItem = oSelect.getSelectedItem();

            if (!oItem) {
                return;
            }

            const oContext = oItem.getBindingContext("game"); 
            const oStock = oContext.getObject(); //getObject() : 그 위치에 들어 있는 실제 데이터를 가져옴. oStock.price 이렇게 사용할 수 있음.

            const iQty = Number(
                this.byId("qtyInput").getValue()
            );

            const iCash = oGameModel.getProperty("/cash");

            const oResult = Trade.buy(iCash, oStock, iQty);//Trade.js 안에 작성된 buy() 함수를 실행
            /*return {
                success: true,
                nextCash: cash - totalCost,
                nextQuantity: stock.quantity + qty,
                gross: gross,
                fee: fee
                }; 이 리턴값이 oResult에 들어감.



                ---------- 중요 ---------- 실제 모델에도, 거래 후의 금액 변동을 반영해줘야 할듯. 
                const oResult = Trade.buy(iCash, oStock, iQty);

                if (oResult.success) {
                    const oModel = this.getView().getModel("game");

                    // 모델에 실제로 계산된 새 값을 덮어씌움 (이때 화면이 바뀜)
                    oModel.setProperty("/cash", oResult.nextCash);
                    oModel.setProperty("/quantity", oResult.nextQuantity);
    
                    // 성공 메시지 띄우기 등 추가 작업...
                }
             * 
             */

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
            const oGameModel = this.getOwnerComponent().getModel("game"); ////앱이 실행될 때 생성되는 최상위 컴포넌트(Component.js)에 모델을 등록해 두었음. 그 모델을 가져옴. 
            //모델을 가져온다는 점에서는 getView().setModel()와 동일함. 

            const oSelect = this.byId("stockSelect"); //: XML 화면에서 id="stockSelect"인 요소를 찾기.
            const oItem = oSelect.getSelectedItem(); //사용자가 선택한 아이템을 가져옴.

            if (!oItem) { //선택한 아이템이 없으면 그냥 return함
                return;
            }

            const oContext = oItem.getBindingContext("game");
            const oStock = oContext.getObject(); ////getObject() : 그 위치에 들어 있는 실제 데이터를 가져옴. oStock.price 이렇게 사용할 수 있음.

            const iQty = Number(
                this.byId("qtyInput").getValue()
            );

            const iCash = oGameModel.getProperty("/cash"); //.getProperty() : 모델에서 지정한 위치의 값을 읽음.cash: 10000이라면 iCash에는 10000이 저장됨.
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
