# 작업 메모 — 결정과 근거

## 2026-10-31 — 프리미엄 노출 결제를 스토어 인앱결제로 전환
- 결제는 두 갈래로 나눈다 (사용자 결정).
  1. 원장님 → 프리미엄 노출: App Store·Google Play 인앱결제. 원장센터(앱)에서만.
  2. 학부모 → 학원 수강료: 학원이 PG사(토스페이먼츠 등)와 직접 계약하고 학부모가 학원에 직접 결제. 모아학원 웹/앱에서 결제가 일어나지 않고 모아학원으로 돈이 들어오지 않는다 → PG 등록·지급대행 문제 없음.
- 모아학원 자체 토스 결제창은 원장 프리미엄에 더 이상 쓰지 않는다.
- 상품 4개 제안: 1개월 33,000 / 3개월 88,000(-11%) / 6개월 165,000(-17%, 추천 표시) / 12개월 297,000(-25%). 가격 확정은 사용자 승인 대기.
- 웹 브라우저에서는 스토어 결제를 쓸 수 없으므로 "앱에서 결제" 안내만 보여 주는 것을 기본안으로 둔다 (KBizV 와 같은 방식). 확정 전.
- iOS 상품 유형은 비갱신형 구독(기간제 이용권)으로 한다. 기간이 정해진 이용권을 소모성으로 등록하면 심사에서 지적될 수 있다. Android 는 일회성 상품.
- 영수증 확인은 KBizV 의 verify-credit-purchase(_shared/store-verify.ts)를 가져온다. KBizV 에서 2026-10-31 iOS 샌드박스 구매 2건으로 검증됨.
- 지금 코드에서 발견한 것: toss-payment 의 프리미엄 확정이 premium_until 을 "오늘 + 기간"으로 덮어써서, 노출 중에 다시 사면 남은 기간이 사라진다. 새 함수에서는 남은 기간에 이어 붙인다.
- 현재 구조: 웹은 GitHub Pages(moahagwon.com), DB·함수는 supabase.moahagwon.com, 함수 원본은 C:\Users\user\moa-fn\supabase\functions (git 아님). 앱은 capacitor/ (Capacitor 8), Android 는 Codemagic android-capacitor, iOS 는 Codemagic.
- 관련 테이블: premium_plans(code,name,price,days,sort,active), payment_transactions, ad_orders, academies(is_premium, premium_until).
