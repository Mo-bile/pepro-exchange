sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
    "use strict";

    // A / MJY: 화면 이동만 담당. 게임 로직은 구현 예정.
    return Controller.extend("pepero.exchange.peperoexchange.controller.Home", {
        onInit: function () {
        },
        onStart: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMarket");
        }
    });
});
