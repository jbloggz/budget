/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * stgeorge.js: This file contains an example scraper for St George Bank
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';


const secrets = JSON.parse(fs.readFileSync(process.argv[2], { encoding: 'utf8', flag: 'r' }));
const { user, security_number, password } = secrets.scrapers['St George Bank'];

puppeteer.use(StealthPlugin());

puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome-stable' }).then(async (browser) => {
   const page = await browser.newPage();
   await page.goto('https://ibanking.stgeorge.com.au/ibank/loginPage.action');
   await page.waitForSelector('input[name=userId]');
   await page.type('input[name=userId]', user);
   await page.type('input[name=securityNumber]', security_number);
   await page.type('input[name=password]', password);
   await page.waitForSelector('#logonButton');
   await page.waitForTimeout(3000);
   await page.click('#logonButton');
   await page.waitForSelector('#acctSummaryList a');
   await page.click('#acctSummaryList a');
   await page.waitForSelector('a[href="#transaction-30days"]');
   await page.click('a[href="#transaction-30days"]');
   await page.waitForSelector('#transaction-30days #txnHistoryTable');
   await page.waitForTimeout(3000);
   const header = await page.$$eval('#transaction-30days #txnHistoryTable th', (row) => {
      return Array.from(row, (th) => th.innerText);
   });
   const table = await page.$$eval('#transaction-30days #txnHistoryTable tr', (rows) => {
      return Array.from(rows, (row) => {
         const columns = row.querySelectorAll('td');
         return Array.from(columns, (column) => column.innerText.trim().replace(/\n/g, ': ').replace(/\s+/g, ' '));
      });
   });

   const re = /(\d\d)\/(\d\d)\/(\d\d\d\d)/;
   const res = {
      raw: [],
      transactions: [],
   };
   for (let i = 0; i < table.length; i++) {
      const row = table[i];
      if (row.length === 0 || row.length !== header.length || row[0] === '') {
         continue;
      }
      const out = {};
      res.raw.push(row);
      for (let j = 0; j < row.length; j++) {
         if (['Debit', 'Credit', 'Balance'].includes(header[j])) {
            out[header[j]] = +row[j].replace('$', '').replace(',', '');
         } else {
            out[header[j]] = row[j];
         }
      }

      const r = re.exec(out.Date);
      res.transactions.push({
         date: `${r[3]}-${r[2]}-${r[1]}`,
         description: out.Description,
         amount: Math.round((out.Debit != 0 ? -out.Debit : out.Credit) * 100),
         source: 'St George Bank',
      });
   }

   console.log(JSON.stringify(res));
   await browser.close();
});
