sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("pepero.exchange.peperoexchange.controller.Challenge", {

        // 11. 09. 수정) 처음 화면 켜질 때 초기화 (game 모델 사용)
        onInit: function () {

            // getOwnerComponent로 component와 연결하여 라우터(Routing 지도)를 가져옴
            var oRouter = this.getOwnerComponent().getRouter();
            
            // "RouteChallenge"라는 화면에 진입할 때마다 this(현재 컨트롤러 내) _onRouteMatched 함수를 실행하도록 연결(두 번째 this는 이름표)
            oRouter.getRoute("RouteChallenge").attachPatternMatched(this._onRouteMatched, this);

            // 키보드(keydown) 이벤트 감지기 생성 및 등록. '.bind(this)'로 함수 내부의 this를 컨트롤러로 고정
            this._fnKeyDownHandler = this._onKeyDown.bind(this);

            // 브라우저 전체(window)에 키보드 누름 이벤트 감지기를 설치
            window.addEventListener("keydown", this._fnKeyDownHandler, true);

        },

        // "RouteChallenge" 화면에 진입할 때마다 매번 실행되는 초기화 함수 (라우터 이벤트에 의해 자동으로 실행되는 함수)
        _onRouteMatched: function (oEvent) {

            // "game" 모델 불러오기
            var oModel = this.getOwnerComponent().getModel("game");

            if (oModel) {

                // xml e. g., <Text text = "{game>/challenge/displaytime}" />
                oModel.setProperty("/challenge/displayTime", "00.00");
                // status가 "UNUSED"일 때 ➔ 화면에 [START 버튼]만 보여주고, [STOP], [RETRY] 버튼은 숨김
                oModel.setProperty("/challenge/status", "UNUSED");

                    console.log("status가 성공적으로 UNUSED로 설정되었습니다!");
            } else {
                console.error("모델을 찾을 수 없습니다.");
            }

            // 혹시 이전 게임이나 백그라운드에서 돌아가던 타이머가 있다면 안전하게 멈춤
            if (this._timerId) {
                clearInterval(this._timerId);
            }

        },

        // 조장님이 만든 시장 화면 이동 버튼
        onMarket: function () {

            var oModel = this.getOwnerComponent().getModel("game");

            // sStatus에 oModel의 status를 불러옴
            var sStatus = oModel.getProperty("/challenge/status");

            // 챌린지 중 시장으로의 이동을 막는 if문
            if(sStatus === "ACTIVE") {
                // status가 ACTIVE여서 조건을 만족하는 경우, MessageToast를 띄우고,
                MessageToast.show(`챌린지 진행 중에는 시장으로 이동하실 수 없습니다!`);
                // return문이 실행되어 함수 밖으로 빠져나감(함수 종료)
                return;
            }

            // manifest에 있는 RouteMarket을 찾아서 그 곳으로 이동하는 것
            this.getOwnerComponent().getRouter().navTo("RouteMarket");

        },

        // 다빈 님의 START 버튼 클릭 시
        onStart: function () {

            // "game" 모델 불러오기
            var oModel = this.getView().getModel("game");

            // 이미 게임이 진행 중(ACTIVE)이라면 스페이스바나 클릭을 다시 눌러도 중복 실행되지 않게 막음
            if (oModel.getProperty("/challenge/status") === "ACTIVE") {
                return;
            }

            // 처음 시작 버튼을 누른 시각을 _startedAt에 기억
            this._startedAt = performance.now();

            // 게임 상태 변경 및 거래 잠금
            // start 버튼 누르면 상태를 active로 설정(xml에서.. 상태가 active일 때 stop 버튼 visible)
            oModel.setProperty("/challenge/status", "ACTIVE");

            // 하나의 글로벌 모델을 같이 쓰기 때문에 챌린지 화면에서의 조작이 주식 거래 화면에도 실시간으로 영향을 주게 되는 것
            // oModel.setProperty("/session/canTrade", false);



            // [추가] 0.01초(10ms)마다 화면 숫자를 계속 바꿔주는 실시간 타이머
            var realTime = this;

            // 1. 등록 및 ID 저장
            // setInterval은 설정한 시간 간격(밀리초)마다 지정한 함수를 반복 실행

            /* 2. 이하는 10ms(0.01초)마다 반복될 로직 */
            this._timerId = setInterval(function () {
                
                // 3. 0.01초마다 코드가 실행될 때마다, 현재 이 순간의 시간을 가져옵니다.
                // setInterval에 의해 시작 버튼을 누른 후 0.01초마다 반복하여 now에 기록
                var now = performance.now();

                // 4. 지금 시간(now)에서 처음 START 버튼을 눌렀던 시간(realTime._startedAt)을 뺍니다.
                // 현재까지 경과된 시간 = '실시간으로 기록하고 있는 현재 시각' - '시작 버튼을 처음 누른 시간' (0.01초마다 반복하여 기록)
                var currentMs = now - realTime._startedAt;

                // 경과된 밀리초를 소수점 2자리까지 1000으로 나눠 초단위로 보여줌. 마찬가지로 0.01초마다 반복
                var currentSec = (currentMs / 1000).toFixed(2);

                // 시작 버튼을 누르고 15초 경과 시, realTime 실시간 타이머를 자동 종료 기능
                if(currentMs >= 15000) {
                    realTime.onStop();
                    return;
                }
                
                // setInterval에 의한 계산된 초를 0.01초마다 화면 전광판 숫자에 실시간으로 업데이트
                oModel.setProperty("/challenge/displayTime", currentSec);
            }, 10);

        },

        // 다빈 님의 STOP 버튼 클릭 시 (시간 계산 및 결과 처리)
        onStop: function () {

            // [추가] 돌아가던 실시간 타이머 멈추기(인터벌 기능 종료)
            clearInterval(this._timerId);

            var stoppedAt = performance.now();                  // 멈춘 시각 찍기
            var oModel = this.getView().getModel("game");       // "game" 모델 불러오기

            // 진행 중(ACTIVE) 상태가 아니면(이미 멈췄거나 시작 전이면) 정지 로직이 중복 실행되지 않게 막음
            if (oModel.getProperty("/challenge/status") !== "ACTIVE") {
                return;
            }

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

            // [결과] 결과창 MessageToast 기능
            if (resultStatus === "SUCCESS") {
                MessageToast.show(`성공!`);
            } else if (resultStatus === "FAIL") {
                // stop 버튼 누를 때, 오차 안내 문구 MessageToast로 출력
                MessageToast.show(`목표와 ${errorSec}초 차이!`);
            } else {
                MessageToast.show(`시간 초과!`);
            }

            // [화면 전달] "game" 모델에 결과 업데이트
            oModel.setProperty("/challenge/status", "RESOLVED");        // stop 버튼을 누르면 status가 "RESOLVED"로 설정 (xml에서.. 상태가 resolved일 때 retry 버튼 visible)
            oModel.setProperty("/challenge/displayTime", stoppedSec);   // 멈춘 시점의 최종 시간을 화면 숫자로 고정
            oModel.setProperty("/challenge/result", resultStatus);      // 성공 / 실패 / 타임아웃 판정 결과 저장

            // 시간 초과(TIMEOUT)가 아닐 때만 기록에 추가
            if (resultStatus !== "TIMEOUT") {
                // 기존 기록 배열 가져오기 (topRecords가 없으니 undefined이므로, 첫 순환은 빈 배열로 시작)
                var aRecords = oModel.getProperty("/challenge/topRecords") || [];
                // setProperty는 마지막 줄에서 실행하여 두 번째부터 getProperty 가능
                
                // stop 버튼 누를 때마다 기록이 추가되는 변수 aRecords
                aRecords.push({
                    // xml을 통해 화면에 보여줄 시간
                    time: stoppedSec,
                    // 단순 오차 계산을 위함(화면에 나타내진 않음)
                    errorMs: errorMs
                    // 멈춘 시간과 오차 수치를 담아서 aRecords에 push함 (Math.abs 때문에 음수는 없고 양수만 출력됨)
                });

                // 11.11초와의 오차가 작은 순(1위 -> 3위)으로 정렬
                aRecords.sort(function (a, b) {
                    // a의 오차밀리초 - b의 오차밀리초 = 양수(+)일 경우 b가 우선순위
                    // a의 오차밀리초 - b의 오차밀리초 = 음수(-)일 경우 a가 우선순위
                    return a.errorMs - b.errorMs;
                });
                // return문으로 a.errorMs - b.errorMs의 값을 제공하고 function을 빠져나감

                // 0, 1, 2까지(3번부터 slice)
                aRecords = aRecords.slice(0, 3);
                // topRecords의 프로퍼티값을 aRecords로 설정
                oModel.setProperty("/challenge/topRecords", aRecords);
            }

        },

        // onRetry 함수는 사용자가 게임이 끝난 뒤 RETRY 버튼을 눌렀을 때, 모든 상태를 처음으로 되돌리는 '초기화(리셋)' 코드
        onRetry: function () {

            // "game" 모델 불러오기
            var oModel = this.getView().getModel("game");

            oModel.setProperty("/challenge/status", "UNUSED");      // 상태를 unused로 초기화 (xml에서.. 상태가 unused일 때 start 버튼 visible)
            oModel.setProperty("/challenge/displayTime", "00.00");  // 화면 타이머 숫자를 "00.00"으로 초기화

        },

        // 11.06. 추가) 키보드 입력 처리 함수
        _onKeyDown: function (e) {

            // 현재 URL 해시를 확인하여 챌린지 화면이 아니면 무시하고 종료
            var sHash = window.location.hash;
            // window: 현재 켜져 있는 웹 브라우저 창 전체를 가리키는 최상위 객체
            // location: window내의 속성(Property), 접속 중인 웹페이지의 주소(URL)에 대한 모든 정보를 품고 있는 객체
            // hash: location 주소 정보 상자 안에서 '#' 기호를 포함한 그 뒷부분의 문자열을 가져오는 속성
            
            if (sHash.indexOf("challenge") === -1) {
               // indexOf가 url #이하에서 "challenge" 단어를 찾아 시작 위치인 '14'를 반환, 만약 찾지 못했다면 '-1' 반환
                return;
            }

            // 만약 물리적으로 눌린 키가 스페이스 바 or 키 코드가 32번(스페이스바)이라면
            if (e.code === "Space" || e.keyCode === 32) {

                // 여기서 이벤트를 가로채서 다른 버튼들로 이벤트가 번지는 것을 방지
                e.stopPropagation();
                // 스페이스 바 입력 시 화면이 아래로 스크롤 되는 기능 제한
                e.preventDefault();
                
                var oModel = this.getView().getModel("game");

                // 모델을 불러오지 못했을 경우 실행을 중단
                if (!oModel) return;

                var sStatus = oModel.getProperty("/challenge/status");

                if (sStatus === "UNUSED") {
                    // onStart 함수 실행 후 status를 'active'로 바꿈
                    this.onStart();
                } 
                else if (sStatus === "ACTIVE") {
                    // onStop 함수 실행 후 status를 'resolved'로 바꿈
                    this.onStop();
                }
            }
        },

        // 화면을 벗어날 때 인터벌 종료(타이머 자동 종료)
        onExit: function () {

            // clearInterval: 타이머 인터벌 기능 종료
            if(this._timerId) {
                clearInterval(this._timerId);
            }

            // 화면을 벗어날 때 아까 등록한 키보드 감지기를 제거, 메모리 누수 및 타 화면 오작동 방지
            if (this._fnKeyDownHandler) {
                window.removeEventListener("keydown", this._fnKeyDownHandler, true);
            }

        }
    });
});