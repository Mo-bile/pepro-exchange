sap.ui.define([], function () {
    "use strict";

    /**
     * 공통 모델 계약 (02_UI5_상세_설계서 기준).
     * cash, initialPrice, price, totalAssets, profit: PPR / quantity: 주(정수).
     * remainingMs, challenge.elapsedMs, challenge.errorMs: 밀리초.
     * returnPct: 퍼센트 값 (1은 1%). 반올림과 초 변환은 표시할 때만 한다.
     * status: ready | running | paused | finished.
     * pauseReason: null | challenge | hidden.
     * challenge.phase: idle | active | done.
     * challenge.outcome: null | success | timeout | hidden.
     * success는 측정 완료를 뜻하며, 오차에 따른 성공 등급이 아니다.
     * result: null 또는 Result.js에서 생성한 최종 결과 객체.
     *
     * Controller: this.getOwnerComponent().getModel("game").getProperty("/cash").
     * XML 바인딩: {game>/cash}, 목록: {game>/stocks}.
     * 초기 데이터: webapp/json/gameInitialState.json (게임용 가상 종목 24개).
     * 기존 original, almond, nude의 ID와 초기 가격은 유지한다.
     * 거래 시 배열 위치 대신 ID를 사용하며, 종목 수를 3개로 가정하지 않는다.
     * 타이머 핸들·시작 시각은 담당 Controller에서 관리한다.
     */
    return {
        /**
         * 중첩 객체와 종목 배열까지 호출마다 새로 생성한다.
         * @param {object} initialState Component에서 보관하는 JSON 초기 데이터.
         * @returns {object} 현재 라운드의 독립된 초기 데이터.
         */
        createInitialState: function (initialState) {
            return JSON.parse(JSON.stringify(initialState));
        }
    };
});
