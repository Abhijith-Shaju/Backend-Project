import puppeteer from 'puppeteer';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static(join(__dirname, 'dist')));

const server = app.listen(3000, async () => {
  console.log('Server started on port 3000');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000');
  
  try {
    // We are on login page by default. Wait, we need to login or mock it to get to the dashboard.
    // Let's just mock the auth state or navigate to it if protected.
    // Actually, setting localStorage might work.
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ name: 'Test', role: 'admin' }));
    });
    
    await page.goto('http://localhost:3000');
    
    await page.waitForSelector('button', { timeout: 5000 });
    // Click the chatbot button (it's the one with MessageSquare icon, fixed bottom-6)
    const buttons = await page.$$('button');
    let clicked = false;
    for (let btn of buttons) {
      const className = await page.evaluate(el => el.className, btn);
      if (className.includes('fixed bottom-6 right-6')) {
        console.log('Clicking Chatbot button');
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) console.log('Chatbot button not found');
    
    // Wait a bit to catch errors
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.log('SCRIPT ERROR:', err.message);
  } finally {
    await browser.close();
    server.close();
  }
});
