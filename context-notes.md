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
- 가격 확정(사용자): 33,000 / 88,000 / 165,000 / 297,000. 토스는 계약서가 아직 안 와서 보류 — 웹 결제 화면·코드는 만들되 계약 전에는 꺼 둔다.
- 발견: 운영 함수의 TOSS_SECRET_KEY 가 test_ 키다. 지금 웹에서 결제하면 토스 테스트 결제로 돈은 안 나가는데 프리미엄은 켜진다(지금까지 결제 완료 0건, 미결제 3건). 3단계에서 test 키일 때는 프리미엄을 켜지 않도록 서버에서 막는다.
- 1단계 SQL 은 moa-fn/sql 에 둔다(moa-fn 은 git 아님). 상품 code 를 스토어 상품 ID 로 쓴다: premium_1m·premium_3m·premium_6m·premium_12m. 예전 premium_30·90 은 지난 주문이 FK 로 참조해서 지우지 않고 active=false.
- 만료는 기존 cron moa-premium-expire(매일 23:30 UTC)가 처리하므로 새 함수는 켜기·연장만 한다.
- 함수 원본은 moa-fn(git 아님)에 두고, 배포 전 백업은 서버 /root/moa-backups/fn-20261031-premium-iap/ (toss-payment, docker-compose.yml).
- verify-premium-purchase 는 토큰을 /auth/v1/user 로 확인한다(toss-payment 의 uidOf 는 서명 확인 없이 JWT 를 읽는다 — 관문(VERIFY_JWT)에 기대는 구조). 영수증 한 건 = payment_transactions 한 줄(order_id = platform:tx). paid 로 먼저 바꾼 요청만 extend_premium 을 부른다.
- Apple 은 같은 계정(동춘 박)에 모아학원 앱(6801823750)이 있어 KBizV 와 같은 .p8(7W6272CJ2D) 키를 쓸 수 있다. 상품 ID: premium_1m 6829190913, premium_3m 6829191011, premium_6m 6829190700, premium_12m 6829191043.
- Apple KOR 가격대에 297,000 이 없다(가까운 값 295,000·299,000). 12개월 가격 결정 대기.
- Google: emoi 서비스 계정이 모아학원 앱을 읽을 수는 있지만 상품 생성은 403. 영수증 확인에도 재무 데이터 권한이 필요하다.
- 12개월 가격: 웹·앱·Google 모두 295,000 으로 통일(사용자, 10/31). premium_plans 운영 DB 수정, Apple 12개월 가격 설정. Google 은 결제 권한이 든 빌드가 올라가기 전에는 인앱 상품을 못 만든다.
- 10/31 20:42 iPhone TestFlight 1.0.6(21) 샌드박스 결제 premium_1m 성공 — payment_transactions 23 paid, 181493 학원 노출 11/30까지 켜짐 확인. 실제 학원이라 확인 후 노출을 되돌리고 23번은 test_mode=true 로 표시.
- 결제 뒤 요금제 버튼이 사라진 건 정상 동작(노출 중인 학원에는 결제 버튼을 숨김) — 연장 결제를 못 하는 문제로 이어지므로 원장센터 상단에 항상 보이는 프리미엄 카드로 바꾸는 안을 제안.
