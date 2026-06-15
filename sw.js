// 모아학원 웹푸시 서비스워커 — 출석 푸시 알림 수신·표시 + 앱 셸 캐싱(설치형 PWA)
const CACHE = "moa-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// 네트워크 우선, 실패 시 캐시 (오프라인에서도 최소 동작)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 외부 API/CDN은 그대로
  event.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
self.addEventListener("push", (event) => {
  let d = { title: "모아학원", body: "", url: "https://parkdongchun-77.github.io/moa-hagwon/" };
  try { d = Object.assign(d, event.data.json()); } catch (e) { if (event.data) d.body = event.data.text(); }
  event.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    icon: "https://parkdongchun-77.github.io/moa-hagwon/icon-192.png",
    badge: "https://parkdongchun-77.github.io/moa-hagwon/icon-192.png",
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
