// barcode-scanner 의 웹 폴백(html5-qrcode)을 번들에서 빼기 위한 빈 대체 모듈
// 이 번들은 네이티브 앱에만 주입되므로 웹 구현은 실행되지 않는다. 제거 시 1.1MB → 21KB.
export default {};
export const Html5Qrcode = null;
export const Html5QrcodeScanner = null;
export const Html5QrcodeSupportedFormats = {};
