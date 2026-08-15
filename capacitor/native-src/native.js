// 네이티브(iOS/Android) 전용 기능을 window.MoaNative 로 노출하는 번들 진입점 — esbuild로 묶여 앱 www에만 주입된다
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { CapacitorBarcodeScanner } from "@capacitor/barcode-scanner";
import { SignInWithApple } from "@capacitor-community/apple-sign-in";
import { Geolocation } from "@capacitor/geolocation";

// 문서의 Html5QrcodeSupportedFormats 표 기준 QR_CODE = 0 (플러그인이 이 enum을 재수출하지 않아 값을 직접 쓴다)
const HINT_QR_CODE = 0;

// iOS WKWebView는 navigator.geolocation 을 기본 제공하지 않는다.
// index.html은 navigator.geolocation 만 쓰므로, 플러그인으로 같은 모양의 API를 덮어써서 코드 변경 없이 동작시킨다.
// 주의: navigator.geolocation 은 getter만 있는 접근자라 단순 대입은 조용히 무시된다. 반드시 defineProperty 를 써야 한다.
function shimGeolocation() {
  const watches = new Map();
  const impl = {
    getCurrentPosition(ok, err, opts) {
      Geolocation.getCurrentPosition(opts).then(ok).catch(err || (() => {}));
    },
    watchPosition(ok, err, opts) {
      const key = Date.now() + Math.random();
      Geolocation.watchPosition(opts || {}, (pos, e) => {
        if (e) { if (err) err(e); return; }
        ok(pos);
      }).then((id) => watches.set(key, id));
      return key;
    },
    clearWatch(key) {
      const id = watches.get(key);
      if (id) { Geolocation.clearWatch({ id }); watches.delete(key); }
    },
  };
  Object.defineProperty(navigator, "geolocation", { value: impl, configurable: true, writable: true });
  return navigator.geolocation === impl;
}

// 출석 QR 스캔. 성공하면 스캔된 문자열, 사용자가 취소하면 null 을 돌려준다.
// 플러그인은 취소 시 reject 하므로 여기서 삼켜야 "스캔 실패" 토스트가 잘못 뜨지 않는다.
async function scanQr() {
  try {
    const r = await CapacitorBarcodeScanner.scanBarcode({
      hint: HINT_QR_CODE,
      scanInstructions: "학원 입구의 출석 QR을 화면 안에 맞춰 주세요",
    });
    return r?.ScanResult || null;
  } catch (e) {
    const m = String(e?.message || e);
    if (/cancel|dismiss|사용자/i.test(m)) return null; // 사용자가 닫음 — 실패가 아님
    throw e;
  }
}

// APNs 푸시 등록. 권한 허용 시 onToken(디바이스 토큰) 을 호출한다.
async function registerPush(onToken, onNotification) {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") return false;
  PushNotifications.addListener("registration", (t) => onToken(t.value));
  if (onNotification) {
    PushNotifications.addListener("pushNotificationReceived", onNotification);
    PushNotifications.addListener("pushNotificationActionPerformed", onNotification);
  }
  await PushNotifications.register();
  return true;
}

// 네이티브 Sign in with Apple. 리다이렉트가 없어 로그인 후에도 앱 origin 이 유지된다.
async function appleSignIn(clientId, redirectURI) {
  const r = await SignInWithApple.authorize({
    clientId,
    redirectURI,
    scopes: "email name",
  });
  return r?.response?.identityToken || null;
}

let geoShimmed = false;
if (Capacitor.isNativePlatform()) {
  geoShimmed = shimGeolocation();
  if (!geoShimmed) console.error("navigator.geolocation 대체 실패 — 위치 기능이 동작하지 않을 수 있음");
}

window.MoaNative = {
  platform: Capacitor.getPlatform(),
  isNative: Capacitor.isNativePlatform(),
  geoShimmed,
  scanQr,
  registerPush,
  appleSignIn,
};
