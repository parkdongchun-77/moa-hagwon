# 모아학원 원장 프리미엄 인앱결제 영수증 확인 키(Google 서비스 계정 JSON, Apple 앱 내 구입 .p8)를 VPS .env 에 넣고 엣지 함수를 다시 띄운다 — 사용자가 직접 실행한다
# 사용법: powershell -ExecutionPolicy Bypass -File tools\set-iap-keys.ps1
# 키 내용은 화면에 출력하지 않고, 로컬 임시 파일 없이 SSH 로만 보낸다.
$ErrorActionPreference = 'Stop'
$py = @'
import sys, json, paramiko, shlex
sa_path, p8_path, key_id, issuer = sys.argv[1:5]
vals = {}
if sa_path:
    vals["PLAY_SERVICE_ACCOUNT"] = json.dumps(json.load(open(sa_path, encoding="utf-8")), separators=(",", ":"))
if p8_path:
    vals["APPLE_IAP_PRIVATE_KEY"] = open(p8_path, encoding="utf-8").read().strip().replace("\r", "").replace("\n", "")
    vals["APPLE_IAP_KEY_ID"] = key_id
    vals["APPLE_IAP_ISSUER_ID"] = issuer
c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("141.164.46.88", username="root", key_filename=r"C:\Users\user\.ssh\erp_vultr", timeout=30)
sftp = c.open_sftp()
env = sftp.open("/root/moa/.env").read().decode("utf-8").splitlines()
env = [l for l in env if l.split("=", 1)[0] not in vals]
for k, v in vals.items():
    env.append(k + "=" + "'" + v.replace("'", "") + "'")
with sftp.open("/root/moa/.env", "w") as f:
    f.write("\n".join(env) + "\n")
sftp.close()
i, o, e = c.exec_command("cd /root/moa && docker compose up -d functions >/dev/null 2>&1; sleep 8; docker exec moa-edge-functions sh -c 'for v in PLAY_SERVICE_ACCOUNT APPLE_IAP_KEY_ID APPLE_IAP_ISSUER_ID APPLE_IAP_PRIVATE_KEY; do eval x=\\$$v; [ -n \"$x\" ] && echo \"$v: OK\" || echo \"$v: EMPTY\"; done'")
print(o.read().decode("utf-8", "replace")); c.close()
'@
$sa = Read-Host 'Google service account JSON path (Enter = emoi key)'
if (-not $sa) { $sa = 'C:\Users\user\emoi\.keys\emoi-7a2be-fa130718f765.json' }
$p8 = Read-Host 'Apple In-App Purchase .p8 path (Enter = skip)'
$kid = ''; $iss = ''
if ($p8) { $kid = Read-Host 'Apple Key ID'; $iss = Read-Host 'Apple Issuer ID' }
$tmp = Join-Path $env:TEMP 'moa_set_iap.py'
Set-Content -Path $tmp -Value $py -Encoding UTF8
try { $env:PYTHONIOENCODING = 'utf-8'; python $tmp $sa $p8 $kid $iss } finally { Remove-Item $tmp -Force }
