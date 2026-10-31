# 체크리스트 — 원장님 프리미엄 노출을 App Store·Google Play 결제로 전환

목표: 원장센터 프리미엄 노출 결제를 웹은 토스, 앱(iOS·Android)은 스토어 인앱결제로 둘 다 받는다.
상품 4개(1·3·6·12개월). 학부모 결제는 웹/앱에서 하지 않는다(학원 ↔ PG사 직접 계약).

## 0단계 — 결정 (사용자 승인 필요)
- [x] 가격 확정(2026-10-31 사용자): 1개월 33,000 / 3개월 88,000 / 6개월 165,000 / 12개월 295,000 (부가세 포함, 웹·앱 같은 가격)
- [x] 웹·앱 둘 다 결제 (2026-10-31 사용자 결정) — 웹 브라우저는 토스, 앱은 스토어
- [x] 앱 안에서는 웹 결제를 안내하거나 링크하지 않는다 (Apple·Google 규정). 지금 앱의 "moahagwon.com 에서 결제해 주세요" 문구 제거

## 1단계 — DB (운영 DB 적용은 사용자 승인 뒤)
- [x] (작성·검사 끝, 운영 적용 대기) premium_plans 에 1·3·6·12개월 4개 (code = 스토어 상품 ID 와 같게: premium_1m·premium_3m·premium_6m·premium_12m), 기존 30일·90일 active=false
- [x] (작성·검사 끝) payment_transactions 에 store_tx_id(유일), platform 열 — 같은 영수증 두 번 적립 방지
- [x] (작성·검사 끝) 노출 기간 연장 규칙 — extend_premium(academy, days), 서비스 키만 실행: 노출 중에 사면 premium_until 에서 이어 붙인다 (지금은 오늘부터 다시 계산해 남은 기간이 사라진다)
      → verify: 테스트 SQL — 신규/연장/만료 뒤 재시작/중복 영수증/권한 ALL PASS (한 트랜잭션 rollback, 운영 DB 변화 없음 확인)
      파일: C:\\Users\\user\\moa-fn\\sql\\2026-10-31-premium-store-iap.sql (+ _test.sql)
- [x] 운영 DB 적용 (2026-10-31 19:43, 사용자 승인) — 백업 /root/moa-backups/db-20261031-premium-iap/premium_tables.sql, 상품 4개 활성·30·90일 비활성, extend_premium 서비스 키만 실행 확인

## 2단계 — 영수증 확인 함수 (KBizV verify-credit-purchase 재사용)
- [x] (배포 2026-10-31) functions/verify-premium-purchase: {platform, sku, transactionId, academy_id} → Apple·Google 서버 조회 → 학원 소유자 확인 → 기간 적용
- [x] (사용자 10/31 20:31) 비밀값 넣기 — moa-repo/tools/set-iap-keys.ps1 실행. compose 연결·APPLE_BUNDLE_ID·ANDROID_PACKAGE_NAME 은 완료. 비밀값: APPLE_IAP_KEY_ID·ISSUER_ID·PRIVATE_KEY·BUNDLE_ID, PLAY_SERVICE_ACCOUNT, ANDROID_PACKAGE_NAME (사용자가 직접 입력)
      → verify: 키 없는 지금 가짜 영수증 → server_error(정상), 옛 상품 → unknown_product, 노출 기간 변화 없음. 키 넣은 뒤 가짜 영수증 → android·ios 모두 verification_failed 확인(스토어 인증 정상)

## 3단계 — 앱 화면 (index.html + capacitor)
- [x] @capgo/native-purchases 8.9.6 추가, native.js MoaNative.iapBuy (번들 빌드 확인)
- [x] 원장센터 요금제 버튼: 앱이면 스토어 결제 → 영수증 확인 함수, 웹 브라우저면 지금 토스 결제(tossPay) 그대로
- [x] iOS 앱에서 홍보·결제를 숨기던 분기(6곳)(renderPromoDash 의 isIosApp) 해제
- [x] 결제 중 버튼 중복 차단(_once), 실패 알림에 실제 오류 문구, 실패 알림에 실제 오류 문구 (KBizV 에서 겪은 문제)
- [x] 앱에서 웹 결제로 보내는 안내 문구 제거 (tossPay 의 "moahagwon.com 에서 결제해 주세요")
- [ ] 학부모용 토스 결제 코드(payTuition·지역화폐)는 쓰지 않으면 정리 — 원장 프리미엄 웹 결제는 유지
- [x] (배포) toss-payment: test 키면 프리미엄 판매 막음(web_payment_not_ready), 판매 중 상품만, 확정도 남은 기간에 이어 붙이도록 같은 규칙으로 고침
      → verify: 인라인 스크립트 문법 4개 OK, deno check OK. 앱 화면은 TestFlight·내부 테스트에서 확인

## 4단계 — 스토어 상품 등록 (사용자가 확인 버튼)
- [x] App Store Connect: 비갱신형 구독 4개 생성(현지화 ko, 판매 국가 한국, 1·3·6개월 가격). 12개월은 Apple 가격대에 297,000 이 없어 웹·앱 모두 295,000 으로 통일(사용자 결정, DB·Apple 반영). 남은 것: 심사 스크린샷 (기간제 이용권), 현지화 ko, 가격, 심사 스크린샷
- [x] Google Play: 일회성 상품 4개 생성(10/31 20:2x, 한국·원화, 12개월 295,000) — 4개 활성화 완료(사용자 요청, API, ACTIVE 확인), 가격, 활성화
- [ ] 라이선스 테스터·샌드박스 계정

## 5단계 — 빌드·테스트
- [ ] Android 1.1.3(13) AAB(Codemagic android-capacitor) → 내부 테스트 트랙, iOS 1.0.6 → Codemagic → TestFlight — iOS 1.0.6(21) TestFlight 업로드 완료, Android 1.1.3(13) 내부 테스트 트랙 업로드 완료(10/31 20:2x, play_internal_moa.py)
- [x] iOS 실제 테스트 결제로 premium_until·결제 내역 확인 (신규) — 10/31 20:42 성공. [ ] 연장·Android 는 남음

## 6단계 — 안내 문서
- [x] pricing.html: 4개 상품, 결제 수단을 "웹: 신용카드·계좌이체 / 앱: App Store·Google Play 인앱결제"로
- [x] refund.html: 웹 결제는 지금 규칙(일할 환불), 앱 결제는 Apple·Google 환불 정책. "1회 최고 88,000원" → 297,000원
- [ ] 토스 상점관리자에 최고 결제 금액 변경 알림이 필요한지 확인 (사용자)
- [x] terms.html 결제 조항 확인 — 바꿀 것 없음
- [ ] 첫 인앱 상품은 새 앱 버전과 함께 심사 제출 (iOS)


# 체크리스트 — 프리미엄 노출 자동 갱신 구독 전환 + 원장센터 프리미엄 카드 + 할인 배지 (2026-10-31 사용자 승인)

목표: 앱 결제를 기간제 이용권에서 자동 갱신 구독(1·3·6·12개월)으로 바꾸고, 원장센터 맨 위에 항상 보이는 프리미엄 카드(상태·연장/구독 관리·할인 배지)를 둔다.
웹(토스) 자동 결제는 토스 계약 뒤. 메인 화면 프리미엄 버튼은 제거 완료(2648fc9).

## A. 스토어 상품
- [x] (10/31) Apple: 구독 그룹 "프리미엄 노출"(22531599) + 자동 갱신 구독 4개(premium_sub_1m·3m·6m·12m, ONE_MONTH·THREE_MONTHS·SIX_MONTHS·ONE_YEAR), 현지화 ko, KOR 가격 33,000·88,000·165,000·295,000, 판매 국가 한국
- [x] (10/31) Google: 구독 premium_sub + 기본 요금제 m1·m3·m6·m12(자동 갱신), KR 원화 가격, 활성화
- [x] 오늘 만든 기간제 상품(premium_1m 등)은 판매 중단(Google INACTIVE, Apple 은 제출 안 함) — 구매자는 테스트 1건뿐
      → verify: Apple 4개 201·가격 KOR, Google m1·m3·m6·m12 ACTIVE 33,000·88,000·165,000·295,000

## B. DB (운영 적용은 승인 뒤)
- [x] (운영 적용 20:54, 백업 /root/moa-backups/db-20261031-premium-sub) premium_plans: 구독 상품 4개(code = Apple 상품 ID, google_base_plan 열 추가), 기간제 4개 active=false
- [x] payment_transactions: expires_at, original_tx_id, auto_renew 열 — 구독 한 건을 계속 추적
- [x] set_premium_until(academy, until) + cron moa-premium-sub-sync(20:20 UTC): 스토어가 알려 준 만료일까지 노출(지금 값보다 짧게 줄이지 않음), 서비스 키만
      → verify: rollback 테스트 ALL PASS 후 적용

## C. 서버 함수
- [x] (배포) verify-premium-purchase: 구독이면 Apple expiresDate·originalTransactionId / Google subscriptionsv2 expiryTime 으로 만료일 적용, 구독 승인(acknowledge)
- [x] (배포) premium-sub-sync(매일 cron): 활성 구독을 스토어에 다시 물어 갱신되면 만료일 연장, 해지·환불이면 그대로 만료되게 둔다 — 알림 서버(Pub/Sub) 없이 처리
      → verify: deno check OK, 가짜 구독 영수증 android·ios verification_failed, sync 키 없으면 forbidden·있으면 ok

## D. 앱·웹 화면
- [x] 원장센터 맨 위 "⭐ 프리미엄 노출" 카드: 노출 전 = 요금제 4개 + ⚡할인 배지(3개월 11%·6개월 17% 추천·12개월 26%), 노출 중 = "노출 중 · D-n" + 구독 관리/연장
- [x] 구독 안내 문구(자동 갱신·해지 방법), 이용약관·개인정보처리방침 링크, 구매 복원 버튼 (Apple 3.1.2)
- [x] 앱 결제 호출: productType subs, Android planIdentifier
      → verify: 인라인 스크립트 4개 OK, 번들 빌드 OK. TestFlight 화면은 남음

## E. 안내 문서
- [x] pricing.html·refund.html: 앱 결제는 자동 갱신 구독, 해지 방법(App Store·Google Play 구독 관리), 웹은 준비 중
- [ ] App Store 설명에 이용약관(EULA) 링크 — 1.0.6 버전을 ASC 에 만들 때 넣는다

## F. 빌드·테스트·심사
- [ ] iOS 1.0.6 새 빌드(아직 심사 전), Android 1.1.4(14) 내부 트랙 — iOS 1.0.6(22) TestFlight 업로드, Android 1.1.4(14) 내부 트랙 업로드 완료(10/31 21:2x)
- [ ] (21:3x 실패 — 샌드박스 반영 대기 후 재시험) 샌드박스 구독 결제 → 노출 켜짐, 샌드박스 자동 갱신(5분 주기) 반영 확인 → 테스트 노출 되돌림
- [ ] 구독 심사 스크린샷(4개 업로드 완료 10/31) → 1.0.6 과 함께 심사 제출
