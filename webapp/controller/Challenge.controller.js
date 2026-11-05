sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("pepero.exchange.peperoexchange.controller.Challenge", {

        // 1. 처음 화면 켜질 때 초기화 (game 모델 사용)
        onInit: function () {

            var oModel = this.getView().getModel("game"); // "game" 모델 불러오기

            if (oModel) {
                oModel.setProperty("/challenge/displayTime", "00.00");
                oModel.setProperty("/challenge/status", "UNUSED");
                // 다빈 님의 화면(XML View)에서 버튼을 보여주거나 숨기기 위해 필요합니다.
                // e. g., <Text text = "{game/challenge/displaytime}" />
                // status가 "UNUSED"일 때 ➔ 화면에 [START 버튼]만 보여주고, [STOP], [RETRY] 버튼은 숨깁니다.
                // status가 "ACTIVE"일 때 ➔ [STOP 버튼]만 보여주고, [START] 버튼은 숨깁니다.
                // onInit 초기값 설정

            }
        },

        // 2. 조장님이 만든 시장 화면 이동 버튼
        onMarket: function () {

            this.getOwnerComponent().getRouter().navTo("RouteMarket");

            // this.getOwnerComponet()
            // 의미: "이 앱의 최상위 관리자(Component.js)를 찾아라!"

            // .getRouter()
            // 의미: "관리자야, 아까 manifest.json에 세팅해 둔 화면 네비게이터(Router) 좀 가져와 줘!"

            // .navTo("RouteMarket")
            // 의미: "네비게이터야, manifest.json에 적어둔 RouteMarket(시장 화면) 주소로 운전해서 화면 바꿔줘!"

        },

        // 3. 다빈 님의 START 버튼 클릭 시
        onStart: function () {

            // "game" 모델 불러오기
            var oModel = this.getView().getModel("game");

            // 현재 누른 시각을 수첩(_startedAt)에 기억
            this._startedAt = performance.now();

            // 게임 상태 변경 및 거래 잠금
            oModel.setProperty("/challenge/status", "ACTIVE");

            // 하나의 글로벌 모델을 같이 쓰기 때문에 챌린지 화면에서의 조작이 주식 거래 화면에도 실시간으로 영향을 주게 되는 것
            oModel.setProperty("/session/canTrade", false);

        },

        // 4. 다빈 님의 STOP 버튼 클릭 시 (시간 계산 및 결과 처리)
        onStop: function () {

            var stoppedAt = performance.now();                  // 멈춘 시각 찍기
            var oModel = this.getView().getModel("game");       // "game" 모델 불러오기

            // [계산 1] 경과 시간 및 오차 계산
            var elapsedMs = stoppedAt - this._startedAt;        // 정지 시각 - 시작 누른 시각 = 경과된 시간
            var errorMs = Math.abs(elapsedMs - 11110);          // 경과 시간 - 11110 = 오차 시간

            // [계산 2] 화면 표시용 텍스트 변환 (소수점 2자리)
            var stoppedSec = (elapsedMs / 1000).toFixed(2);     // 정지 시간: 경과된 밀리초를 1000으로 나누고 소수점 두 자리까지만 보여주는 것
            var errorSec = (errorMs / 1000).toFixed(2);          // 오차 시간: 오차 밀리초를 1000으로 나누고 소수점 두 자리까지만 보여주는 것

            // [판정] 성공 / 실패 / 타임아웃 판정
            var resultStatus = "FAIL";

            if (elapsedMs >= 15000) {                       // 경과 시간이 15000밀리초보다 크다면,
                resultStatus = "TIMEOUT";                   // 결과는 TIMEOUT
            } else if (stoppedSec === "11.11") {            // 정지 시간이 11.11초와 같다면,
                resultStatus = "SUCCESS";                   // 결과는 SUCCESS
            }

            // [화면 전달] "game" 모델에 결과 업데이트
            oModel.setProperty("/challenge/status", "RESOLVED");                        // status가 "RESOLVED"일 때 ➔ [RETRY 버튼]과 결과 문구를 보여줍니다.
            oModel.setProperty("/challenge/displayTime", stoppedSec);                   // 멈춘 시점의 최종 시간을 화면 숫자로 고정
            oModel.setProperty("/challenge/diffText", "목표와 " + errorSec + "초 차이!"); // 오차 안내 문구 출력
            oModel.setProperty("/challenge/result", resultStatus);                      // 성공 / 실패 / 타임아웃 판정 결과 저장
            oModel.setProperty("/session/canTrade", true);                              // 주식 거래 잠금 해제

        },

        // 5. 다빈 님의 RETRY 버튼 클릭 시 (초기화)
        // onRetry 함수는 사용자가 게임이 끝난 뒤 [RETRY (다시 시도)] 버튼을 눌렀을 때
        // 모든 상태를 처음으로 되돌리는 '초기화(리셋)' 코드
        onRetry: function () {

            var oModel = this.getView().getModel("game"); // "game" 모델 불러오기

            oModel.setProperty("/challenge/status", "UNUSED");          //게임 상태를 다시 '시작 전'으로 리셋
            oModel.setProperty("/challenge/displayTime", "00.00");      //화면 타이머 숫자를 "00.00"으로 초기화
            oModel.setProperty("/challenge/diffText", "");              //이전 게임 결과 문구 지우기
            oModel.setProperty("/session/canTrade", true);              //주식 거래 기능 정상화 (안전장치)

        }
    });
});