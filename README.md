# Turnstile-Slip

[中文](#中文) | [English](#english)

## 中文

该项目旨在实现自动化通过 Cloudflare Turnstile 质询，无需人工干预即可完成验证并获取 `cf_clearance`

### 视频演示
<video src="https://github.com/user-attachments/assets/93980817-d9a0-4cea-9007-5e69d5c77c50" controls="controls" width="100%">您的浏览器不支持播放该视频！</video>

![展示图 1](./assets/demo1.png)
![展示图 2](./assets/demo2.png)

### 启动

首次使用前，需要先安装所有相关依赖：

```bash
npm i
```

安装完成后，直接启动 Node.js 服务：

```bash
node captchaSolver.js
```
> 默认情况下，控制台日志会以 **中文** 输出。如果需要将日志输出切换为 **英文**，请在启动时附加 `--lang=en` 参数：

```bash
node captchaSolver.js --lang=en
```

### API 使用说明

#### 请求示例

**普通模式**

```http
GET http://127.0.0.1:3000/api?target=https://nopecha.com/demo/cloudflare
```

**快速模式 (推荐)**

在 URL 末尾附加 `&fast=true` 参数

说明：开启此模式后，程序将周期性检查 Cookie 状态。当检测到 `cf_clearance` Cookie 时，将立即结束流程并返回结果，以缩短整体接口的响应延迟。
```http
GET http://127.0.0.1:3000/api?target=https://nopecha.com/demo/cloudflare&fast=true
```

**可选参数**

支持通过附加查询参数配置浏览器底层环境：

*   `proxy`: 代理服务器地址（支持 HTTP/SOCKS5）。
    *   说明：指定代理后，系统会通过 GeoIP 数据库自动解析代理 IP 的地理位置，并将浏览器的时区 (Timezone) 和语言环境 (Locale) 与之同步。
    *   示例：`&proxy=http://127.0.0.1:7890`
*   `ua`: 自定义 User-Agent 字符串（需进行 URL 编码）。
    *   说明：自动解析传入的 UA，并同步底层的操作系统平台类型及浏览器主版本号。
    *   示例：`&ua=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36`

**带参数调用示例**
```http
GET http://127.0.0.1:3000/api?target=https://nopecha.com/demo/cloudflare&fast=true&proxy=http://127.0.0.1:7890&ua=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36
```

#### 返回示例

```json
{
    "title": "NopeCHA - CAPTCHA Demo",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "cookie": "cf_clearance=MHcI0vjPgnMzNpoGzOCFZ1AMCe322N2_EgTmddtgVyw-1715253876-1.0.1.1-w6HYChkfY9uJgY0G6nymjUMJhTb8IFJCD2wu1JC8_GfDWO_kXd0pP_fcKStObsKxWIlB6hede72pc1EIPV9J6g"
}
```

---

## English

This project aims to automate the bypass of Cloudflare Turnstile challenges, completing the verification and obtaining the `cf_clearance` cookie without any manual intervention.

### Video Demonstration
<video src="https://github.com/user-attachments/assets/93980817-d9a0-4cea-9007-5e69d5c77c50" controls="controls" width="100%">Your browser does not support playing this video!</video>

![Demo 1](./assets/demo1.png)
![Demo 2](./assets/demo2.png)

### Getting Started

Before using for the first time, you need to install all dependencies:

```bash
npm i
```

Once installed, simply start the Node.js service:

```bash
node captchaSolver.js
```
> By default, console logs are output in **Chinese**. To switch the log output to **English**, append the `--lang=en` argument when starting:

```bash
node captchaSolver.js --lang=en
```

### API Usage

#### Request Examples

**Normal Mode**

```http
GET http://127.0.0.1:3000/api?target=https://nopecha.com/demo/cloudflare
```

**Fast Mode (Recommended)**

Append the `&fast=true` parameter to the URL.

Description: When enabled, the program will periodically poll the Cookie status. Once it detects the `cf_clearance` cookie, it will immediately terminate the process and return the result to reduce overall API response latency.
```http
GET http://127.0.0.1:3000/api?target=https://nopecha.com/demo/cloudflare&fast=true
```

**Optional Parameters**

You can configure the underlying browser environment by appending the following query parameters:

*   `proxy`: Proxy server address (supports HTTP/SOCKS5).
    *   Description: When specified, the system will automatically query the GeoIP database to resolve the proxy IP's geolocation and synchronize the browser's Timezone and Locale accordingly.
    *   Example: `&proxy=http://127.0.0.1:7890`
*   `ua`: Custom User-Agent string (must be URL-encoded).
    *   Description: Automatically parses the provided UA and synchronizes the underlying OS platform type and browser major version.
    *   Example: `&ua=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36`

**Combined Parameter Example**
```http
GET http://127.0.0.1:3000/api?target=https://nopecha.com/demo/cloudflare&fast=true&proxy=http://127.0.0.1:7890&ua=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36
```

#### Response Example

```json
{
    "title": "NopeCHA - CAPTCHA Demo",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "cookie": "cf_clearance=MHcI0vjPgnMzNpoGzOCFZ1AMCe322N2_EgTmddtgVyw-1715253876-1.0.1.1-w6HYChkfY9uJgY0G6nymjUMJhTb8IFJCD2wu1JC8_GfDWO_kXd0pP_fcKStObsKxWIlB6hede72pc1EIPV9J6g"
}
```
