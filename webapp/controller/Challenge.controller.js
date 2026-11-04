sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
    "use strict";

    // D / SDB·JMJ: 화면 이동만 담당. 게임 로직은 구현 예정.
    return Controller.extend("pepero.exchange.peperoexchange.controller.Challenge", {
        onMarket: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMarket");
        }
    });
});
