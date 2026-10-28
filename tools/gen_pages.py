# 학원별 검색용 정적 페이지(/a/)·지역 목록·sitemap-a.xml 을 DB(moa-db)에서 만든다.
#
# 실행: python tools/gen_pages.py
#  - VPS 안에서 돌리면 docker exec 로, PC 에서 돌리면 ssh(~/.ssh/erp_vultr 키)로 DB 를 읽는다.
#  - 결과물은 a/ 폴더와 sitemap-a.xml. 날짜는 DB 의 updated_at 만 쓰므로 데이터가 그대로면 파일도 그대로다.
#
# 어떤 학원을 만드나 (2026-10-29 결정. 개원 학원이 18만 곳이라 전부 만들지 않는다)
#  status='개원' 이면서 아래 중 하나
#   1) 원장이 등록한 학원(owner_id)·프리미엄·사진이 있는 학원 — 전국
#   2) 회원 자녀가 다니는 학원이 있는 동(child_academies 기준)의 모든 학원
#   3) 그 동이 속한 시군구에서 수강료를 공개한 학원(fee_public 이고 min_monthly 있음)
#  이름이 [심사용] 으로 시작하는 데모 학원은 뺀다.
# 공개하는 항목: 학원명·유형·과목·학년·시도/시군구/동·학원 소개·시간표·공개 수강료(fee_public 일 때만)·첫 사진.
# 전화·상세 주소·원장 정보는 페이지에 넣지 않는다. 상담·상세는 앱(?aca=)으로 보낸다.
import html, json, os, re, shutil, subprocess
from collections import defaultdict
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "a")
SITE = "https://moahagwon.com"
OG_DEFAULT = SITE + "/icon-512.png"
SSH = ["ssh", "-i", os.path.expanduser("~/.ssh/erp_vultr"), "-o", "BatchMode=yes", "root@141.164.46.88"]
PSQL = ["docker", "exec", "-i", "moa-db", "psql", "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1"]

SQL = """
with ud as (select distinct a.sido, a.region_city, a.dong from child_academies c join academies a on a.id = c.academy_id where a.dong is not null),
uc as (select distinct sido, region_city from ud)
select coalesce(json_agg(t order by t.id), '[]') from (
  select id, name, kind, sido, region_city, dong, subjects, grades, photos, intro, timetable,
         case when fee_public then min_monthly end as min_monthly,
         case when fee_public then max_monthly end as max_monthly,
         to_char(updated_at at time zone 'Asia/Seoul', 'YYYY-MM-DD') as updated
  from academies
  where status = '개원' and sido is not null and region_city is not null and name not like '[심사용]%'
    and (owner_id is not null or is_premium or cardinality(photos) > 0
         or (sido, region_city, dong) in (select * from ud)
         or (fee_public and min_monthly is not null and (sido, region_city) in (select * from uc)))
) t;
"""


def fetch():
    cmd = PSQL if os.path.exists("/var/run/docker.sock") else SSH + [" ".join(PSQL)]  # VPS 면 바로, 아니면 ssh
    r = subprocess.run(cmd, input=SQL.encode("utf-8"), capture_output=True, timeout=300)
    if r.returncode:
        raise SystemExit("DB 조회 실패: " + r.stderr.decode("utf-8", "replace")[:300])
    return json.loads(r.stdout.decode("utf-8"))


e = lambda s: html.escape(str(s or ""), quote=True)
ld = lambda o: '<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False).replace("<", "\\u003c") + "</script>"
area_file = lambda sido, city: re.sub(r'[/\\?%*:|"<>]', "", f"{sido}-{city}").strip() + ".html"
area_url = lambda sido, city: f"{SITE}/a/{quote(area_file(sido, city))}"
aca_url = lambda i: f"{SITE}/a/{i}.html"
noun = lambda kind: kind if kind in ("교습소", "공부방") else "학원"


def photo(a):
    p = (a.get("photos") or [None])[0]
    return p if isinstance(p, str) and p.startswith("https://") else None


def won(n):
    return f"{n // 10000:,}만원" if n % 10000 == 0 else f"{n:,}원"


def fee_text(a):
    lo, hi = a.get("min_monthly"), a.get("max_monthly")
    if not lo:
        return ""
    return f"월 {won(lo)}" + (f" ~ {won(hi)}" if hi and hi != lo else "")


CSS = """:root{--p:#4f46e5;--t:#1f2937;--m:#6b7280;--b:#e5e7eb}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic",sans-serif;color:var(--t);line-height:1.7;background:#f9fafb}
header{background:#fff;border-bottom:1px solid var(--b)}
.wrap{max-width:760px;margin:0 auto;padding:0 16px}
header .wrap{display:flex;align-items:center;gap:14px;min-height:56px;flex-wrap:wrap}
header a.brand{color:var(--p);text-decoration:none;font-weight:700}
nav a{color:var(--m);font-size:14px}
main{background:#fff;margin:20px auto;max-width:760px;padding:24px 16px;border:1px solid var(--b);border-radius:12px}
h1{font-size:23px;margin:0 0 8px;word-break:keep-all}
h2{font-size:17px;margin:26px 0 6px}
.mut{color:var(--m);font-size:14px}
.sub{display:inline-block;background:#eef2ff;color:#4338ca;border-radius:5px;padding:1px 8px;margin:2px 3px 2px 0;font-size:13px}
.cta{display:inline-block;margin:14px 0 4px;background:var(--p);color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700}
.pre{white-space:pre-line;overflow-wrap:anywhere}
.ph{max-width:100%;border-radius:10px;margin:10px 0}
ul.l{padding-left:18px}ul.l li{margin:2px 0}
dl{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;margin:8px 0}dt{color:var(--m)}dd{margin:0}
footer{max-width:760px;margin:0 auto 40px;padding:0 16px;color:var(--m);font-size:13px}
footer a{color:var(--m)}"""

FOOT = """<footer>
  <p><a href="/">모아학원 홈</a> · <a href="/a/">학원 페이지 지역 목록</a> · <a href="/지역/">지역별 학원 찾기</a> · <a href="/about.html">서비스 소개</a> · <a href="/contact.html">문의</a> · <a href="/terms.html">이용약관</a> · <a href="/privacy.html">개인정보처리방침</a></p>
  <p style="line-height:1.8">모아학원 · 대표 박동춘 · 사업자등록번호 808-27-02108<br>
    충청남도 아산시 탕정면 탕정면로 37, 401동 31층 04호 401동 3104호(탕정삼성트라팰리스아파트)<br>
    전화 010-7385-2657 · 이메일 <!--email_off-->moahagwon@gmail.com<!--/email_off--></p>
</footer>"""


def shell(title, desc, url, og_img, body, graph, og_type="website"):
    return f"""<!doctype html>
<!-- tools/gen_pages.py 로 생성됨. 직접 고치지 말 것. -->
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="모아학원">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(og_img)}">
<meta name="twitter:card" content="summary">
{ld({"@context": "https://schema.org", "@graph": graph})}
<style>{CSS}</style>
</head>
<body>
<header><div class="wrap"><a class="brand" href="/">모아학원</a>
  <nav><a href="/">학원 검색</a> · <a href="/a/">지역 목록</a> · <a href="/about.html">소개</a></nav></div></header>
<main>
{body}
</main>
{FOOT}
</body>
</html>
"""


def crumbs(*items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}


def academy_page(a):
    sido, city, dong = a["sido"], a["region_city"], a.get("dong") or ""
    where = " ".join(x for x in (city, dong) if x)
    subs = [s for s in (a.get("subjects") or []) if s]
    grades = [g for g in (a.get("grades") or []) if g]
    kind = noun(a.get("kind"))
    title = f"{a['name']} · {where} {' '.join(subs[:2])} {kind} | 모아학원".replace("  ", " ")
    fee = fee_text(a)
    desc = f"{sido} {where}의 {a.get('kind') or '학원'} {a['name']}." \
        + (f" 과목 {', '.join(subs[:5])}." if subs else "") \
        + (f" 대상 {', '.join(grades[:4])}." if grades else "") \
        + (f" 공개 수강료 {fee}." if fee else "") \
        + " 모아학원에서 학원 정보를 보고 상담을 신청할 수 있습니다."
    url, img = aca_url(a["id"]), photo(a)
    org = {"@type": "EducationalOrganization", "@id": url + "#org", "name": a["name"], "url": url,
           "address": {"@type": "PostalAddress", "addressCountry": "KR", "addressRegion": sido,
                       "addressLocality": where}}
    if img:
        org["image"] = img
    if a.get("intro"):
        org["description"] = a["intro"][:300]
    graph = [crumbs(("모아학원", SITE + "/"), ("학원 페이지 지역 목록", SITE + "/a/"),
                    (f"{sido} {city}", area_url(sido, city)), (a["name"], url)), org]
    dl = [("유형", e(a.get("kind") or "-")), ("지역", e(f"{sido} {where}"))]
    if subs:
        dl.append(("과목", "".join(f'<span class="sub">{e(s)}</span>' for s in subs)))
    if grades:
        dl.append(("대상", e(", ".join(grades))))
    if fee:
        dl.append(("수강료", e(fee) + ' <span class="mut">(학원이 공개한 수강료)</span>'))
    body = [f'<p class="mut"><a href="/a/">지역 목록</a> › <a href="./{e(quote(area_file(sido, city)))}">{e(sido)} {e(city)}</a>'
            + (f" › {e(dong)}" if dong else "") + "</p>",
            f"<h1>{e(a['name'])}</h1>",
            f'<img class="ph" src="{e(img)}" alt="{e(a["name"])} 사진">' if img else "",
            "<dl>" + "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k, v in dl) + "</dl>"]
    if a.get("intro"):
        body.append(f'<h2>학원 소개</h2><p class="pre">{e(a["intro"])}</p>')
    if a.get("timetable"):
        body.append(f'<h2>시간표</h2><p class="pre">{e(a["timetable"])}</p>')
    body.append(f'<p><a class="cta" href="{SITE}/?aca={a["id"]}">모아학원에서 상담·자세히 보기</a></p>')
    body.append('<p class="mut">학원 정보는 공공데이터와 원장이 등록한 내용을 바탕으로 하며 실제와 다를 수 있습니다. '
                '등록 전에 학원에 직접 확인해 주세요. 수정·삭제 요청은 <a href="/contact.html">문의</a>로 보내 주세요.</p>')
    return shell(title, desc, url, img or OG_DEFAULT, "\n".join(x for x in body if x), graph, "article")


def area_page(sido, city, rows, has_region):
    url = area_url(sido, city)
    by_dong = defaultdict(list)
    for a in rows:
        by_dong[a.get("dong") or "기타"].append(a)
    title = f"{sido} {city} 학원 {len(rows):,}곳 — 동별 학원 페이지 | 모아학원"
    desc = f"{sido} {city}의 학원·교습소·공부방 {len(rows):,}곳을 동별로 모았습니다. " \
        + ", ".join(sorted(by_dong)[:6]) + " 등."
    body = [f'<p class="mut"><a href="/a/">지역 목록</a> › {e(sido)} {e(city)}</p>',
            f"<h1>{e(sido)} {e(city)} 학원</h1>",
            f'<p class="mut">이 페이지에는 {e(city)}의 학원 {len(rows):,}곳이 동별로 있습니다. 학원 이름을 누르면 과목·대상·공개 수강료를 볼 수 있습니다.'
            + (f' {e(city)} 전체 학원 통계는 <a href="/지역/{e(quote(area_file(sido, city)))}">지역별 학원 찾기</a>에 있습니다.' if has_region else "")
            + "</p>"]
    for dong in sorted(by_dong):
        lst = sorted(by_dong[dong], key=lambda a: a["name"])
        body.append(f"<h2>{e(dong)} <span class=\"mut\">{len(lst)}곳</span></h2><ul class=\"l\">"
                    + "".join(f'<li><a href="./{a["id"]}.html">{e(a["name"])}</a>'
                              + (f' <span class="mut">{e(", ".join((a.get("subjects") or [])[:3]))}</span>' if a.get("subjects") else "")
                              + "</li>" for a in lst) + "</ul>")
    graph = [crumbs(("모아학원", SITE + "/"), ("학원 페이지 지역 목록", SITE + "/a/"), (f"{sido} {city}", url))]
    return shell(title, desc, url, OG_DEFAULT, "\n".join(body), graph)


def hub_page(areas):
    by_sido = defaultdict(list)
    for (sido, city), rows in areas.items():
        by_sido[sido].append((city, len(rows)))
    total = sum(len(r) for r in areas.values())
    body = ['<h1>학원 페이지 — 지역 목록</h1>',
            f'<p class="mut">모아학원에 학원 페이지가 있는 시군구 {len(areas)}곳, 학원 {total:,}곳입니다. 전국 학원 검색은 <a href="/">모아학원 홈</a>에서 할 수 있습니다.</p>']
    for sido in sorted(by_sido):
        body.append(f"<h2>{e(sido)}</h2><ul class=\"l\">" + "".join(
            f'<li><a href="./{e(quote(area_file(sido, c)))}">{e(c)}</a> <span class="mut">{n:,}곳</span></li>'
            for c, n in sorted(by_sido[sido])) + "</ul>")
    url = SITE + "/a/"
    graph = [crumbs(("모아학원", SITE + "/"), ("학원 페이지 지역 목록", url))]
    return shell("지역별 학원 페이지 목록 | 모아학원", f"모아학원 학원 페이지 {total:,}곳을 시도·시군구별로 모았습니다.",
                 url, OG_DEFAULT, "\n".join(body), graph)


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main():
    rows = fetch()
    if not rows:
        raise SystemExit("학원 0곳 — DB 조회 결과가 비어 있어 기존 페이지를 지우지 않고 멈춘다.")
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)  # 빠진 학원 페이지가 남지 않게 매번 새로 만든다
    os.makedirs(OUT)
    areas = defaultdict(list)
    for a in rows:
        areas[(a["sido"], a["region_city"])].append(a)
        write(os.path.join(OUT, f"{a['id']}.html"), academy_page(a))
    urls = [(SITE + "/a/", max(a["updated"] for a in rows))]
    for (sido, city), lst in sorted(areas.items()):
        has_region = os.path.exists(os.path.join(ROOT, "지역", area_file(sido, city)))
        write(os.path.join(OUT, area_file(sido, city)), area_page(sido, city, lst, has_region))
        urls.append((area_url(sido, city), max(a["updated"] for a in lst)))
    write(os.path.join(OUT, "index.html"), hub_page(areas))
    urls += [(aca_url(a["id"]), a["updated"]) for a in rows]
    write(os.path.join(ROOT, "sitemap-a.xml"),
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{e(u)}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls) + "</urlset>\n")
    print(f"학원 페이지 {len(rows)} · 시군구 페이지 {len(areas)} · 사이트맵 URL {len(urls)}")


if __name__ == "__main__":
    main()
