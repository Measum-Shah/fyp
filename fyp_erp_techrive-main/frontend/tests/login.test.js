const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept network requests to see what the frontend sends and receives
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/api/auth/login')) {
      console.log('-> API Request:', request.method(), request.url(), request.postData());
    }
    request.continue();
  });
  page.on('response', async response => {
    if (response.url().includes('/api/auth/login')) {
      console.log('<- API Response:', response.status());
      try {
        const text = await response.text();
        console.log('<- API Body:', text);
      } catch (e) {
        console.log('<- API Body: (could not read)');
      }
    }
  });

  // Log console messages from the browser
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  console.log('Typing credentials...');
  await page.type('input[name="email"]', 'ahmed.malik@techrive.edu.pk');
  await page.type('input[name="password"]', 'Employee@123');

  console.log('Clicking login button...');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {})
  ]);

  console.log('Checking for error messages on page...');
  const errorText = await page.evaluate(() => {
    const el = document.querySelector('.error-banner'); // Adjust based on your actual error class
    return el ? el.textContent : null;
  });
  console.log('Error banner text:', errorText);

  const errorClassText = await page.evaluate(() => {
    const el = document.querySelector('.form-error') || document.querySelector('.input-error'); 
    return el ? el.textContent : null;
  });
  console.log('Error class text:', errorClassText);
  
  // print all text to find the error
  const allText = await page.evaluate(() => document.body.innerText);
  if (allText.includes('Invalid credentials')) {
    console.log('Found "Invalid credentials" in page text!');
  } else if (allText.includes('Welcome back')) {
    console.log('Found "Welcome back" in page text! Login succeeded.');
  } else {
    console.log('Could not determine success/failure from text. Text:', allText.substring(0, 200));
  }

  await browser.close();
})();
