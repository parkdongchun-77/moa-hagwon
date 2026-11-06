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

## 2026-10-31 저녁 — 자동 갱신 구독 전환 검토 결과 (사용자: 문제 없으면 진행)
- 원장 8명 모두 학원 1곳 — 구독은 스토어 계정당 같은 상품을 하나만 살 수 있어 여러 학원 원장은 두 번째 학원을 앱 구독으로 못 산다. 지금은 해당자 없음, 생기면 웹 결제로.
- 갱신 반영은 스토어 알림 서버(Apple 알림 URL·Google Pub/Sub) 대신 매일 서버가 스토어에 직접 물어보는 방식(premium-sub-sync)으로 한다. 구글 클라우드 설정이 필요 없고, 갱신 반영이 하루 늦어도 노출 만료일이 다음 결제 주기만큼 남아 있어 끊기지 않는다.
- Apple 3.1.2 요건: 결제 화면에 자동 갱신·기간·가격·해지 안내, 이용약관(EULA)·개인정보처리방침 링크, 구매 복원 버튼.
- 원장센터 안에 두기로 함(사용자 동의) — 사는 사람이 원장님뿐이라 메인 화면에 두지 않는다. 노출 중에도 카드가 보이고 연장·구독 관리 가능.
- 오늘 만든 기간제(비갱신) 상품은 쓰지 않는다. 판매만 내리고 기록은 둔다.
- 10/31 21:3x 구독 샌드박스 결제가 결제 단계에서 실패(서버 기록 없음). 앞선 karmadc070 결제는 기간제 premium_1m 이라 구독 이력 아님. 새 구독 상품의 샌드박스 반영 지연이 유력 — 오류 괄호 문구 확인 필요, 몇 시간 뒤 재시험.
- 구독 4개 심사 스크린샷: 사용자 업로드가 저장되지 않아 사용자 카드 캡처를 1290x2796 으로 맞춰 올림(COMPLETE).


## 2026-11-01 — AdSense '가치가 별로 없는 콘텐츠' 대응 (사용자 승인 17:39)
- AdSense(pub-9553196987277637) moahagwon.com 상태 '주의 필요 · 가치가 별로 없는 콘텐츠'(11/1 02:31 메일). ads.txt 는 승인됨.
- 원인 판단: 공공데이터로 만든 학원 페이지 3,692개(본문 50단어 안팎)와 지역 페이지 233개가 사이트 대부분을 차지하고, 직접 쓴 글은 칼럼 9편뿐.
- 지역 페이지 판단 기준: 링크·목록·표·제목을 뺀 설명 글 800자 이상이면 색인 유지. 실제 233개 모두 337~429자이고 서로 같은 틀(숫자만 다름, 유사도 0.67)이라 전부 noindex. 허브(지역/index.html)도 목록 페이지라 noindex.
- 학원 페이지는 지우지 않고 noindex, follow 만 넣어 사용자·앱 링크는 그대로 둔다. 매주 도는 tools/gen_pages.py 에도 meta 를 넣어 재생성 때 유지된다.
- 지역/ 페이지 생성 스크립트는 repo 안에서 찾지 못했다(파일 주석에 '스크립트로 생성됨'). 다시 생성하면 noindex 가 빠지므로 그 스크립트를 찾으면 같은 meta 를 넣어야 한다.
- 다음: 정보성 칼럼 25~30편(2,000자 이상, 홍보는 끝에 한두 줄) → 색인 확인 → 재검토 신청.

## 2026-11-05 iOS 1.0.6 + 자동 갱신 구독 심사 제출

- 원인: 아이폰 TestFlight 에서 "Cannot find product for id premium_sub_1m". 구독 4개가 KOR 가격 1개만 있고 나머지 174개 지역 가격이 없어 실제로 MISSING_METADATA(제출 시 STATE_ERROR.IAP_SUBMISSION_NOT_ALLOWED_MISSING_PRICING_DATA). 판매 국가는 그대로 KOR 1곳.
- 조치: 4개 구독 모두 KOR 가격(33,000/88,000/165,000/295,000)의 Apple 균등 가격점(equalizations)으로 174개 지역 가격 추가 → 175개. KOR 가격 변동 없음.
- 1.0.6 버전 생성(빌드 22), 설명 끝에 구독 안내 + 이용약관(EULA) https://moahagwon.com/terms.html · 개인정보 https://moahagwon.com/privacy.html (둘 다 200 확인), 새 기능 문구, 심사 메모 맨 위에 1.0.6 구독 위치 안내 추가(데모 계정 그대로).
- 11:12 제출: 버전 1.0.6 + premium_sub_1m + premium_sub_12m + 그룹(Premium Listing) → WAITING_FOR_REVIEW.
- premium_sub_3m·6m 은 '첫 자동 갱신 구독은 새 앱 버전으로 제출' 제약으로 이번 제출에 못 들어감(제출 초안에 3M 만 대기). 1.0.6 승인 뒤 3m·6m 을 따로 심사에 추가해야 함.
- 가격 보완 뒤라 TestFlight 1.0.6 에서 구독 상품 조회가 될 가능성이 있음 — 재시험 필요.
## 2026-11-06 원장 프리미엄 노출 1개월 무료 체험 (사용자 승인: 웹·앱 둘 다, 웹 배너)
- 서버: verify-premium-purchase·_shared/store-verify.ts — Apple offerType=1+FREE_TRIAL, Google lineItems[].offerPhase.freeTrial 이면 payment_transactions amount 0·meta.trial=true. 백업 *.bak-trial-20261106-143326, moa-edge-functions 재시작, 익명 호출 unauthenticated 정상. (deno check 는 컨테이너에 deno 가 없어 못 함)
- DB: vps-scripts(모아학원 폴더) 60-premium-trial.sql — premium_trials(학원 PK·원장 unique) + start_premium_trial(p_academy) SECURITY DEFINER: 본인 학원, 노출 중 아님, 체험·유료 결제 이력 없음 → extend_premium 30일. 롤백 테스트 통과(남의 학원 not_owner / 정상 / 노출 중 already_premium / 만료 뒤 trial_used / 익명 거부). 운영 적용 + PostgREST 리로드, REST 익명 401.
- 웹(409e7e5): 검색 화면 주황 배너(앱 안 숨김·닫기 기억 moa_trial_dismissed) → 로그인 → 원장센터. 원장센터 프리미엄 카드에 노출 중 아닌 학원 + 체험 미사용이면 '1개월 무료 체험 시작' 버튼(웹만).
- /a/ (ffb6510): 원장 미등록 학원 페이지에 '이 학원 원장님이세요? … 1개월 무료로 체험' → /?go=owner. 3,679 페이지 재생성.
- Play: premium_sub m1·m3·m6·m12 에 오퍼 trial-1m(P1M 무료, KR, 앱 첫 구독자) ACTIVE.
- Android 1.1.6(16) (1079c6d·10b59ab): Codemagic 에서 @capgo/native-purchases 를 고쳐 같은 요금제의 오퍼 중 offerId 있는(체험) 것을 고른다. 앱 구독 안내에 '처음 구독하면 첫 1개월은 무료 체험' 줄.
- 주의: 이 안내 줄은 index.html 에 있어 다음 iOS 빌드에도 들어간다 → 다음 iOS 빌드 전에 App Store 도입 오퍼(무료 체험)를 꼭 켠다.
- 허점(감수): 웹 체험을 쓴 원장도 앱에서 스토어 체험을 한 번 더 받을 수 있다(스토어는 우리 이력을 모름).
- 2026-11-06 베스트 광고 순환(사용자 결정: 광고 학원이 2~3곳 넘으면 돌아가며 보여 주기만): best_academies 를 바꿔 프리미엄 학원은 최대 3곳만 맨 위, 넘으면 부를 때마다 무작위 3곳. 나머지 자리는 기존대로 주간·전체 수강생 순(뽑히지 않은 광고 학원도 수강생 순으로 들어감). 순위 배지는 그대로. 스크립트 모아학원\vps-scripts\61-best-ad-rotation.sql, 백업 /root/backups/best_academies.bak-20261106.sql. 롤백 테스트: 화성시 수학 광고 5곳 → 위 3칸만 AD, 부를 때마다 다른 조합, 전국 77ms·시군구 39ms. 운영 적용 후 웹 베스트 목록 정상. 검색 결과 목록(프리미엄 우선)은 손대지 않았다.
- 2026-11-06 Android 1.1.6(16) Codemagic 빌드 11 성공(체험 오퍼 패치 로그 'patched' 확인) → Play 내부 테스트 업로드(emoi-tmp\play_internal_moa_116.py). 프로덕션은 1.1.5(15).
- 2026-11-06 15:4x 사용자 변경: 베스트 광고 칸 3곳 → 5곳(61-best-ad-rotation.sql 재적용, 롤백 테스트 광고 7곳 → 위 5칸 AD·조합 변동). 
- 2026-11-06 사용자가 내부 테스트 1.1.6 에서 Google Play 결제창 '1개월 무료' 표시 확인 → Android 1.1.6(16) 프로덕션 100% 출시(Google 검토 후 반영).
- 2026-11-06 iOS 1.0.7(23)·구독 4개 Apple 승인, 1.0.7 판매 중. 구독 4개에 도입 오퍼 FREE_TRIAL ONE_MONTH(KOR) 추가(iris subscriptionIntroductoryOffers 201). 1.0.7 앱에는 체험 안내 줄이 없지만 결제창에 체험이 나온다. 다음 iOS 빌드부터 안내 줄 포함.
- 남은 것: 원장님 체험 안내 푸시 — Android 1.1.6 Google 검토가 끝난 뒤 보낸다(1.1.5 는 체험 오퍼를 못 고를 수 있음).
