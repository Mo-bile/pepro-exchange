# 기본 색상과 화면 작성 규칙

SAPUI5 **1.120.52**, **sap_horizon** 밝은 테마 기준이다. 공통 CSS는 manifest.json에서 로드하며 App.view.xml의 `peperoApp` 아래에 적용된다.

## 색상 역할

| CSS 변수 | 값 | 용도 |
| --- | --- | --- |
| `--pepero-page-bg` | `#FAF7F2` | 페이지 바탕 |
| `--pepero-surface` | `#FFFFFF` | 카드 표면 |
| `--pepero-brand` | `#5A382B` | 서비스 브랜드 제목 |
| `--pepero-border` | `#E8D8C3` | 카드 경계선 |
| `--pepero-accent` | `#F2C66D` | 기록 강조 배지 배경 |

버튼·링크·선택·포커스·비활성·본문·성공·경고·오류 색상은 UI5 기본 테마를 사용한다. 골드는 작은 글자색으로 사용하지 않고 짙은 브라운 글자의 배경으로 사용한다. 챌린지는 자산 보상 없이 기록을 표시한다.

## 자동 적용 범위

- 앱 안의 일반 `sap.m.Page`는 기본 `backgroundDesign="Standard"`일 때 크림 배경이 자동 적용된다. 새 View에 화면별 색상 클래스는 필요 없다.
- `Solid`·`Transparent`로 지정한 Page 배경은 해당 UI5 설정을 따른다.
- 카드·브랜드 제목·기록 배지는 역할에 따라 아래 클래스를 명시한다. 생성기가 의미를 판단하거나 클래스를 자동 삽입하는 기능은 없다.
- Fragment는 앱 내부에 렌더링되면 같은 규칙을 따른다. Dialog/Popover는 static area에 렌더링될 수 있어 자동 상속을 보장하지 않는다. 팝업 추가 시 별도 범위와 테마 변수 전달을 설계한다.
- Launchpad 등 앱 바깥 화면은 변경하지 않는다. 다크·고대비 테마는 이번 설정의 지원 범위 밖이다.

## 새 View 예시

아래는 `xmlns="sap.m"`, `xmlns:mvc="sap.ui.core.mvc"`를 사용하는 XML View 예시다. 제목·문구·ID는 해당 화면에 맞게 바꾼다.

```xml
<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m">
    <Page id="samplePage" title="화면 제목">
        <content>
            <VBox id="sampleContent" class="sapUiResponsiveContentPadding sapUiMediumMarginTop">
                <VBox id="sampleCard" width="100%" class="peperoCard">
                    <Title id="sampleCardTitle" text="내 자산" level="H2" />
                    <Text id="sampleCardDescription" text="자산 정보" />
                </VBox>
            </VBox>
        </content>
    </Page>
</mvc:View>
```

서비스 이름을 표시하는 브랜드 제목에만 `peperoBrandTitle`을 사용한다. 홈처럼 Page 헤더에 필요하면 공개 `customHeader` API와 `Bar/contentMiddle` 안의 `Title`에 지정한다. UI5 내부 제목 DOM을 직접 선택하지 않는다.

```xml
<Title id="brandTitle" text="빼빼로 증권거래소" level="H2" class="peperoBrandTitle" />
<Text id="recordBadge" text="최고 기록" class="peperoRecordBadge" />
```

`peperoCard`는 VBox 같은 비대화형 컨테이너, `peperoRecordBadge`는 Text에 사용한다. 상태 표시 컨트롤이나 클릭 가능한 버튼에 이 클래스를 붙이지 않는다. 배지 문구도 함께 제공해 색상에만 의미를 의존하지 않는다.

## 확인 방법

`npm run start-local`로 실행하고 홈 → 시장 → 챌린지 → 시장 → 결과 → 홈 이동, 모바일 폭, 키보드 포커스를 확인한다. 정적 검사는 `npm run lint`, 빌드는 `npm run build`를 사용한다.
