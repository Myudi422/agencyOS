import requests
import urllib3
import json

urllib3.disable_warnings()

proxy_url = "http://eclipse_akuiiki:5e74d102-b2a7-48cc-a9a3-1ae7d02559b8@core.eclipseproxy.com:3030"
proxies = {"http": proxy_url, "https": proxy_url}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
}

print("Testing TikTok oEmbed endpoint...")
r = requests.get("https://www.tiktok.com/oembed?url=https://www.tiktok.com/@khaby.lame", headers=headers, proxies=proxies, verify=False, timeout=15)
print("Status code:", r.status_code)
if r.status_code == 200:
    print("oEmbed Data:", json.dumps(r.json(), indent=2))
