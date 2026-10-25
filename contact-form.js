// 홈페이지 하단 '상담 받기' 폼을 그려 문의를 각 앱 DB(contact_inquiries)에 익명으로 넣는 공용 위젯
// 사용: <div id="contact-form"></div><script src="/contact-form.js" data-api="https://api.x.com" data-key="ANON_KEY" data-lang="vi|ko" defer></script>
(function () {
  var me = document.currentScript;
  var API = me.dataset.api, KEY = me.dataset.key, LANG = me.dataset.lang || 'vi';
  var box = document.getElementById('contact-form');
  if (!box || !API || !KEY) return;

  // 모아학원 외에는 베트남어를 크게, 한국어를 작게 쓴다(사용자 지시)
  var T = LANG === 'ko' ? {
    title: '상담 받기', sub: '궁금한 점을 남겨 주시면 빠르게 연락드릴게요.',
    academy: '학원명', name: '성함', contact: '연락처', msg: '문의 내용', send: '보내기',
    ok: '<b>✓ 문의가 접수되었습니다</b>빠르게 답장드리겠습니다.', err: '보내지 못했어요. 잠시 후 다시 시도해 주세요.',
    busy: '문의가 너무 많아요. 10분 뒤에 다시 보내 주세요.', need: '네 칸을 모두 채워 주세요.'
  } : {
    title: 'Tư vấn <small>상담 받기</small>', sub: 'Để lại câu hỏi, chúng tôi sẽ liên hệ sớm. <small>문의를 남겨 주시면 연락드릴게요.</small>',
    name: 'Họ tên <small>이름</small>', contact: 'SĐT / Email / Zalo <small>연락처</small>',
    msg: 'Nội dung <small>문의 내용</small>', send: 'Gửi <small>보내기</small>',
    ok: 'Đã nhận yêu cầu, chúng tôi sẽ liên hệ sớm. <small>접수되었습니다.</small>',
    err: 'Chưa gửi được, vui lòng thử lại. <small>잠시 후 다시 시도해 주세요.</small>',
    busy: 'Bạn đã gửi nhiều lần, thử lại sau 10 phút. <small>10분 뒤 다시 보내 주세요.</small>',
    need: 'Vui lòng điền đủ 3 ô. <small>세 칸을 모두 채워 주세요.</small>'
  };

  // 사이트 색(--p 남색)을 따르는 카드형 디자인 (2026-10-25 사용자 요청)
  var css = '#contact-form{max-width:560px;margin:48px auto;padding:0 0 26px;border:1px solid var(--line,#e2e8f0);border-radius:20px;background:var(--card,#fff);box-shadow:0 12px 32px rgba(79,70,229,.10);font:inherit;color:inherit;box-sizing:border-box;overflow:hidden}' +
    '#contact-form .cf-head{padding:24px 24px 20px;background:linear-gradient(135deg,var(--p,#4f46e5),var(--p2,#6366f1));color:#fff}' +
    '#contact-form h2{margin:0 0 6px;font-size:1.45em}#contact-form small{font-size:.72em;opacity:.7;font-weight:normal}' +
    '#contact-form .cf-head p{margin:0;opacity:.9}#contact-form form{padding:6px 24px 0}' +
    '#contact-form label{display:block;margin:16px 0 6px;font-weight:600;font-size:.95em}' +
    '#contact-form input,#contact-form textarea{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid var(--line,#e2e8f0);border-radius:12px;font:inherit;background:var(--bg,#f6f7fb);color:inherit;transition:border-color .15s,box-shadow .15s}' +
    '#contact-form input:focus,#contact-form textarea:focus{outline:0;border-color:var(--p,#4f46e5);box-shadow:0 0 0 3px rgba(79,70,229,.15);background:var(--card,#fff)}' +
    '#contact-form textarea{min-height:120px;resize:vertical}#contact-form .cf-hp{position:absolute;left:-9999px}' +
    '#contact-form button{margin-top:22px;width:100%;padding:14px;border:0;border-radius:12px;background:linear-gradient(135deg,var(--p,#4f46e5),var(--p2,#6366f1));color:#fff;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 6px 16px rgba(79,70,229,.25)}' +
    '#contact-form button:disabled{opacity:.5}#contact-form .cf-msg{margin-top:14px;min-height:1.2em}' +
    '#contact-form .cf-msg.ok{padding:14px 16px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}#contact-form .cf-msg.ok b{display:block;margin-bottom:2px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  box.innerHTML = '<div class="cf-head"><h2>' + T.title + '</h2><p>' + T.sub + '</p></div>' +
    '<form novalidate>' + (T.academy ? '<label>' + T.academy + '</label><input name="academy" maxlength="100" autocomplete="organization">' : '') +
    '<label>' + T.name + '</label><input name="name" maxlength="100" autocomplete="name">' +
    '<label>' + T.contact + '</label><input name="contact" maxlength="200" autocomplete="email">' +
    '<label>' + T.msg + '</label><textarea name="message" maxlength="3000"></textarea>' +
    '<input class="cf-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<button type="submit">' + T.send + '</button><div class="cf-msg" role="status"></div></form>';

  var f = box.querySelector('form'), el = f.elements, out = box.querySelector('.cf-msg'), btn = f.querySelector('button');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (el.website.value) { out.innerHTML = T.ok; f.reset(); return; } // form.name 은 폼 속성이라 elements 로 꺼낸다. 봇이 숨은 칸을 채우면 보낸 척만 한다
    out.className = 'cf-msg';
    var d = { name: el.name.value.trim(), contact: el.contact.value.trim(), message: el.message.value.trim() };
    var academy = el.academy ? el.academy.value.trim() : null;
    if (!d.name || d.contact.length < 3 || !d.message || academy === '') { out.innerHTML = T.need; return; }
    if (academy) d.message = ('학원명: ' + academy + '\n' + d.message).slice(0, 3000); // DB 칸을 늘리지 않고 문의 내용 첫 줄에 넣는다
    d.page = location.pathname.slice(0, 300);
    d.lang = (document.documentElement.lang || LANG).slice(0, 10);
    btn.disabled = true; out.textContent = '…';
    fetch(API + '/rest/v1/contact_inquiries', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(d)
    }).then(function (r) {
      if (r.ok) { out.innerHTML = T.ok; out.className = 'cf-msg ok'; f.reset(); }
      else return r.json().then(function (j) { out.innerHTML = /too many/.test(j.message || '') ? T.busy : T.err; });
    }).catch(function () { out.innerHTML = T.err; })
      .then(function () { btn.disabled = false; });
  });
})();
