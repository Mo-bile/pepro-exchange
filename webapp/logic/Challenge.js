// D / SDB·JMJ: 경과 시간·오차 계산 작성 예정.
// 파일 자리만 준비하며 함수·초기 데이터·계산 코드는 아직 구현하지 않는다.
// sap.ui.define([], function () {
//     "use strict";

//     return {
//         /**
//          * 1. 경과 시간 및 오차 계산
//          * 다빈 님의 시작/정지시각 2개를 넘겨받아 차이를 계산
//          */
//         calculateError: function (startedAt, stoppedAt) {
//             var elapsedMs = stoppedAt - startedAt;
//             // 지체된 시간(밀리초) = 멈춘 시각 - 시작 시각
//             // 외부에서 받는 재료 (매개변수)
//             // 소괄호 () 안에 적힌 startedAt과 stoppedAt은 함수를 실행할 때
//             // 외부(다빈 님의 컨트롤러)에서 넘겨받는 2개의 재료(숫자)
//             var errorMs = Math.abs(elapsedMs - 11110);

//             return {
//                 elapsedMs: elapsedMs,
//                 errorMs: errorMs
//             };
//         },

//         /**
//          * 2. 성공 / 실패 판정
//          * 소수 둘째 자리 기준 '11.11'초면 SUCCESS, 아니면 FAIL
//          */
//         evaluateResult: function (elapsedMs) {
//             // 15초(15,000ms) 이상 방치 시 타임아웃 실패
//             if (elapsedMs >= 15000) {
//                 return "TIMEOUT";
//             }

//             // 밀리초를 초 단위 소수점 둘째 자리 문자로 변환 (예: 11114ms -> "11.11")
//             var formattedSec = (elapsedMs / 1000).toFixed(2);

//             if (formattedSec === "11.11") {
//                 return "SUCCESS";
//             } else {
//                 return "FAIL";
//             }
//         },

//         /**
//          * 3. 보상 미래 뉴스 추출
//          * 성공 시 완료 시점 기준 10초 뒤 발표될 첫 뉴스를 찾아 돌려줍니다.
//          */
//         selectRewardNews: function (allNews, completionElapsedMs, isSuccess) {
//             if (!isSuccess || !allNews) {
//                 return null;
//             }

//             var minPublishMs = completionElapsedMs + 10000; // 10초 뒤 기준 시각

//             for (var i = 0; i < allNews.length; i++) {
//                 var news = allNews[i];
//                 if (news.publishMs >= minPublishMs && !news.isPublished) {
//                     return {
//                         newsId: news.id,
//                         publishMs: news.publishMs,
//                         symbol: news.symbol,
//                         direction: news.direction,
//                         impactBps: news.impactBps
//                     };
//                 }
//             }

//             return null;
//         }
//     };
// });