import requests
import json
import bs4

headers_mobile = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

for username in ["khaby.lame", "gopro", "tiktok", "papundastudio"]:
    r = requests.get(f"https://www.tiktok.com/@{username}", headers=headers_mobile, timeout=15)
    soup = bs4.BeautifulSoup(r.text, "html.parser")
    s10 = soup.find("script", id="__UNIVERSAL_DATA_FOR_REHYDRATION__")

    if s10 and s10.string:
        data = json.loads(s10.string)
        default_scope = data.get("__DEFAULT_SCOPE__", {})
        user_detail = default_scope.get("webapp.user-detail", {})
        user_info = user_detail.get("userInfo", {})
        items = user_info.get("itemList") or []

        # Search all keys in default_scope for lists of items
        if not items:
            for k, v in default_scope.items():
                if isinstance(v, dict):
                    for subk, subv in v.items():
                        if isinstance(subv, list) and len(subv) > 0 and isinstance(subv[0], dict) and "id" in subv[0]:
                            print(f"FOUND items in {k}.{subk} for @{username}: len={len(subv)}")
                            items = subv
                            break

        print(f"Result for @{username}: items_len={len(items) if isinstance(items, list) else 'not list'}")
        if isinstance(items, list) and len(items) > 0:
            item = items[0]
            print(f"  First Video ID: {item.get('id')}, Desc: {item.get('desc', '')[:40]}")
