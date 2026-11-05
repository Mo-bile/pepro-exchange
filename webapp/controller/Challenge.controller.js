sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("pepero.exchange.peperoexchange.controller.Challenge", {

        // 1. 처음 화면 켜질 때 초기화 (game 모델 사용)
        onInit: function () {

            var oModel = this.getOwnerComponent().getModel("game") || this.getView().getModel("game"); // "game" 모델 불러오기(+ 안전장치)

            if (oModel) {
                oModel.setProperty("/challenge/displayTime", "00.00");
                oModel.setProperty("/challenge/status", "UNUSED");
                // 다빈 님의 화면(XML View)에서 버튼을 보여주거나 숨기기 위해 필요합니다.
                // xml e. g., <Text text = "{game>/challenge/displaytime}" />
                // status가 "UNUSED"일 때 ➔ 화면에 [START 버튼]만 보여주고, [STOP], [RETRY] 버튼은 숨깁니다.
                // status가 "ACTIVE"일 때 ➔ [STOP 버튼]만 보여주고, [START] 버튼은 숨깁니다.
                    console.log("status가 성공적으로 UNUSED로 설정되었습니다!");
            } else {
                console.error("모델을 찾을 수 없습니다.");
            }
        },

        // 2. 조장님이 만든 시장 화면 이동 버튼
        onMarket: function () {

            // oModel에 game model을 불러옴
            var oModel = this.getOwnerComponent().getModel("game") || this.getView().getModel("game");

            // sStatus에 oModel을 잘 가져왔나 ? 참일 경우 oModel의 status를 불러옴 : 거짓일 경우 아무 것도 불러오지 않음
            var sStatus = oModel ? oModel.getProperty("/challenge/status") : ""

            // 챌린지 중 시장으로의 이동을 막는 if문
            if(sStatus === "ACTIVE") {
                // status가 ACTIVE여서 조건을 만족하는 경우, MessageToast를 띄우고,
                MessageToast.show(`챌린지 진행 중에는 시장으로 이동하실 수 없습니다!`);
                // return문이 실행되어 함수 밖으로 빠져나감
                return;
            }

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

            // 처음 시작 버튼을 누른 시각을 수첩(_startedAt)에 기억
            this._startedAt = performance.now();

            // 게임 상태 변경 및 거래 잠금
            oModel.setProperty("/challenge/status", "ACTIVE");          // start 버튼 누르면 상태를 active로 설정(xml에서.. 상태가 active일 때 stop 버튼 visible)

            // 하나의 글로벌 모델을 같이 쓰기 때문에 챌린지 화면에서의 조작이 주식 거래 화면에도 실시간으로 영향을 주게 되는 것
            oModel.setProperty("/session/canTrade", false);



            // ⏱️ [추가] 0.01초(10ms)마다 화면 숫자를 계속 바꿔주는 실시간 타이머
            var realTime = this;

            // 1. 등록 및 ID 저장
            this._timerId = setInterval(function () {                   // setInterval은 설정한 시간 간격(밀리초)마다 지정한 함수를 반복 실행
                
                /* 2. 10ms(0.01초)마다 반복될 로직 */
                // 3. 0.01초마다 코드가 실행될 때마다, 현재 이 순간의 아주 정밀한 시간을 가져옵니다.
                var now = performance.now();                            // setInterval에 의해 시작 버튼을 누른 후 0.01초마다 반복하여 now에 기록

                // 4. 지금 시간(now)에서 처음 START 버튼을 눌렀던 시간(realTime._startedAt)을 뺍니다.
                var currentMs = now - realTime._startedAt;              // 현재까지 경과된 시간 = '실시간으로 기록하고 있는 현재 시각' - '시작 버튼을 처음 누른 시간' (0.01초마다 반복하여 기록)
                var currentSec = (currentMs / 1000).toFixed(2);         // 경과된 밀리초를 소수점 2자리까지 1000으로 나눠 초단위로 보여줌. 마찬가지로 0.01초마다 반복

                // 시작 버튼을 누르고 15초 경과 시, realTime 실시간 타이머를 자동 종료 기능
                if(currentSec >= 15000) {
                    realTime.onStop();
                    return;
                }
                
                // setInterval에 의한 계산된 초를 0.01초마다 화면 전광판 숫자에 실시간으로 업데이트
                oModel.setProperty("/challenge/displayTime", currentSec);
            }, 10);                                                     // setInterval(~...10);은 10밀리초(0.01초) 간격으로 반복하겠다는 뜻

        },

        // 4. 다빈 님의 STOP 버튼 클릭 시 (시간 계산 및 결과 처리)
        onStop: function () {

            // 🛑 [추가] 돌아가던 실시간 타이머 멈추기(인터벌 기능 종료)
            clearInterval(this._timerId);

            var stoppedAt = performance.now();                  // 멈춘 시각 찍기
            var oModel = this.getView().getModel("game");       // "game" 모델 불러오기

            // [계산 1] 경과 시간 및 오차 계산
            var elapsedMs = stoppedAt - this._startedAt;        // 경과된 밀리초 = 정지 버튼 누른 시각 - 시작 버튼 누른 시각
            var errorMs = Math.abs(elapsedMs - 11110);          // 오차 밀리초 = 경과된 밀리초 - 11110

            // [계산 2] 화면 표시용 텍스트 변환 (소수점 2자리)
            var stoppedSec = (elapsedMs / 1000).toFixed(2);     // 정지 초 = 경과된 밀리초 / 1000 -> 소수점 두 번째 자리까지만 보여줌
            var errorSec = (errorMs / 1000).toFixed(2);         // 오차 초 = 오차 밀리초 / 1000 -> 소수점 두 자리까지만 보여줌

            // [판정] 성공 / 실패 / 타임아웃 판정
            var resultStatus = "FAIL";                          // resultStatus(판정 결과)의 기본값은 FAIL(실패)

            if (elapsedMs >= 15000) {                           // 경과 시간이 15000밀리초보다 같거나 크다면,
                resultStatus = "TIMEOUT";                       // 결과는 TIMEOUT(시간 초과)
            } else if (stoppedSec === "11.11") {                // 정지 시간이 11.11초와 같다면,
                resultStatus = "SUCCESS";                       // 결과는 SUCCESS(성공)
            }

            // [화면 전달] "game" 모델에 결과 업데이트
            oModel.setProperty("/challenge/status", "RESOLVED");                            // stop 버튼을 누르면 status가 "RESOLVED"로 설정 (xml에서.. 상태가 resolved일 때 retry 버튼 visible)
            oModel.setProperty("/challenge/displayTime", stoppedSec);                       // 멈춘 시점의 최종 시간을 화면 숫자로 고정
            // oModel.setProperty("/challenge/errorText", `목표와 ${errorSec}초 차이!`);         // stop 버튼을 누를 때, 오차 안내 문구 출력
            oModel.setProperty("/challenge/result", resultStatus);                          // 성공 / 실패 / 타임아웃 판정 결과 저장
            oModel.setProperty("/session/canTrade", true);                                  // 주식 거래 잠금 해제

            MessageToast.show(`목표와 ${errorSec}초 차이!`);                                  // stop 버튼 누를 때, 오차 안내 문구 MessageToast로 출력

        },

        // 5. 다빈 님의 RETRY 버튼 클릭 시 (초기화)
        // onRetry 함수는 사용자가 게임이 끝난 뒤 [RETRY (다시 시도)] 버튼을 눌렀을 때, 모든 상태를 처음으로 되돌리는 '초기화(리셋)' 코드
        onRetry: function () {

            // 🛑 [추가] 혹시 타이머가 켜져있다면 안전하게 끄기
            clearInterval(this._timerId);

            var oModel = this.getView().getModel("game"); // "game" 모델 불러오기

            oModel.setProperty("/challenge/status", "UNUSED");              // 상태를 unused로 초기화 (xml에서.. 상태가 unused일 때 start 버튼 visible)
            oModel.setProperty("/challenge/displayTime", "00.00");          // 화면 타이머 숫자를 "00.00"으로 초기화
            oModel.setProperty("/challenge/errorText", ``);                 // 이전 게임 결과 문구 지우기
            oModel.setProperty("/session/canTrade", true);                  // 주식 거래 기능 정상화 (안전장치)

        },

        // 화면을 벗어날 때 인터벌 종료(타이머 자동 종료)
        onExit: function () {

            if(this._timerId) {
                clearInterval(this._timerId);
            }

        }
    });
});