import requests
import json

def color_status(code):
    if code == 200:
        return f"\033[92m{code}\033[0m" # Green
    elif code == 403:
        return f"\033[91m{code}\033[0m" # Red
    elif str(code).startswith('5'):
        return f"\033[93m{code}\033[0m" # Yellow
    else:
        return f"\033[96m{code}\033[0m" # Cyan

def fetch_without_bypass(url):
    print("Fetching without Bypass")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {color_status(resp.status_code)} | HTML Preview: {resp.text[:150]}...\n")
    except Exception as e:
        print(f"Error occurred: {e}\n")

def fetch_with_bypass(api_url, target_url):
    print("Fetching with Bypass")
    try:
        api_resp = requests.get(f"{api_url}?target={target_url}&fast=true", timeout=60)
        bypass_resp = api_resp.json()
        # 按照您的要求，这里放 API 的返回 JSON
        print(json.dumps(bypass_resp, indent=2, ensure_ascii=False) + "\n")

        headers = {
            "User-Agent": bypass_resp["userAgent"],
            "Cookie": bypass_resp["cookie"]
        }
        resp = requests.get(target_url, headers=headers, timeout=10)
        print(f"Target Site Status Code: {color_status(resp.status_code)} | HTML Preview: {resp.text[:150]}...\n")
    except Exception as e:
        print(f"Error occurred: {e}\n")

if __name__ == "__main__":
    target = "https://nopecha.com/demo/cloudflare"
    bypass_api = "http://127.0.0.1:3000/api"

    fetch_without_bypass(target)
    fetch_with_bypass(bypass_api, target)
