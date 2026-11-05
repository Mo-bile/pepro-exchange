sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "pepero/exchange/peperoexchange/logic/Trade",
    "sap/m/MessageToast"
            
], function (Controller, Trade, MessageToast) {
    "use strict";

    // B / JHJ: 화면 이동만 담당. 게임 로직은 구현 예정.
    return Controller.extend("pepero.exchange.peperoexchange.controller.Market", {
        onInit: function () {
            //1. Component에 등록된 game 모델을 가져온다.
            const oGameModel = this.getOwnerComponent().getModel("game");
            //2. game 모델의 stocks 배열을 가져오기
            const aStocks = oGameModel.getProperty("/stocks");
            

            // 타이머를 관리할 변수
            this._iTimerHandle = null;

            // 지금까지 진행한 시장 시간
            this._iAccumulatedMs = 0;

            // 시장이 시작된 시각
            this._iSegmentStart = 0;

            // Market 화면에 진입할 때 실행할 함수 등록
            this._oMarketRoute = this.getOwnerComponent().getRouter().getRoute("RouteMarket");

            this._oMarketRoute.attachPatternMatched(this._onEnterMarket, this);
        },
        
        // Market 화면 진입 시 실행
        _onEnterMarket: function () {

            const oGameModel = this.getOwnerComponent().getModel("game");

            // 새로운 게임일 때만 타이머 시작
            if (oGameModel.getProperty("/status") !== "ready") {
                return;
            }

            // 혹시 남아 있는 타이머가 있다면 제거
            this._clearMarketTimer();

            // 시작 시간 초기화
            this._iAccumulatedMs = 0;
            this._iSegmentStart = performance.now();
            // 마지막으로 가격을 변경한 회차
            this._iLastPriceTick = 0;

            // 게임 상태를 진행 중으로 변경
            oGameModel.setProperty("/status", "running");

            // 100ms 간격으로 시간 갱신 함수 실행
            this._iTimerHandle = setInterval(
                this._updateMarketTime.bind(this),
                100
            );
        },

        
        // 실제 경과시간을 계산하여 화면에 반영
        _updateMarketTime: function () {

            const oGameModel = this.getOwnerComponent().getModel("game");

            // 게임이 진행 중이 아니라면 실행하지 않음
            if (oGameModel.getProperty("/status") !== "running") {
                return;
            }

            // 실제 경과시간 계산
            const iElapsedMs = this._iAccumulatedMs + (performance.now() - this._iSegmentStart);
            
            
            // 1. 현재까지 실행되어야 하는 가격 변경 횟수 계산
            const iDueTick = Math.min(
                35,
                Math.floor(iElapsedMs / 5000)
                );

            // 2. 아직 실행하지 않은 가격 변경을 처리
            while (this._iLastPriceTick < iDueTick) {

            // 기존에 만든 24종목 가격 변경 함수 호출
            this.onChangePrices();

            // 가격 변경 횟수 1 증가
            this._iLastPriceTick++;
}

            // 3분(180000ms)에서 경과시간 차감
            const iRemainingMs = Math.max(0, 180000 - iElapsedMs);

            // 공통 모델의 남은 시간 수정
            oGameModel.setProperty("/remainingMs",Math.ceil(iRemainingMs));

            // 시간이 0이 되면 종료
            if (iRemainingMs <= 0) {

                this._clearMarketTimer();

                oGameModel.setProperty("/status", "finished");
            }
        },
            
        // 시장 타이머 정리
        _clearMarketTimer: function () {

            if (this._iTimerHandle !== null) {

                clearInterval(this._iTimerHandle);

                this._iTimerHandle = null;
            }
        },

        // Controller가 파괴될 때 정리
        onExit: function () {

            this._clearMarketTimer();

            if (this._oMarketRoute) {
                this._oMarketRoute.detachPatternMatched(
                    this._onEnterMarket,
                    this
                );
            }
        },



            
        // 남은 시간을 MM:SS 형식으로 변환하는 함수
        formatRemainingTime: function (iMs) {


            // 밀리초를 초 단위로 변환
            const iSeconds = Math.ceil(Math.max(0, iMs) / 1000);

            // 분 계산
            const iMinutes = Math.floor(iSeconds / 60);

            // 나머지 초 계산
            const iRemainSeconds = iSeconds % 60;

            // 03:00 형식으로 반환
            return String(iMinutes).padStart(2, "0") + ":" + String(iRemainSeconds).padStart(2, "0");
        },

        
        // 24개 종목의 현재가를 랜덤으로 변경
        onChangePrices: function () {

             // 1. 공통 game 모델 가져오기
            const oGameModel = this.getOwnerComponent().getModel("game");

            // 2. 전체 종목 배열 가져오기
            const aStocks = oGameModel.getProperty("/stocks");

            // 3. 가격 변동률 5가지
            const aRates = [-5, -2, 0, 2, 5];

            // 4. 종목 24개를 하나씩 반복
            for (let i = 0; i < aStocks.length; i++) {

                // 5. 랜덤으로 변동률 하나 선택
                const iRandom = Math.floor(Math.random() * aRates.length);
                const iRate = aRates[iRandom];

            // 6. 현재 종목의 가격 가져오기
            const iPrice = aStocks[i].price;

            // 7. 새로운 가격 계산
            const iNextPrice = Math.max(1,Math.round(iPrice * (1 + iRate / 100)));

            // 8. 공통 모델에 변경된 가격 저장
            oGameModel.setProperty( "/stocks/" + i + "/price",iNextPrice);
            }
        },


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
