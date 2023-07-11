/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * stgeorge.js: This file contains an example scraper for St George Bank
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const [user, secid, pass] = process.argv.slice(-3);

function process_transactions(trans) {
  let processed = [];
  const re = /(\d\d)\/(\d\d)\/(\d\d\d\d)/;
  for (let i = 0; i < trans.length; i++) {
    const row = trans[i];
    const r = re.exec(row.Date);
    const t = new Date(`${r[3]}-${r[2]}-${r[1]} 12:00:00`);
    processed.push({
      time: t.getTime() / 1000,
      description: row.Description,
      category: row.Category,
      source: 'St George',
      amount: (row.Debit != 0) ? -row.Debit : row.Credit,
      raw: row
    });
  }

  return processed;
}

puppeteer.use(StealthPlugin());

puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome-stable' }).then(async (browser) => {
  const page = await browser.newPage();
  await page.goto('https://ibanking.stgeorge.com.au/ibank/loginPage.action');
  await page.waitForSelector('input[name=userId]');
  await page.type('input[name=userId]', user);
  await page.type('input[name=securityNumber]', secid);
  await page.type('input[name=password]', pass);
  await page.waitForSelector('#logonButton');
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

  const res = {
    balance: 0,
    type: 'St George',
    transactions: []
  };
  for (let i = 0; i < table.length; i++) {
    const row = table[i];
    if (row.length === 0 || row.length !== header.length || row[0] === '') {
        if (row[1] === 'Closing Balance') {
          res.balance = +row[5].replace('$', '').replace(',', '');
        }
        continue;
    }
    const out = {};
    for (let j = 0; j < row.length; j++) {
      if (['Debit', 'Credit', 'Balance'].includes(header[j])) {
        out[header[j]] = +row[j].replace('$', '').replace(',', '');
      } else {
        out[header[j]] = row[j];
      }
    }
    res.transactions.push(out);
  }

  res.transactions = process_transactions(res.transactions);
  console.log(JSON.stringify(res));
  await browser.close();
});
