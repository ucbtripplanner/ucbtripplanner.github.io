#!/usr/bin/env python3
"""Find a photo for a place / lodge / restaurant.

  python3 tools/find_photo.py "Grizzly Giant Mariposa Grove"      # search Wikimedia Commons (licensed, preferred)
  python3 tools/find_photo.py --og https://www.rushcreeklodge.com/  # a website's og:image (link-preview image)

Commons results print:  File_name.jpg | WxH | license | author
→ add to <trip>/images.json as {"file": "File_name.jpg", "title": "..."} and run tools/build_images.py.
Pick landscape images (W > H) for cards; check the license is CC-BY/CC-BY-SA/CC0/Public domain.
og:image results print the URL; wrap big ones with https://wsrv.nl/?url=<host/path>&w=960&output=jpg&q=78
Only use official/og images for lodging & restaurants without a Commons photo, and credit them
("공식 사이트 이미지", license "링크 미리보기", page = the site URL). Skip logos — the card shows an emoji instead.
"""
import html
import json
import re
import sys
import urllib.parse
import urllib.request

UA_API = {"User-Agent": "ucbtripplanner-site/1.0 (https://ucbtripplanner.github.io)"}
UA_WEB = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"}


def strip(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def commons(query, n=6):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrsearch": "filetype:bitmap " + query,
        "gsrnamespace": 6, "gsrlimit": n, "prop": "imageinfo", "iiprop": "size|extmetadata"})
    d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA_API), timeout=60))
    pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    if not pages:
        print("(no results — try fewer / different words)")
    for p in pages:
        ii = p["imageinfo"][0]
        em = ii.get("extmetadata", {})
        print(f'{p["title"][5:].replace(" ", "_")} | {ii["width"]}x{ii["height"]} | '
              f'{em.get("LicenseShortName", {}).get("value", "?")} | {strip(em.get("Artist", {}).get("value", ""))[:40]}')


def og(url):
    body = urllib.request.urlopen(urllib.request.Request(url, headers=UA_WEB), timeout=30).read(800000).decode("utf-8", "ignore")
    m = (re.search(r'<meta[^>]+(?:property|name)=["\']og:image(?::url)?["\'][^>]*content=["\']([^"\']+)', body, re.I)
         or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']og:image', body, re.I))
    if m:
        print(html.unescape(m.group(1)))
    else:
        imgs = [i for i in re.findall(r'<img[^>]+(?:data-src|src)=["\']([^"\']+\.(?:jpe?g|webp|png))', body, re.I)
                if not re.search(r"logo|icon|badge|sprite", i, re.I)]
        print("no og:image; <img> candidates:" if imgs else "no og:image and no <img> found")
        for i in imgs[:8]:
            print("  " + i)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--og":
        og(sys.argv[2])
    elif len(sys.argv) >= 2:
        commons(" ".join(sys.argv[1:]))
    else:
        print(__doc__)
