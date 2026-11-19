import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Builder, By, until, Select } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { startServer } from './server.js';

let server;
before(async () => { server = await startServer(); });
after(async () => { await server?.close(); });

export { assert, By, until, Select };
export function scenario(name, body) {
  test(name, { timeout: 90000 }, async () => {
    const options = new chrome.Options().addArguments(
      '--disable-dev-shm-usage', '--window-size=1440,1000',
      '--disable-background-networking',
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1'
    );
    if (process.env.CI) options.addArguments('--no-sandbox');
    if (process.env.HEADLESS !== 'false') options.addArguments('--headless=new');
    if (process.env.CHROME_BINARY) options.setChromeBinaryPath(process.env.CHROME_BINARY);
    options.setPageLoadStrategy('eager');
    let builder = new Builder().forBrowser('chrome').setChromeOptions(options);
    await mkdir('reports', { recursive:true });
    const service = new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH || undefined)
      .loggingTo('reports/chromedriver.log').enableVerboseLogging();
    builder = builder.setChromeService(service);
    const driver = await builder.build();
    try {
      await driver.manage().setTimeouts({ implicit: 0, pageLoad: 20000, script: 10000 });
      const p = {
        driver,
        async open(path = '/') { await driver.get(server.url + path); },
        async element(css) {
          const e = await driver.wait(until.elementLocated(By.css(css)), 10000, css);
          await driver.wait(until.elementIsVisible(e), 10000, css);
          return e;
        },
        async click(css) { await (await this.element(css)).click(); },
        async fill(css, value) {
          const e = await this.element(css);
          await e.clear();
          if (String(value)) await e.sendKeys(String(value));
        },
        async text(css) { return (await this.element(css)).getText(); },
        async select(css, value) { await new Select(await this.element(css)).selectByValue(value); },
        async waitText(css, expected) {
          await driver.wait(async () => (await this.text(css)).includes(expected), 10000, css + ': ' + expected);
        },
        async alert(text, answer) {
          const a = await driver.wait(until.alertIsPresent(), 10000);
          assert.match(await a.getText(), text);
          if (answer !== undefined) await a.sendKeys(answer);
          await a.accept();
        }
      };
      await body(p);
    } catch (error) {
      const dir = 'reports/' + name.replace(/[^a-zA-Z0-9-]/g, '_').slice(0,100);
      await mkdir(dir, { recursive: true });
      for (const [file, read] of [
        ['screen.png', async () => Buffer.from(await driver.takeScreenshot(), 'base64')],
        ['page.html', () => driver.getPageSource()],
        ['url.txt', () => driver.getCurrentUrl()]
      ]) {
        try { await writeFile(dir + '/' + file, await read()); } catch {}
      }
      throw error;
    } finally { await driver.quit(); }
  });
}
