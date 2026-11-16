"""Download attributed Commons images and discover official video player URLs."""
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist' / 'assets'
HEADERS = {'User-Agent': 'Mozilla/5.0 (educational website source preparation)'}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=35).read()

files = [
    ('tours-1920.jpg', 'Comrade Nguyen Ai Quoc at the national congress of the Socialist Party of France in the city of Tous, France in December 1920.jpg'),
    ('children-1957.jpg', 'Bundesarchiv Bild 183-48550-0036, Besuch Ho Chi Minhs bei Pionieren, bei Berlin.jpg'),
    ('pac-bo.jpg', 'Pác Bó.jpg'),
]
results = []
for name, title in files:
    page = 'https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(title.replace(' ', '_'))
    try:
        document = get(page).decode('utf-8')
        original = re.search(r'class="fullImageLink"[^>]*>\s*<a href="([^"]+)"', document)
        if not original:
            original = re.search(r'<a href="([^"]+)"[^>]*class="internal"[^>]*>Original file', document)
        if not original:
            raise ValueError('Original image link not found')
        url = html.unescape(original.group(1))
        if url.startswith('//'):
            url = 'https:' + url
        (ASSETS / name).write_bytes(get(url))
        results.append({'file': name, 'page': page, 'url': url})
        print('Downloaded', name)
    except Exception as error:
        print('FAILED', name, str(error))

videos = [
    'https://hochiminh.vn/video/hinh-anh-ve-doi-hoat-dong-cua-ho-chu-tich-15',
    'https://hochiminh.vn/video/phim-tai-lieu-duong-ve-to-quoc-8',
    'https://hochiminh.vn/video/phim-tai-lieu-ho-chi-minh-chan-dung-mot-con-nguoi-13',
]
for page in videos:
    try:
        document = get(page).decode('utf-8')
        # Inspect only explicitly declared player sources, never guess a media URL.
        candidates = re.findall(r'(?:https?:)?//[^\s\"\'<>]+\.(?:mp4|m3u8)(?:\?[^\s\"\'<>]*)?', document)
        relative = re.findall(r'[\"\']((?:/)[^\"\']+\.mp4)[\"\']', document)
        embeds = re.findall(r'<iframe[^>]+src=[\"\']([^\"\']+)', document)
        results.append({'page': page, 'videos': list(dict.fromkeys(html.unescape(x) for x in candidates)), 'relative': relative, 'embeds': embeds})
        print('Player', page.rsplit('/', 1)[1], json.dumps(results[-1], ensure_ascii=False))
    except Exception as error:
        print('FAILED video', str(error))
(ROOT / 'scripts' / 'media-discovery.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
