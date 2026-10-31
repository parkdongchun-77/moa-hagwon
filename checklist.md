# 체크리스트 — 원장님 프리미엄 노출을 App Store·Google Play 결제로 전환

목표: 원장센터 프리미엄 노출 결제를 웹은 토스, 앱(iOS·Android)은 스토어 인앱결제로 둘 다 받는다.
상품 4개(1·3·6·12개월). 학부모 결제는 웹/앱에서 하지 않는다(학원 ↔ PG사 직접 계약).

## 0단계 — 결정 (사용자 승인 필요)
- [x] 가격 확정(2026-10-31 사용자): 1개월 33,000 / 3개월 88,000 / 6개월 165,000 / 12개월 297,000 (부가세 포함, 웹·앱 같은 가격)
- [x] 웹·앱 둘 다 결제 (2026-10-31 사용자 결정) — 웹 브라우저는 토스, 앱은 스토어
- [ ] 앱 안에서는 웹 결제를 안내하거나 링크하지 않는다 (Apple·Google 규정). 지금 앱의 "moahagwon.com 에서 결제해 주세요" 문구 제거

## 1단계 — DB (운영 DB 적용은 사용자 승인 뒤)
- [x] (작성·검사 끝, 운영 적용 대기) premium_plans 에 1·3·6·12개월 4개 (code = 스토어 상품 ID 와 같게: premium_1m·premium_3m·premium_6m·premium_12m), 기존 30일·90일 active=false
- [x] (작성·검사 끝) payment_transactions 에 store_tx_id(유일), platform 열 — 같은 영수증 두 번 적립 방지
- [x] (작성·검사 끝) 노출 기간 연장 규칙 — extend_premium(academy, days), 서비스 키만 실행: 노출 중에 사면 premium_until 에서 이어 붙인다 (지금은 오늘부터 다시 계산해 남은 기간이 사라진다)
      → verify: 테스트 SQL — 신규/연장/만료 뒤 재시작/중복 영수증/권한 ALL PASS (한 트랜잭션 rollback, 운영 DB 변화 없음 확인)
      파일: C:\\Users\\user\\moa-fn\\sql\\2026-10-31-premium-store-iap.sql (+ _test.sql)
- [x] 운영 DB 적용 (2026-10-31 19:43, 사용자 승인) — 백업 /root/moa-backups/db-20261031-premium-iap/premium_tables.sql, 상품 4개 활성·30·90일 비활성, extend_premium 서비스 키만 실행 확인

## 2단계 — 영수증 확인 함수 (KBizV verify-credit-purchase 재사용)
- [ ] functions/verify-premium-purchase: {platform, sku, transactionId, academy_id} → Apple·Google 서버 조회 → 학원 소유자 확인 → 기간 적용
- [ ] 비밀값: APPLE_IAP_KEY_ID·ISSUER_ID·PRIVATE_KEY·BUNDLE_ID, PLAY_SERVICE_ACCOUNT, ANDROID_PACKAGE_NAME (사용자가 직접 입력)
      → verify: 가짜 영수증으로 verification_failed, 키 오류면 server_error

## 3단계 — 앱 화면 (index.html + capacitor)
- [ ] @capgo/native-purchases (Capacitor 8 대응판) 추가
- [ ] 원장센터 요금제 버튼: 앱이면 스토어 결제 → 영수증 확인 함수, 웹 브라우저면 지금 토스 결제(tossPay) 그대로
- [ ] iOS 앱에서 홍보·결제를 숨기던 분기(renderPromoDash 의 isIosApp) 해제
- [ ] 결제 중 버튼 중복 차단, 실패 알림에 실제 오류 문구 (KBizV 에서 겪은 문제)
- [ ] 앱에서 웹 결제로 보내는 안내 문구 제거 (tossPay 의 "moahagwon.com 에서 결제해 주세요")
- [ ] 학부모용 토스 결제 코드(payTuition·지역화폐)는 쓰지 않으면 정리 — 원장 프리미엄 웹 결제는 유지
- [ ] toss-payment 프리미엄 확정도 남은 기간에 이어 붙이도록 같은 규칙으로 고침
      → verify: 문법 검사, 웹·앱 화면 확인

## 4단계 — 스토어 상품 등록 (사용자가 확인 버튼)
- [ ] App Store Connect: 비갱신형 구독 4개 (기간제 이용권), 현지화 ko, 가격, 심사 스크린샷
- [ ] Google Play: 일회성 상품 4개, 가격, 활성화
- [ ] 라이선스 테스터·샌드박스 계정

## 5단계 — 빌드·테스트
- [ ] Android AAB → 내부 테스트 트랙, iOS → Codemagic → TestFlight
- [ ] 실제 테스트 결제로 premium_until·결제 내역 확인 (신규·연장 둘 다)

## 6단계 — 안내 문서
- [ ] pricing.html: 4개 상품, 결제 수단을 "웹: 신용카드·계좌이체 / 앱: App Store·Google Play 인앱결제"로
- [ ] refund.html: 웹 결제는 지금 규칙(일할 환불), 앱 결제는 Apple·Google 환불 정책. "1회 최고 88,000원" → 297,000원
- [ ] 토스 상점관리자에 최고 결제 금액 변경 알림이 필요한지 확인 (사용자)
- [ ] terms.html 결제 조항 확인
- [ ] 첫 인앱 상품은 새 앱 버전과 함께 심사 제출 (iOS)
