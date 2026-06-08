// 모아학원 웹푸시 서비스워커 — 출석 푸시 알림 수신·표시
self.addEventListener("push", (event) => {
  let d = { title: "모아학원", body: "", url: "https://parkdongchun-77.github.io/moa-hagwon/" };
  try { d = Object.assign(d, event.data.json()); } catch (e) { if (event.data) d.body = event.data.text(); }
  event.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    icon: "https://api.qrserver.com/v1/create-qr-code/?size=8x8&data=x", // placeholder
    badge: undefined,
    data: { url: d.url },
    tag: "moa-att",
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "https://parkdongchun-77.github.io/moa-hagwon/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if (c.url.includes("moa-hagwon") && "focus" in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
