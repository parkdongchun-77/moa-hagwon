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
    name: '이름', contact: '연락처 (전화번호 또는 이메일)', msg: '문의 내용', send: '보내기',
    ok: '문의가 접수되었습니다. 곧 연락드릴게요.', err: '보내지 못했어요. 잠시 후 다시 시도해 주세요.',
    busy: '문의가 너무 많아요. 10분 뒤에 다시 보내 주세요.', need: '세 칸을 모두 채워 주세요.'
  } : {
    title: 'Tư vấn <small>상담 받기</small>', sub: 'Để lại câu hỏi, chúng tôi sẽ liên hệ sớm. <small>문의를 남겨 주시면 연락드릴게요.</small>',
    name: 'Họ tên <small>이름</small>', contact: 'SĐT / Email / Zalo <small>연락처</small>',
    msg: 'Nội dung <small>문의 내용</small>', send: 'Gửi <small>보내기</small>',
    ok: 'Đã nhận yêu cầu, chúng tôi sẽ liên hệ sớm. <small>접수되었습니다.</small>',
    err: 'Chưa gửi được, vui lòng thử lại. <small>잠시 후 다시 시도해 주세요.</small>',
    busy: 'Bạn đã gửi nhiều lần, thử lại sau 10 phút. <small>10분 뒤 다시 보내 주세요.</small>',
    need: 'Vui lòng điền đủ 3 ô. <small>세 칸을 모두 채워 주세요.</small>'
  };

  var css = '#contact-form{max-width:560px;margin:48px auto;padding:28px 22px;border:1px solid rgba(127,127,127,.25);border-radius:16px;font:inherit;color:inherit;box-sizing:border-box}' +
    '#contact-form h2{margin:0 0 6px;font-size:1.5em}#contact-form small{font-size:.72em;opacity:.7;font-weight:normal}' +
    '#contact-form p{margin:0 0 16px;opacity:.85}#contact-form label{display:block;margin:12px 0 4px;font-weight:600}' +
    '#contact-form input,#contact-form textarea{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid rgba(127,127,127,.4);border-radius:10px;font:inherit;background:transparent;color:inherit}' +
    '#contact-form textarea{min-height:110px;resize:vertical}#contact-form .cf-hp{position:absolute;left:-9999px}' +
    '#contact-form button{margin-top:16px;width:100%;padding:13px;border:0;border-radius:10px;background:#111;color:#fff;font:inherit;font-weight:700;cursor:pointer}' +
    '#contact-form button:disabled{opacity:.5}#contact-form .cf-msg{margin-top:12px;min-height:1.2em}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  box.innerHTML = '<h2>' + T.title + '</h2><p>' + T.sub + '</p>' +
    '<form novalidate><label>' + T.name + '</label><input name="name" maxlength="100" autocomplete="name">' +
    '<label>' + T.contact + '</label><input name="contact" maxlength="200" autocomplete="email">' +
    '<label>' + T.msg + '</label><textarea name="message" maxlength="3000"></textarea>' +
    '<input class="cf-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<button type="submit">' + T.send + '</button><div class="cf-msg" role="status"></div></form>';

  var f = box.querySelector('form'), el = f.elements, out = box.querySelector('.cf-msg'), btn = f.querySelector('button');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (el.website.value) { out.innerHTML = T.ok; f.reset(); return; } // form.name 은 폼 속성이라 elements 로 꺼낸다. 봇이 숨은 칸을 채우면 보낸 척만 한다
    var d = { name: el.name.value.trim(), contact: el.contact.value.trim(), message: el.message.value.trim() };
    if (!d.name || d.contact.length < 3 || !d.message) { out.innerHTML = T.need; return; }
    d.page = location.pathname.slice(0, 300);
    d.lang = (document.documentElement.lang || LANG).slice(0, 10);
    btn.disabled = true; out.textContent = '…';
    fetch(API + '/rest/v1/contact_inquiries', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(d)
    }).then(function (r) {
      if (r.ok) { out.innerHTML = T.ok; f.reset(); }
      else return r.json().then(function (j) { out.innerHTML = /too many/.test(j.message || '') ? T.busy : T.err; });
    }).catch(function () { out.innerHTML = T.err; })
      .then(function () { btn.disabled = false; });
  });
})();
