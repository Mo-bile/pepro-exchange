## 팀 개발 구조 및 담당 파일

### 현재 상태

- Home·Market·Challenge·Result 기본 화면에 제목·안내·이동 버튼과 라우팅만 연결했다.
- Market과 11.11초 챌린지는 독립된 View/Controller이며 Challenge Fragment는 제거했다.
- Trade Fragment, `logic/`, `model/gameState.js`는 빈 틀이다. 공통 게임 모델·타이머·매매·측정·결과 계산은 미구현이다.
- 시작 화면의 버튼도 화면 이동만 수행한다. 개발용 결과 화면 이동은 게임 종료 처리를 하지 않는다.
- 기존 `webapp/test/`의 Home 테스트 파일은 유지한다.

### 실행 및 버전

```sh
npm ci
npm run start-local
```

- 팀 개발 기준은 SAPUI5 **1.120.52**다. `ui5-local.yaml`의 framework 버전이 고정되어 있다.
- `manifest.json`의 `minUI5Version`은 최소 요구 버전이며 실행 버전을 고정하지 않는다.
- `npm start`는 `ui5.yaml`의 버전 없는 SAP CDN 프록시를 사용하므로 실행 버전이 달라질 수 있다. 같은 버전으로 개발할 때는 `npm run start-local`을 사용한다.
- `npm run lint`: 정적 검사 / `npm run build`: 앱 빌드.

### 폴더 구조 (화면 이동 외 기능은 구현 예정)

- A~E는 역할 구분이다.

```text
pepero-exchange/
├─ package.json
├─ package-lock.json
├─ ui5.yaml
├─ ui5-local.yaml
├─ eslint.config.mjs
├─ README.md
├─ document/                         # 기존 기획·설계·역할 문서
└─ webapp/
   ├─ index.html
   ├─ Component.js                   # A / MJY: 공통 모델 등록
   ├─ manifest.json                  # A / MJY: 앱 설정·라우팅
   ├─ view/
   │  ├─ App.view.xml               # A / MJY: 전체 화면 틀
   │  ├─ Home.view.xml              # A / MJY: 시작 화면
   │  ├─ Market.view.xml            # B / JHJ: 시장 화면
   │  ├─ Challenge.view.xml         # D / SDB·JMJ: 챌린지 화면
   │  └─ Result.view.xml            # E / MJY: 결과 화면
   ├─ controller/
   │  ├─ App.controller.js          # A / MJY
   │  ├─ Home.controller.js         # A / MJY: 시작 처리
   │  ├─ Market.controller.js       # B / JHJ: 시장 화면 이동
   │  ├─ Challenge.controller.js    # D / SDB·JMJ: 시장 복귀
   │  └─ Result.controller.js       # E / MJY: 결과·다시하기
   ├─ fragment/
   │  └─ Trade.fragment.xml         # C / JJY: 주문·자산 UI (빈 틀)
   ├─ model/
   │  ├─ models.js                  # 기존 기기 정보 모델
   │  └─ gameState.js               # A / MJY: 게임 초기값
   ├─ logic/
   │  ├─ Trade.js                   # C / JJY: 매매 검증·자산 계산
   │  ├─ Challenge.js               # D / SDB·JMJ: 경과 시간·오차 계산
   │  └─ Result.js                  # E / MJY: 최종 결과 계산
   ├─ css/
   │  └─ style.css                  # 공통 스타일
   └─ test/
      ├─ unit/                     # 기능별 단위 검증
      └─ integration/              # 전체 흐름 검증
```

### 현재 화면 이동

```text
Home → Market → Result → Home
         │
         ├─ Challenge → Market
         └─ Home
```

- 챌린지는 독립된 화면 경로로 이동한다. 기존 PDF의 Dialog 방식보다 이 README의 변경안을 우선한다.
- i18n은 사용하지 않는다. 화면 문구는 XML에, 앱 제목·설명은 manifest.json에 직접 작성한다.
- View는 XML, Controller는 `sap.ui.define()` 형식이다. 이벤트 함수는 라우터 이동만 수행한다.
- Trade Fragment와 계산 모듈은 아직 화면에 연결하지 않았다.

### 향후 기능 연결 규칙

- 공통 game 모델, 초기값, 가격·매매·측정·결과 계산은 담당자가 구현한다.
- 시장 진입·이탈과 챌린지 진입·복귀 시 정지·재개 및 타이머 정리 계약은 B·D가 함께 정한다. 현재는 타이머가 없다.
- 주문 Fragment 이벤트는 Market Controller, 챌린지 이벤트는 Challenge Controller가 담당한다.
- 계산 모듈은 DOM·라우팅·공통 모델을 직접 변경하지 않는다. 챌린지는 자산 보상 없이 기록과 오차를 표시할 예정이다.

### 담당 파일 및 협업 경계

| 역할 / 담당 | 주 수정 파일 | 책임 |
| --- | --- | --- |
| A·E / MJY | Component, manifest, App·Home·Result View/Controller, gameState.js, Result.js, README | 공통 구조·초기값·화면 전환·결과·다시하기·통합 검증 |
| B / JHJ | Market.view.xml, Market.controller.js | 가격 갱신·제한시간·정지·재개·이벤트 연결·모델 반영 |
| C / JJY | Trade.fragment.xml, logic/Trade.js | 주문·자산 UI, 거래 검증·잔고·자산 계산 |
| D / SDB·JMJ | Challenge.view.xml, Challenge.controller.js, logic/Challenge.js | 챌린지 UI·측정 계산·오차·시간초과·탭숨김 처리 |

- D의 UI 담당과 계산 담당은 두 사람이 협의하여 정한다.
- Market Controller는 B, Challenge Controller는 D가 편집한다. 화면 간 상태·정지·복귀 계약은 A·B·D가 먼저 맞춘다.
- C는 B와 거래를 연결하고, D는 자신의 Controller에서 챌린지를 구현한 뒤 B와 시장 정지·복귀를 연결한다.
- `calculateAssets`는 Trade.js에서 제공하고 Result.js에서도 재사용하여 계산 중복을 줄인다.
- 공통 모델 필드·함수 이름·공통 CSS을 변경할 때는 관련 담당자와 먼저 공유한다.

### 이번 준비 범위

- 폴더·파일 틀과 네 화면의 이동까지만 준비했다.
- 초기 모델·타이머·거래·측정·결과·다시하기 동작은 이번 범위에 포함하지 않는다.
- 공통 함수 계약과 실제 기능 연결은 후속 작업에서 담당자와 정한다.

## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Wed Nov 04 2026 11:39:49 GMT+0900 (Korean Standard Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.33.0|
|**Generation Platform**<br>Visual Studio Code|
|**Template Used**<br>Basic|
|**Service Type**<br>None|
|**Service URL**<br>N/A|
|**Module Name**<br>pepero-exchange|
|**Application Title**<br>빼빼로 증권거래소|
|**Namespace**<br>pepero.exchange|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.120.52|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>True, see https://www.npmjs.com/package/@sap-ux/eslint-plugin-fiori-tools#rules for the eslint rules.|

## pepero-exchange

빼빼로 주식 거래와 11.11초 챌린지를 즐기는 게임

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)


