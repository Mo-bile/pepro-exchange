sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
    "use strict";

    // E / MJY: 화면 이동만 담당. 게임 로직은 구현 예정.
    return Controller.extend("pepero.exchange.peperoexchange.controller.Result", {
        onHome: function () {
            this.getOwnerComponent().getRouter().navTo("RouteHome");
        }
    });
});
