# 학원 정적 페이지를 다시 만들고, 바뀐 것이 있을 때만 커밋·푸시한다 (Windows 작업 스케줄러 'moa-gen-pages' 가 매주 실행).
$ErrorActionPreference = 'Continue'
$env:PYTHONIOENCODING = 'utf-8'
Set-Location (Split-Path $PSScriptRoot -Parent)
$log = Join-Path $env:TEMP 'moa-gen-pages.log'
"$(Get-Date -Format s) 시작" | Out-File $log -Append -Encoding utf8
git pull --rebase --autostash -q 2>&1 | Out-File $log -Append -Encoding utf8
python tools/gen_pages.py 2>&1 | Out-File $log -Append -Encoding utf8
if ($LASTEXITCODE) { "생성 실패, 커밋하지 않음" | Out-File $log -Append -Encoding utf8; exit 1 }
git add -A -- a sitemap-a.xml
git diff --cached --quiet -- a sitemap-a.xml
if ($LASTEXITCODE -eq 0) { "바뀐 것 없음" | Out-File $log -Append -Encoding utf8; exit 0 }
git commit -q -m "chore(seo): 학원 정적 페이지 자동 갱신" -- a sitemap-a.xml 2>&1 | Out-File $log -Append -Encoding utf8
git push -q 2>&1 | Out-File $log -Append -Encoding utf8
"커밋·푸시 완료" | Out-File $log -Append -Encoding utf8
