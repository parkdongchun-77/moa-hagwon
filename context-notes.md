# 작업 메모 — 결정과 근거

## 2026-10-31 — 프리미엄 노출 결제를 스토어 인앱결제로 전환
- 결제는 두 갈래로 나눈다 (사용자 결정).
  1. 원장님 → 프리미엄 노출: 원장센터에서. 웹은 토스, 앱은 App Store·Google Play 인앱결제.
  2. 학부모 → 학원 수강료: 학원이 PG사(토스페이먼츠 등)와 직접 계약하고 학부모가 학원에 직접 결제. 모아학원 웹/앱에서 결제가 일어나지 않고 모아학원으로 돈이 들어오지 않는다 → PG 등록·지급대행 문제 없음.
- 모아학원 자체 토스 결제창은 웹 브라우저의 원장 프리미엄 결제에만 쓴다.
- 상품 4개 제안: 1개월 33,000 / 3개월 88,000(-11%) / 6개월 165,000(-17%, 추천 표시) / 12개월 297,000(-25%). 가격 확정은 사용자 승인 대기.
- (수정) 웹·앱 둘 다 결제받는다 (사용자 결정). 웹 브라우저는 지금 토스 결제창 유지, 앱은 스토어 인앱결제. 두 경로 모두 같은 premium_until 에 기간을 이어 붙인다.
- 조건: 앱 안에서 웹 결제를 안내·링크하면 Apple 3.1.1·Google 결제 정책 위반. 지금 tossPay 가 앱에서 "moahagwon.com 에서 결제해 주세요"를 띄우므로 이 문구를 지운다. 웹 페이지에서 앱 결제를 안내하는 것은 괜찮다.
- 가격은 웹·앱 같게 둔다. 웹이 더 남지만(토스 수수료가 스토어 15%보다 낮음) 앱 안에서 "웹이 더 싸다"고 알리면 안 되므로 가격을 달리할 이유가 약하다.
- 환불: 웹 결제는 모아학원 규칙(일할 환불), 앱 결제는 Apple·Google 이 처리한다. refund.html 에 둘을 나눠 적는다.
- iOS 상품 유형은 비갱신형 구독(기간제 이용권)으로 한다. 기간이 정해진 이용권을 소모성으로 등록하면 심사에서 지적될 수 있다. Android 는 일회성 상품.
- 영수증 확인은 KBizV 의 verify-credit-purchase(_shared/store-verify.ts)를 가져온다. KBizV 에서 2026-10-31 iOS 샌드박스 구매 2건으로 검증됨.
- 지금 코드에서 발견한 것: toss-payment 의 프리미엄 확정이 premium_until 을 "오늘 + 기간"으로 덮어써서, 노출 중에 다시 사면 남은 기간이 사라진다. 새 함수에서는 남은 기간에 이어 붙인다.
- 현재 구조: 웹은 GitHub Pages(moahagwon.com), DB·함수는 supabase.moahagwon.com, 함수 원본은 C:\Users\user\moa-fn\supabase\functions (git 아님). 앱은 capacitor/ (Capacitor 8), Android 는 Codemagic android-capacitor, iOS 는 Codemagic.
- 관련 테이블: premium_plans(code,name,price,days,sort,active), payment_transactions, ad_orders, academies(is_premium, premium_until).
