import requests

def print_divider(title):
    print("\n" + "=" * 30)
    print(f"{title}")
    print("=" * 30 + "\n")

def fetch_without_bypass(url):
    print_divider("Fetching without Bypass")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print("Response (first 1000 characters):")
        print(resp.text[:1000])
    except Exception as e:
        print(f"Error occurred: {e}")

def fetch_with_bypass(api_url, target_url):
    print_divider("Fetching with Bypass")
    try:
        bypass_resp = requests.get(f"{api_url}?target={target_url}", timeout=60).json()
        print("Bypass API Response:")
        print(bypass_resp)

        headers = {
            "User-Agent": bypass_resp["userAgent"],
            "Cookie": bypass_resp["cookie"]
        }
        resp = requests.get(target_url, headers=headers, timeout=10)
        print("\nResponse (first 1000 characters):")
        print(resp.text[:1000])
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    target = "https://nopecha.com/demo/cloudflare"
    bypass_api = "http://127.0.0.1:3000/api"

    fetch_without_bypass(target)
    fetch_with_bypass(bypass_api, target)
