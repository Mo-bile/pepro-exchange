sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
    "use strict";

    // A / MJY: 공통 게임 초기화와 시장 화면 이동을 담당한다.
    return Controller.extend("pepero.exchange.peperoexchange.controller.Home", {
        onInit: function () {
        },
        onStart: function () {
            var oComponent = this.getOwnerComponent();
            oComponent.resetGame();
            // 연결 필요: Market 진입 시 ready → running 전환과 시장 타이머 시작.
            // 현재 Market에는 타이머가 없으므로 여기서는 초기 상태 ready를 유지한다.
            oComponent.getRouter().navTo("RouteMarket");
        }
    });
});
