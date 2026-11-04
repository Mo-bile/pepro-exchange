sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "pepero/exchange/peperoexchange/model/models",
    "pepero/exchange/peperoexchange/model/gameState"
], (UIComponent, MessageBox, models, gameState) => {
    "use strict";

    return UIComponent.extend("pepero.exchange.peperoexchange.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // manifest.json에서 등록한 game 모델의 초기 데이터를 보관한다.
            const gameModel = this.getModel("game");
            gameModel.attachEventOnce("requestCompleted", (event) => {
                if (this.bIsDestroyed) {
                    return;
                }
                if (!event.getParameter("success")) {
                    MessageBox.error("게임 초기 데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.");
                    return;
                }
                this._initialGameState = gameState.createInitialState(gameModel.getData());
                this.getRouter().initialize();
            });
        },

        /**
         * Controller에서 this.getOwnerComponent().resetGame()으로 호출한다.
         * 기존 모델과 바인딩을 유지하고 모든 데이터를 새 초기값으로 교체한다.
         * 담당 Controller는 호출 전에 타이머와 리스너를 정리해야 한다.
         * 상태는 ready로 돌아가며 시작 처리와 화면 이동은 호출자가 담당한다.
         * 최초 JSON 로딩 완료 후 호출한다. 재초기화는 추가 네트워크 요청 없이 동기 처리한다.
         */
        resetGame() {
            this.getModel("game").setData(gameState.createInitialState(this._initialGameState));
        }
    });
});
