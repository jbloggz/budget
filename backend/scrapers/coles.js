/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * stgeorge.js: This file contains an example scraper for Coles Credit Card
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const [user, pass] = process.argv.slice(-2);

const sleep = (ms) => {
   return new Promise((resolve) => setTimeout(resolve, ms));
};

// set some options (set headless to false so we can see
// this automated browsing experience)
let launchOptions = {
   headless: false,
   executablePath: '/usr/bin/google-chrome-stable',
};

const browser = await puppeteer.launch(launchOptions);
//const page = await browser.newPage();
const [page] = await browser.pages();
await page.setViewport({ width: 1366, height: 768 });

// go to the target web
await page.goto('https://www.secure.coles.com.au/apps/auth/signin');

await sleep(9765);
await page.waitForSelector('input[name="username"]', { visible: true });
await page.focus('input[name="username"]');
await page.keyboard.type(user);
await sleep(938);
await page.focus('input[name="password"]');
await page.keyboard.type(pass);
await sleep(1227);
await page.keyboard.press('Enter');

await sleep(20398);
const element = await page.waitForSelector('#creditCardsSubPanel img', { visible: true });
await element.click();

let seen = false;
page.on('response', async (response) => {
   const request = response.request();
   if (request.url().includes('hold') && request.url().includes('functionCode=transaction_history')) {
      const text = await response.text();
      if (!seen) {
         console.log(text);
         seen = true;
      }
   }
});

await sleep(18937);
const element2 = await page.waitForSelector('#pending', { visible: true });
await element2.click();

await sleep(17364);
await page.goto('https://www.secure.coles.com.au/apps/auth/signout');
await sleep(15354);

// close the browser`
await browser.close();
