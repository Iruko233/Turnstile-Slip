const { connect } = require("puppeteer-real-browser");
const express = require('express');
const chalk = require('chalk');
const app = express();
const port = 3000;

const sleep = duration => new Promise(resolve => setTimeout(resolve, duration * 1000));

async function main() {
  app.get('/api', async (req, res) => {
    const targetURL = req.query.target;

    if (targetURL) {
      try {
        const { title, cookie, userAgent } = await openBrowser(targetURL);
        res.send({ title, userAgent, cookie });
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      res.status(400).send('Bad Request');
    }
  });

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

const checkTurnstile = ({ page }) => {
  return new Promise(async (resolve, reject) => {
    var waitInterval = setTimeout(() => { clearInterval(waitInterval); resolve(false) }, 5000);
    try {
      const elements = await page.$$('[name="cf-turnstile-response"]');
      if (elements.length <= 0) {

        const coordinates = await page.evaluate(() => {
          let coordinates = [];
          document.querySelectorAll('div').forEach(item => {
            try {
              let itemCoordinates = item.getBoundingClientRect()
              let itemCss = window.getComputedStyle(item)
              if (itemCss.margin == "0px" && itemCss.padding == "0px" && itemCoordinates.width > 290 && itemCoordinates.width <= 310 && !item.querySelector('*')) {
                coordinates.push({ x: itemCoordinates.x, y: item.getBoundingClientRect().y, w: item.getBoundingClientRect().width, h: item.getBoundingClientRect().height })
              }
            } catch (err) { }
          });

          if (coordinates.length <= 0) {
            document.querySelectorAll('div').forEach(item => {
              try {
                let itemCoordinates = item.getBoundingClientRect()
                if (itemCoordinates.width > 290 && itemCoordinates.width <= 310 && !item.querySelector('*')) {
                  coordinates.push({ x: itemCoordinates.x, y: item.getBoundingClientRect().y, w: item.getBoundingClientRect().width, h: item.getBoundingClientRect().height })
                }
              } catch (err) { }
            });

          }

          return coordinates
        })

        for (const item of coordinates) {
          try {
            let x = item.x + 30;
            let y = item.y + item.h / 2;
            await page.mouse.click(x, y);
          } catch (err) { }
        }
        return resolve(true)
      }

      for (const element of elements) {
        try {
          const parentElement = await element.evaluateHandle(el => el.parentElement);
          const box = await parentElement.boundingBox();
          let x = box.x + 30;
          let y = box.y + box.height / 2;
          await page.mouse.click(x, y);
        } catch (err) { }
      }
      clearInterval(waitInterval)
      resolve(true)
    } catch (err) {
      clearInterval(waitInterval)
      resolve(false)
    }
  })
}

async function openBrowser(targetURL) {

  const { browser, page } = await connect({
    headless: false,
    args: [],
    customConfig: {},
    turnstile: false,
    connectOption: { defaultViewport: null },
    disableXvfb: false,
    ignoreAllFlags: false,
  });

  const client = page._client();
  page.on("framenavigated", (frame) => {
    if (frame.url().includes("challenges.cloudflare.com") === true) client.send("Target.detachFromTarget", { targetId: frame._id });
  });
  page.setDefaultNavigationTimeout(60 * 1000);
  const userAgent = await page.evaluate(function () {
    return navigator.userAgent;
  });
  await page.goto(targetURL, {
    waitUntil: "domcontentloaded"
  });
  const content = await page.content();

  if (content.includes("challenge-platform") === true) {
    console.log(chalk.yellow('Found CloudFlare challenge'));
    try {
      await sleep(5);
      interval = setInterval(async () => {
        try {
          await checkTurnstile({ page });
        } catch (err) { }
      }, 1000);
      await sleep(10);
    } finally {
      await sleep(10);
      clearInterval(interval);
      const title = await page.title();
      const cookies = await page.cookies();
      const cookie = cookies.map(cookie => cookie.name + "=" + cookie.value).join("; ").trim();
      console.log("Title:", title);
      console.log("Cookies:", cookie);
      console.log("UserAgent:", userAgent);
      const content = await page.content();
      if (content.includes("challenge-platform") === false) {
        console.log(chalk.green('Challenge solved'));
      }
      await browser.close();
      return { title, cookie, userAgent };
    }
  }

  console.log(chalk.green('No challenge detected'));
  await sleep(10);
  const title = await page.title();
  const cookies = await page.cookies();
  const cookie = cookies.map(cookie => cookie.name + "=" + cookie.value).join("; ").trim();
  console.log("Title:", title);
  console.log("Cookies:", cookie);
  console.log("UserAgent:", userAgent);
  await browser.close();
  return { title, cookie, userAgent };
}

main();
