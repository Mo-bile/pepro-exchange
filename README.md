## 팀 개발 구조 및 담당 파일

### 현재 상태

- 현재는 SAP Fiori Generator로 생성한 기본 프로젝트이며 App·Home View/Controller만 존재한다.
- `Component.js`는 `device` 모델을 등록하며, `manifest.json`에는 `i18n` 모델과 Home 경로만 설정되어 있다.
- 아래 구조는 팀이 구현할 목표 구조다. Market·Result, Fragment, `logic/`, `model/gameState.js`는 아직 생성하지 않았다.
- 기존 `webapp/test/`에는 Home 중심의 단위·통합 테스트 코드가 있다. 게임 기능 검증은 구현 후 추가한다.

### 실행 및 버전

```sh
npm ci
npm run start-local
```

- 팀 개발 기준은 SAPUI5 **1.120.52**다. `ui5-local.yaml`의 framework 버전이 고정되어 있다.
- `manifest.json`의 `minUI5Version`은 최소 요구 버전이며 실행 버전을 고정하지 않는다.
- `npm start`는 `ui5.yaml`의 버전 없는 SAP CDN 프록시를 사용하므로 실행 버전이 달라질 수 있다. 같은 버전으로 개발할 때는 `npm run start-local`을 사용한다.
- `npm run lint`: 정적 검사 / `npm run build`: 앱 빌드.

### 목표 폴더 구조
A~E는 역할 구분이다.

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
   │  └─ Result.view.xml            # E / MJY: 결과 화면
   ├─ controller/
   │  ├─ App.controller.js          # A / MJY
   │  ├─ Home.controller.js         # A / MJY: 시작 처리
   │  ├─ Market.controller.js       # B / JHJ: 이벤트·타이머·상태 반영
   │  └─ Result.controller.js       # E / MJY: 결과·다시하기
   ├─ fragment/
   │  ├─ Trade.fragment.xml         # C / JJY: 주문·자산 UI
   │  └─ Challenge.fragment.xml     # D / SDB·JMJ: 챌린지 팝업 UI
   ├─ model/
   │  ├─ models.js                  # 기존 기기 정보 모델
   │  └─ gameState.js               # A / MJY: 게임 초기값
   ├─ logic/
   │  ├─ Trade.js                   # C / JJY: 매매 검증·자산 계산
   │  ├─ Challenge.js               # D / SDB·JMJ: 경과 시간·오차 계산
   │  └─ Result.js                  # E / MJY: 최종 결과 계산
   ├─ css/
   │  └─ style.css                  # 공통 스타일
   ├─ i18n/
   │  └─ i18n.properties            # 공통 화면 문구
   └─ test/
      ├─ unit/                     # 기능별 단위 검증
      └─ integration/              # 전체 흐름 검증
```

### 화면 흐름과 구현 규칙

```text
Home → Market → Result
         │        └─ 다시하기: 상태 초기화 후 새 게임
         ├─ Trade Fragment: 주문·자산 영역
         └─ Challenge Fragment: 시장 정지 → 도전 → 시장 복귀
```

- 화면 경로는 Home·Market·Result 세 개로 구성한다. 챌린지는 별도 화면 경로 없이 Market 안의 Dialog로 연다.
- Component에 `game`이라는 이름의 JSONModel 하나를 등록하고, 가격·현금·보유량을 공통으로 사용한다.
- 게임 상태는 `ready | running | paused | finished`로 통일한다. 초기값은 `model/gameState.js`에서 생성한다.
- View는 XML, Controller와 계산 모듈은 `sap.ui.define()` 형식으로 작성한다. `logic/`은 계산 분리를 위한 팀 폴더다.
- Fragment는 자체 Controller가 없다. 주문·챌린지 이벤트는 `Market.controller.js`에 연결하고 계산은 담당 `logic/` 모듈에 위임한다.
- 시장·챌린지 타이머 등록 및 해제는 `Market.controller.js`에서 관리한다. 계산 모듈은 타이머·DOM·라우팅·공통 모델을 직접 변경하지 않는다.
- 챌린지는 자산 보상 없이 측정 기록과 오차를 표시한다.

### 담당 파일 및 협업 경계

| 역할 / 담당 | 주 수정 파일 | 책임 |
| --- | --- | --- |
| A·E / MJY | Component, manifest, App·Home·Result View/Controller, gameState.js, Result.js, README | 공통 구조·초기값·화면 전환·결과·다시하기·통합 검증 |
| B / JHJ | Market.view.xml, Market.controller.js | 가격 갱신·제한시간·정지·재개·이벤트 연결·모델 반영 |
| C / JJY | Trade.fragment.xml, logic/Trade.js | 주문·자산 UI, 거래 검증·잔고·자산 계산 |
| D / SDB·JMJ | Challenge.fragment.xml, logic/Challenge.js | 챌린지 UI·측정 계산·오차·시간초과·탭숨김 처리 |

- D의 UI 담당과 계산 담당은 두 사람이 협의하여 정한다.
- A·B가 매수·매도·도전 시작·종료·복귀 이벤트의 함수 틀과 입력·반환값을 먼저 맞춘다. 인계 후 Market Controller 파일 편집은 B가 모은다.
- C·D는 계산과 검증을 각자 구현하고 B와 함께 연결한다. 기능 구현 전체를 B에게 넘기지 않는다.
- `calculateAssets`는 Trade.js에서 제공하고 Result.js에서도 재사용하여 계산 중복을 줄인다.
- 공통 모델 필드·함수 이름·공통 CSS·i18n을 변경할 때는 관련 담당자와 먼저 공유한다.

### 초기 공유 전 A의 준비 범위

- 목표 파일 뼈대, 화면 이동, Fragment 배치와 공통 모델 초기값을 준비한다.
- A·B가 이벤트 함수 틀과 모듈 입력·반환값을 정리한다.
- 가격 변동·매매·챌린지 계산의 내부 구현은 담당자에게 맡긴다. 미구현 기능은 비활성화하거나 준비 중으로 표시한다.
- 시작·결과·다시하기의 실제 구현과 전체 연결·검증은 초기 공유 후 각 담당 작업과 병행한다.

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


