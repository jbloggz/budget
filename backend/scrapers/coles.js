/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * coles.js: This file contains an example scraper for Coles Credit Card
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const config = JSON.parse(fs.readFileSync(process.argv[2], { encoding: 'utf8', flag: 'r' }));
const { user, password } = config.scrapers['Coles Credit Card'];

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
await page.keyboard.type(password);
await sleep(1227);
await page.keyboard.press('Enter');

await sleep(20398);
const element = await page.waitForSelector('#creditCardsSubPanel img', { visible: true });
await element.click();

const output = {
   raw: [],
   transactions: [],
   balance: null,
   pending: 0,
};
page.on('response', async (response) => {
   const request = response.request();
   if (request.url().includes('hold') && request.url().includes('functionCode=transaction_history')) {
      const data = await response.json();
      if (output.raw.length === 0) {
         output.raw = data.transaction;
         for (const transaction of data.transaction) {
            output.transactions.push({
               date: transaction.transactionDate,
               description: transaction.transactionDescription.replace(/ +XXXX-XXXX-XXXX-[0-9]{4}$/, ''),
               amount: Math.round(transaction.transactionAmount * 100),
               source: 'Coles Credit Card',
               pending: typeof transaction.transactionPostingDate === 'undefined',
            });
         }
      }
   } else if (request.url().includes('detail') && request.url().includes('functionCode=account_detail')) {
      const data = await response.json();
      if (data.creditCardAccount) {
         const balance = -data.creditCardAccount.outstandingBalance;
         const pending = data.creditCardAccount.availableCredit - data.creditCardAccount.creditLimit - balance;
         output.balance = Math.round(balance * 100);
         output.pending = Math.round(pending * 100);
      }
   }
});

await sleep(18937);
const element2 = await page.waitForSelector('#pending', { visible: true });
await element2.click();

await sleep(17364);
console.log(JSON.stringify(output));
await page.goto('https://www.secure.coles.com.au/apps/auth/signout');
await sleep(15354);

// close the browser`
await browser.close();
