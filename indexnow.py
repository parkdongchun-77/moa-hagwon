# IndexNow 로 바뀐 주소를 검색엔진(Bing·Naver·Yandex 등)에 즉시 알린다.
# 사용법:  python indexnow.py            → sitemap.xml 의 모든 주소
#          python indexnow.py /owner.html /start.html   → 지정한 주소만
# 키 파일 https://moahagwon.com/dbb340c3d45e502f6f5a013726fca148.txt 이 살아 있어야 한다.
import sys, json, re, urllib.request, pathlib

HOST = "moahagwon.com"
KEY = "dbb340c3d45e502f6f5a013726fca148"
KEY_LOC = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"

def urls_from_sitemap():
    xml = pathlib.Path(__file__).with_name("sitemap.xml").read_text(encoding="utf-8")
    return re.findall(r"<loc>(.*?)</loc>", xml)

def main():
    args = sys.argv[1:]
    urls = [a if a.startswith("http") else f"https://{HOST}{a}" for a in args] or urls_from_sitemap()
    # IndexNow 는 한 번에 10,000개까지 받는다. 여유 있게 1,000개씩 끊는다.
    for i in range(0, len(urls), 1000):
        chunk = urls[i:i + 1000]
        body = json.dumps({"host": HOST, "key": KEY, "keyLocation": KEY_LOC, "urlList": chunk}).encode()
        req = urllib.request.Request(ENDPOINT, data=body,
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                print(f"{len(chunk)}건 → {r.status} {r.reason}")
        except Exception as e:
            print(f"{len(chunk)}건 → 실패: {e}")

if __name__ == "__main__":
    main()
