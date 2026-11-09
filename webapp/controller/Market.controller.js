sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "pepero/exchange/peperoexchange/logic/Trade",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
            
], function (Controller, Trade, MessageToast, JSONModel) {
    "use strict";

    // B / JHJ: 화면 이동만 담당. 게임 로직은 구현 예정.
    return Controller.extend("pepero.exchange.peperoexchange.controller.Market", {
        onInit: function () {
            //1. Component에 등록된 game 모델을 가져온다.
            const oGameModel = this.getOwnerComponent().getModel("game");
            //2. game 모델의 stocks 배열을 가져오기
            const aStocks = oGameModel.getProperty("/stocks");
            
            // 차트 데이터 초기화
            this._initializeChart();

            // 타이머를 관리할 변수
            this._iTimerHandle = null;

            // 지금까지 진행한 시장 시간
            this._iAccumulatedMs = 0;

            // 시장이 시작된 시각
            this._iSegmentStart = 0;

            // Market 화면에 진입할 때 실행할 함수 등록
            this._oMarketRoute = this.getOwnerComponent().getRouter().getRoute("RouteMarket");

            this._oMarketRoute.attachPatternMatched(this._onEnterMarket, this);
            
                // ========== 뉴스 데이터 JSONModel ==========

                // 뉴스 JSON을 저장할 모델 생성
            const oNewsDataModel = new JSONModel();

            // newsData라는 이름으로 등록
            this.getView().setModel(oNewsDataModel, "newsData");

            // 뉴스 데이터 로딩 여부
            this._bNewsLoaded = false;
            this._bStartAfterLoad = false;

            // JSON 파일 로딩 완료 시 실행
            oNewsDataModel.attachRequestCompleted(function () {

                // JSON 안의 events 배열 가져오기
                const aEvents = oNewsDataModel.getProperty("/events");

                // 뉴스가 최소 3개 있는지 확인
                if (!Array.isArray(aEvents) || aEvents.length < 3) {
                    MessageToast.show("뉴스 데이터가 부족합니다.");
                    return;
                }

                this._bNewsLoaded = true;

                console.log("뉴스 JSON 로딩 완료!");
                console.log(aEvents);

                // JSON 로딩을 기다리는 중이었다면 시장 시작
                if (this._bStartAfterLoad) {
                    this._onEnterMarket();
                }

            }, this);

            // JSON 로딩 실패 시
            oNewsDataModel.attachRequestFailed(function () {
                MessageToast.show("뉴스 JSON 파일을 불러오지 못했습니다.");
            });

            // 실제 JSON 파일 불러오기
            oNewsDataModel.loadData(
                sap.ui.require.toUrl(
                    "pepero/exchange/peperoexchange/json/NewsEvents.json"
                )
            );


            // ========== 팝업 표시용 JSONModel ==========

            const oNewsModel = new JSONModel({
                title: "",
                body: "",
                effectText: ""
            });

            // news라는 이름으로 등록
            this.getView().setModel(oNewsModel, "news");


            // ========== 뉴스 이벤트 변수 초기화 ==========

            this._aNewsTicks = [];
            this._iNewsIndex = 0;
            this._aNewsPool = [];

            this._oNewsDialog = null;
            this._bNewsConfirmed = false;
        },
        
        // Market 화면 진입 시 실행
        _onEnterMarket: function () {

            const oGameModel = this.getOwnerComponent().getModel("game");

            // 새로운 게임일 때만 타이머 시작
            if (oGameModel.getProperty("/status") !== "ready") {
                return;
            }

             // JSON 데이터 로딩이 끝나지 않았다면 기다림
            if (!this._bNewsLoaded) {
                this._bStartAfterLoad = true;
                return;
            }

            this._bStartAfterLoad = false;

            // 혹시 남아 있는 타이머가 있다면 제거
            this._clearMarketTimer();

            // 시작 시간 초기화
            this._iAccumulatedMs = 0;
            this._iSegmentStart = performance.now();
            // 마지막으로 가격을 변경한 회차
            this._iLastPriceTick = 0;

            // 새 게임을 시작하면 차트 기록도 초기화
            this._initializeChart();

            
            this._aNewsTicks = [
                6 + Math.floor(Math.random() * 11),// 30~50초
                15 + Math.floor(Math.random() * 15),// 76~104초
                26 + Math.floor(Math.random() * 16)// 130~160초
            ];

            // 첫 번째 뉴스부터 시작
            this._iNewsIndex = 0;

            // JSON 파일에서 뉴스 배열 가져오기
            const oNewsDataModel = this.getView().getModel("newsData");

            const aNews = oNewsDataModel.getProperty("/events");

            // 원본을 보존하기 위해 배열 복사
            this._aNewsPool = aNews.slice();

            console.log("뉴스 발생 회차:", this._aNewsTicks);



            // 게임 상태를 진행 중으로 변경
            oGameModel.setProperty("/status", "running");
            oGameModel.setProperty("/pauseReason", null);

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
                89,
                Math.floor(iElapsedMs / 2000)
                );

            // 2. 아직 실행하지 않은 가격 변경을 처리
            while (this._iLastPriceTick < iDueTick) {

                // 이번에 실행할 가격 갱신 회차
                const iNextTick = this._iLastPriceTick + 1;

                // 뉴스가 없으면 null
                let oNews = null;

                // 아직 발생할 뉴스가 남아 있다면
                if (this._iNewsIndex < this._aNewsTicks.length) {

                    // 이번 가격 갱신 회차가 뉴스 발생 시점인지 확인
                    if (iNextTick === this._aNewsTicks[this._iNewsIndex]) {

                        // 뉴스 목록에서 랜덤으로 하나 선택
                        const iRandom = Math.floor(
                            Math.random() * this._aNewsPool.length
                        );

                        // 선택한 뉴스를 가져오고 배열에서 제거
                        oNews = this._aNewsPool.splice(iRandom, 1)[0];

                        // 다음 뉴스 순서로 이동
                        this._iNewsIndex++;

                        // 일단 콘솔에서 뉴스 발생 확인
                        console.log("뉴스 발생!");
                        console.log(oNews.title);
                        console.log("변동률:", oNews.rate);
                    }
                }

                // 기존 주가 변경 함수 호출
                // 뉴스가 있으면 뉴스 변동률 적용
                this.onChangePrices(oNews);

                // 가격 변경 회차 증가
                this._iLastPriceTick = iNextTick;

                
                // ========== 뉴스 발생 시 팝업 표시 ==========

                if (oNews) {

                    // 1. 뉴스가 발생한 시점에서 시장 시간 정지
                    this._pauseForNews(iNextTick * 2000);

                    // 2. 뉴스 팝업 열기
                    this._openNews(oNews);

                    // 3. 현재 함수 실행 종료
                    return;
                }

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

        // 챌린지에서 시장으로 복귀했을 때 타이머 재개
        _resumeAfterChallenge: function () {

            // 1. 공통 game 모델 가져오기
            const oGameModel = this.getOwnerComponent().getModel("game");

            // 2. 챌린지 때문에 정지된 상태인지 확인
            if (
                oGameModel.getProperty("/status") !== "paused" ||
                oGameModel.getProperty("/pauseReason") !== "challenge"
            ) {
                return;
            }

            // 3. 기존 타이머 중복 실행 방지
            this._clearMarketTimer();

            // 4. 돌아온 시점부터 다시 시간 측정
            this._iSegmentStart = performance.now();

            // 5. 게임 상태를 정상 진행으로 변경
            oGameModel.setProperty("/status", "running");
            oGameModel.setProperty("/pauseReason", null);

            // 6. 시장 타이머 다시 시작
            this._iTimerHandle = setInterval(
                this._updateMarketTime.bind(this),
                100
            );

            console.log("챌린지 복귀! 시장 타이머 재개!");
        },

        
        // 뉴스가 발생했을 때 시장을 정지하는 함수
        _pauseForNews: function (iElapsedMs) {

            // 1. 공통 game 모델 가져오기
            const oGameModel = this.getOwnerComponent().getModel("game");

            // 2. 현재까지 진행된 시장 시간 저장
            this._iAccumulatedMs = iElapsedMs;

            // 3. 남은 시간 계산
            const iRemainingMs = Math.max(0, 180000 - iElapsedMs);

            // 4. 화면에 남은 시간 반영
            oGameModel.setProperty("/remainingMs", Math.ceil(iRemainingMs));

            // 5. 시장 상태를 일시정지로 변경
            oGameModel.setProperty("/status", "paused");

            // 6. 뉴스 때문에 정지했다는 사실 저장
            oGameModel.setProperty("/pauseReason", "news");

            // 7. 기존 타이머 정지
            this._clearMarketTimer();

            console.log("뉴스로 시장 일시정지!");
        },

        
        // 뉴스 확인 후 시장을 다시 시작하는 함수
        _resumeAfterNews: function () {

            // 1. game 모델 가져오기
            const oGameModel = this.getOwnerComponent().getModel("game");

            // 2. 뉴스 때문에 정지된 상태인지 확인
            if (
                oGameModel.getProperty("/status") !== "paused" ||
                oGameModel.getProperty("/pauseReason") !== "news"
            ) {
                return;
            }

            // 3. 시장 진행 상태로 변경
            oGameModel.setProperty("/status", "running");
            oGameModel.setProperty("/pauseReason", null);

            // 4. 현재 시각부터 다시 시간 측정
            this._iSegmentStart = performance.now();

            // 5. 중복 타이머 방지
            this._clearMarketTimer();

            // 6. 시장 타이머 다시 실행
            this._iTimerHandle = setInterval(
                this._updateMarketTime.bind(this),
                100
            );

            console.log("뉴스 확인! 시장 재개!");
        },

        
        // 뉴스 팝업 열기
        _openNews: async function (oNews) {

            // 1. 뉴스 모델 가져오기
            const oNewsModel = this.getView().getModel("news");

            // 2. 변동률 안내 문구 만들기
            let sEffectText = "";

            if (oNews.scope === "all") {
                sEffectText = "전체 종목 ";
            } else {
                sEffectText = "특정 종목 ";
            }

            if (oNews.rate > 0) {
                sEffectText += "+" + oNews.rate + "% 상승!";
            } else {
                sEffectText += oNews.rate + "% 하락!";
            }

            // 3. 팝업 모델에 뉴스 데이터 저장
            oNewsModel.setProperty("/title", oNews.title);
            oNewsModel.setProperty("/body", oNews.body);
            oNewsModel.setProperty("/effectText", sEffectText);

            // 4. 확인 여부 초기화
            this._bNewsConfirmed = false;

            try {

                // 매매창이 열려 있다면 닫기
                if (this._oTradeDialog && this._oTradeDialog.isOpen()) {
                    this._oTradeDialog.close();
                }

                // 5. 뉴스 팝업이 없으면 새로 생성
                if (!this._oNewsDialog) {

                    this._oNewsDialog = await this.loadFragment({
                        name: "pepero.exchange.peperoexchange.fragment.NewsEvent"
                    });

                    // ESC 키로 닫지 못하도록 설정
                    this._oNewsDialog.setEscapeHandler(function (oEscape) {
                        oEscape.reject();
                    });
                }

                // 6. 현재 뉴스 정지 상태인지 확인
                const oGameModel = this.getOwnerComponent().getModel("game");

                if (
                    oGameModel.getProperty("/status") === "paused" &&
                    oGameModel.getProperty("/pauseReason") === "news"
                ) {
                    // 7. 뉴스 팝업 열기
                    this._oNewsDialog.open();
                }

            } catch (oError) {

                console.error("뉴스 팝업 오류:", oError);
                MessageToast.show("뉴스 팝업을 열지 못했습니다.");

                // 오류 발생 시 시장 재개
                this._resumeAfterNews();
            }
        },


        // 뉴스 확인 버튼 클릭
        onNewsConfirm: function () {

            // 확인 버튼을 눌렀다는 사실 저장
            this._bNewsConfirmed = true;

            // 팝업 닫기
            this._oNewsDialog.close();
        },


        // 뉴스 팝업이 완전히 닫혔을 때
        onNewsAfterClose: function () {

            // 확인 버튼을 눌렀는지 검사
            if (this._bNewsConfirmed) {

                this._bNewsConfirmed = false;

                // 브라우저 탭이 보이는 상태에서만 재개
                if (!document.hidden) {
                    this._resumeAfterNews();
                }
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

        
        // ========== 차트 데이터 초기화 ==========
        _initializeChart: function () {

            // 1. 공통 모델에서 종목 가져오기
            const oGameModel = this.getOwnerComponent().getModel("game");
            const aStocks = oGameModel.getProperty("/stocks");

            if (!aStocks || aStocks.length === 0) {
                return;
            }

            // 2. 첫 번째 종목을 기본 선택
            this._selectedStockId = aStocks[0].id;

            // 3. 종목별 가격 기록을 저장할 객체
            this._chartHistory = {};

            // 4. 모든 종목에 최초 가격 기록
            aStocks.forEach((oStock) => {
                this._chartHistory[oStock.id] = [
                    {
                        time: "0초",
                        price: oStock.price
                    }
                ];
            });

            // 5. 차트에 표시할 데이터
            const oChartData = {
                stockName: aStocks[0].name,
                price: aStocks[0].price,
                history: this._chartHistory[aStocks[0].id]
            };

            // 6. chart 모델 생성 또는 초기화
            const oChartModel = this.getView().getModel("chart");

            if (oChartModel) {
                oChartModel.setData(oChartData);
            } else {
                this.getView().setModel(
                    new JSONModel(oChartData),
                    "chart"
                );
            }
        },


        // ========== 종목 클릭 시 차트 변경 ==========
        onSelectStock: function (oEvent) {

            // 1. 클릭한 종목 가져오기
            const oItem = oEvent.getParameter("listItem");

            if (!oItem) {
                return;
            }

            const oStock = oItem.getBindingContext("game").getObject();

            // 2. 선택한 종목 ID 저장
            this._selectedStockId = oStock.id;

            // 3. 차트 모델 가져오기
            const oChartModel = this.getView().getModel("chart");

            // 4. 선택 종목의 정보로 변경
            oChartModel.setProperty("/stockName", oStock.name);
            oChartModel.setProperty("/price", oStock.price);

            // 5. 선택 종목의 가격 기록 표시
            oChartModel.setProperty(
                "/history",
                this._chartHistory[oStock.id].slice()
            );
        },


        
        // 24개 종목의 현재가를 랜덤으로 변경
        onChangePrices: function (oNews) {

             // 1. 공통 game 모델 가져오기
            const oGameModel = this.getOwnerComponent().getModel("game");

            // 2. 전체 종목 배열 가져오기
            const aStocks = oGameModel.getProperty("/stocks");

            // 3. 가격 변동률 5가지
            const aRates = [-30, -20, 0, 20, 50];

            // 4. 종목 24개를 하나씩 반복
            for (let i = 0; i < aStocks.length; i++) {

                // 5. 랜덤으로 변동률 하나 선택
                const iRandom = Math.floor(Math.random() * aRates.length);
                let iRate = aRates[iRandom];


                // ========== 뉴스 효과 적용 ==========

                // 뉴스가 발생한 경우에만 실행
                if (oNews) {

                    // 전체 종목에 영향을 주는 뉴스
                    if (oNews.scope === "all") {
                        iRate = oNews.rate;
                    }

                    // 특정 종목에 영향을 주는 뉴스
                    else if (
                        oNews.scope === "stock" &&
                        oNews.stockId === aStocks[i].id
                    ) {
                        iRate = oNews.rate;
                        }
                }

            // 6. 현재 종목의 가격 가져오기
            const iPrice = aStocks[i].price;

            // 7. 새로운 가격 계산
            const iNextPrice = Math.max(1,Math.round(iPrice * (1 + iRate / 100)));

            // 8. 공통 모델에 변경된 가격 저장
            oGameModel.setProperty( "/stocks/" + i + "/price",iNextPrice);
           
            // 9. 현재 종목의 ID 가져오기
            const sStockId = aStocks[i].id;


            // 10. 변경된 가격을 차트 기록에 추가
            this._chartHistory[sStockId].push({
            time: ((this._iLastPriceTick || 0) + 1) * 2 + "초",
            price: iNextPrice
            });
        }

        // 11. 차트 모델 가져오기
        const oChartModel = this.getView().getModel("chart");

        // 12. 현재 선택한 종목 찾기
        const oSelectedStock = aStocks.find(
            (oStock) => oStock.id === this._selectedStockId
        );

        // 13. 선택한 종목의 차트 갱신
        if (oChartModel && oSelectedStock) {

            // 차트에 표시되는 현재가 변경
            oChartModel.setProperty("/price", oSelectedStock.price);

            // 차트의 가격 변동 기록 변경
                oChartModel.setProperty( "/history",this._chartHistory[oSelectedStock.id].slice());
        }

            //--- 임시임시임시임시
            // 9. 변경된 주가를 기준으로 총자산 다시 계산
            const cash = oGameModel.getProperty("/cash");
            const stocks = oGameModel.getProperty("/stocks");

            const totalAssets = Trade.calculateAssets(cash, stocks);

            // 10. 모델에 총자산 반영
            oGameModel.setProperty("/totalAssets", totalAssets);
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
