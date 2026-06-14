const express = require('express');
const winston = require('winston');

const lang = process.argv.includes('--lang=en') ? 'en' : 'zh';

const i18n = {
  zh: {
    apiError: 'API 错误: ',
    serverRunning: '服务已启动，监听地址: http://localhost:',
    locError: '定位报错: ',
    locSuccess: '[定位成功] 原始外框: ',
    pageClosed: '页面已关闭',
    clickPos: '[执行点击] 落脚点: ',
    foundCaptcha: '发现 CloudFlare 验证码',
    fastModeSuccess: 'FastMode: 已获取到 cf_clearance，提前结束！',
    solved: '验证码已解决',
    noCaptcha: '未检测到验证码'
  },
  en: {
    apiError: 'API Error: ',
    serverRunning: 'Server is running at http://localhost:',
    locError: 'Locator Error: ',
    locSuccess: '[Locator Success] Box: ',
    pageClosed: 'Page closed',
    clickPos: '[Click Execution] Position: ',
    foundCaptcha: 'Found CloudFlare challenge',
    fastModeSuccess: 'FastMode: cf_clearance obtained, ending early!',
    solved: 'Challenge solved',
    noCaptcha: 'No challenge detected'
  }
};

const t = i18n[lang];

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [new winston.transports.Console()]
});

const app = express();
const port = 3000;

const sleep = duration => new Promise(resolve => setTimeout(resolve, duration * 1000));

async function main() {
  app.get('/api', async (req, res) => {
    const targetURL = req.query.target;
    const fastMode = req.query.fast === 'true';
    const proxy = req.query.proxy || null;
    const ua = req.query.ua || null;

    if (targetURL) {
      try {
        const { title, cookie, userAgent } = await openBrowser(targetURL, fastMode, proxy, ua);
        res.send({ title, userAgent, cookie });
      } catch (error) {
        logger.error(`${t.apiError}${error.stack || error}`);
        res.status(500).send('Internal Server Error');
      }
    } else {
      res.status(400).send('Bad Request');
    }
  });

  app.listen(port, () => {
    logger.info(`${t.serverRunning}${port}`);
  });
}

const checkTurnstile = ({ page }) => {
  return new Promise(async (resolve, reject) => {
    var waitInterval = setTimeout(() => { clearInterval(waitInterval); resolve(false) }, 5000);
    try {
      let box = null;

      try {
        const wrapper = await page.$('div:has(> div > div > input[name="cf-turnstile-response"])');
        if (wrapper) {
          const rect = await wrapper.boundingBox();
          if (rect && rect.width > 250 && rect.height > 40) {
            box = rect;
          }
        }
      } catch (err) {
        logger.error(`${t.locError}${err.message}`);
      }

      if (box) {
        logger.debug(`${t.locSuccess}x=${box.x.toFixed(1)}, y=${box.y.toFixed(1)}, w=${box.width.toFixed(1)}, h=${box.height.toFixed(1)}`);

        await new Promise(r => setTimeout(r, Math.random() * 1000 + 1500));
        
        if (page.isClosed()) {
          logger.debug(t.pageClosed);
          clearInterval(waitInterval);
          return resolve(false);
        }

        let x = box.x + 20 + (Math.random() * 6 - 3);
        let y = box.y + 30 + (Math.random() * 6 - 3);
        
        logger.debug(`${t.clickPos}x=${x.toFixed(1)}, y=${y.toFixed(1)}`);

        await page.mouse.click(x, y);
      }
      
      clearInterval(waitInterval);
      resolve(true);
    } catch (err) {
      clearInterval(waitInterval);
      resolve(false);
    }
  });
}

async function openBrowser(targetURL, fastMode = false, proxy = null, customUA = null) {
  const { launch } = await import("cloakbrowser/puppeteer");

  const launchArgs = [];

  if (customUA) {
    launchArgs.push(`--user-agent=${customUA}`);
    const uaLower = customUA.toLowerCase();
    
    if (uaLower.includes("mac os") || uaLower.includes("macintosh")) {
      launchArgs.push("--fingerprint-platform=macos");
    } else if (uaLower.includes("android")) {
      launchArgs.push("--fingerprint-platform=android");
    } else if (uaLower.includes("iphone") || uaLower.includes("ipad")) {
      launchArgs.push("--fingerprint-platform=ios");
    } else if (uaLower.includes("linux")) {
      launchArgs.push("--fingerprint-platform=linux");
    } else {
      launchArgs.push("--fingerprint-platform=windows");
    }



    const chromeMatch = customUA.match(/Chrome\/(\d+)/i);
    if (chromeMatch) {
      launchArgs.push(`--fingerprint-brand-version=${chromeMatch[1]}`);
      launchArgs.push(`--fingerprint-brand=Chrome`);
    }
  }

  const launchOptions = {
    headless: false,
    humanize: true,
    args: launchArgs
  };

  if (proxy) {
    launchOptions.proxy = proxy;
    launchOptions.geoip = true;
  }

  const browser = await launch(launchOptions);
  
  try {
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    page.setDefaultNavigationTimeout(60 * 1000);
    const userAgent = await page.evaluate(function () {
      return navigator.userAgent;
    });
    
    await page.goto(targetURL, {
      waitUntil: "domcontentloaded"
    });
    const content = await page.content();

    if (content.includes("challenge-platform") === true) {
      logger.info(t.foundCaptcha);
      let interval;
      try {
        await sleep(1);
        let isChecking = false;
        interval = setInterval(async () => {
          if (isChecking || page.isClosed()) return;
          isChecking = true;
          try {
            await checkTurnstile({ page });
          } catch (err) { }
          isChecking = false;
        }, 1000);
        
        if (fastMode) {
          for (let i = 0; i < 20; i++) {
            await sleep(1);
            if (page.isClosed()) break;
            const cookies = await page.cookies();
            if (cookies.some(c => c.name === 'cf_clearance')) {
              logger.info(t.fastModeSuccess);
              break;
            }
          }
        } else {
          await sleep(10);
        }
      } finally {
        if (!fastMode) await sleep(10);
        if (interval) clearInterval(interval);
        
        let title = '', cookie = '';
        if (!page.isClosed()) {
          title = await page.title();
          const cookies = await page.cookies();
          cookie = cookies.map(c => c.name + "=" + c.value).join("; ").trim();
          const finalContent = await page.content();
          if (finalContent.includes("challenge-platform") === false) {
            logger.info(t.solved);
          }
        }
        logger.info(`\x1b[36mTitle: ${title}\x1b[0m | \x1b[33mCookies: ${cookie}\x1b[0m | \x1b[32mUA: ${userAgent}\x1b[0m`);
        return { title, cookie, userAgent };
      }
    }

    logger.info(t.noCaptcha);
    if (!fastMode) {
      await sleep(10);
    }
    let title = '', cookie = '';
    if (!page.isClosed()) {
      title = await page.title();
      const cookies = await page.cookies();
      cookie = cookies.map(c => c.name + "=" + c.value).join("; ").trim();
    }
    logger.info(`\x1b[36mTitle: ${title}\x1b[0m | \x1b[33mCookies: ${cookie}\x1b[0m | \x1b[32mUA: ${userAgent}\x1b[0m`);
    return { title, cookie, userAgent };
  } finally {
    try {
      await browser.close();
    } catch (err) {
      logger.error(`Error closing browser: ${err.message}`);
    }
  }
}

main();
