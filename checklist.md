# 체크리스트 — 원장님 프리미엄 노출을 App Store·Google Play 결제로 전환

목표: 원장센터의 프리미엄 노출 결제를 토스 결제창에서 스토어 인앱결제(iOS·Android 앱)로 바꾼다.
상품 4개(1·3·6·12개월). 학부모 결제는 웹/앱에서 하지 않는다(학원 ↔ PG사 직접 계약).

## 0단계 — 결정 (사용자 승인 필요)
- [ ] 가격 확정: 1개월 33,000 / 3개월 88,000 / 6개월 165,000 / 12개월 297,000 (부가세 포함)
- [ ] 스토어 수수료 15% 감안 여부 (가격 그대로 둘지)
- [ ] 웹 브라우저(moahagwon.com)에서는 결제 대신 "앱에서 결제" 안내만 보여 줄지 (기본안)

## 1단계 — DB (운영 DB 적용은 사용자 승인 뒤)
- [ ] premium_plans 에 1·3·6·12개월 4개 (code = 스토어 상품 ID 와 같게: premium_1m·premium_3m·premium_6m·premium_12m), 기존 30일·90일 active=false
- [ ] payment_transactions 에 store_tx_id(유일), platform 열 — 같은 영수증 두 번 적립 방지
- [ ] 노출 기간 연장 규칙: 노출 중에 사면 premium_until 에서 이어 붙인다 (지금은 오늘부터 다시 계산해 남은 기간이 사라진다)
      → verify: 테스트 SQL — 신규/연장/중복 영수증 3가지

## 2단계 — 영수증 확인 함수 (KBizV verify-credit-purchase 재사용)
- [ ] functions/verify-premium-purchase: {platform, sku, transactionId, academy_id} → Apple·Google 서버 조회 → 학원 소유자 확인 → 기간 적용
- [ ] 비밀값: APPLE_IAP_KEY_ID·ISSUER_ID·PRIVATE_KEY·BUNDLE_ID, PLAY_SERVICE_ACCOUNT, ANDROID_PACKAGE_NAME (사용자가 직접 입력)
      → verify: 가짜 영수증으로 verification_failed, 키 오류면 server_error

## 3단계 — 앱 화면 (index.html + capacitor)
- [ ] @capgo/native-purchases (Capacitor 8 대응판) 추가
- [ ] 원장센터 요금제 버튼: 앱이면 스토어 결제 → 영수증 확인 함수, 웹이면 "앱에서 결제" 안내
- [ ] iOS 앱에서 홍보·결제를 숨기던 분기(renderPromoDash 의 isIosApp) 해제
- [ ] 결제 중 버튼 중복 차단, 실패 알림에 실제 오류 문구 (KBizV 에서 겪은 문제)
- [ ] 토스 결제 코드(tossPay·handleTossRedirect·payTuition·지역화폐)는 원장 프리미엄에서 떼어 내고, 쓰는 곳이 없어지면 제거
      → verify: 문법 검사, 웹·앱 화면 확인

## 4단계 — 스토어 상품 등록 (사용자가 확인 버튼)
- [ ] App Store Connect: 비갱신형 구독 4개 (기간제 이용권), 현지화 ko, 가격, 심사 스크린샷
- [ ] Google Play: 일회성 상품 4개, 가격, 활성화
- [ ] 라이선스 테스터·샌드박스 계정

## 5단계 — 빌드·테스트
- [ ] Android AAB → 내부 테스트 트랙, iOS → Codemagic → TestFlight
- [ ] 실제 테스트 결제로 premium_until·결제 내역 확인 (신규·연장 둘 다)

## 6단계 — 안내 문서
- [ ] pricing.html: 4개 상품, 결제 수단을 "App Store·Google Play 인앱결제"로
- [ ] refund.html: 환불은 Apple·Google 정책을 따른다로, "1회 최고 88,000원" 문구 수정
- [ ] terms.html 결제 조항 확인
- [ ] 첫 인앱 상품은 새 앱 버전과 함께 심사 제출 (iOS)
