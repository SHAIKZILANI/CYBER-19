import puppeteer from 'puppeteer-core';
import fs from 'fs';

// Controlled local browser DOM XSS sink interception for CYBER-19
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
};

const targetUrl = getArg('--url', 'http://localhost:3000/#/search');
const testParam = getArg('--param', 'q');
const timeoutMs = parseInt(getArg('--timeout', '15000'), 10);

// Detect available browser executable
function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const path of candidates) {
    if (fs.existsSync(path)) return path;
  }
  return null;
}

async function executeProbe() {
  const startTime = Date.now();
  const execPath = findBrowserExecutable();

  if (!execPath) {
    console.log(JSON.stringify({
      status: 'UNAVAILABLE',
      vulnerable: false,
      detectionMechanism: 'BROWSER_DOM_INTERCEPTION',
      reason: 'No supported browser executable (Google Chrome or Microsoft Edge) found in local environment'
    }));
    return;
  }

  // Safety boundary check: allow only local loopback targets
  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== 'host.docker.internal') {
      console.log(JSON.stringify({
        status: 'REJECTED',
        vulnerable: false,
        detectionMechanism: 'BROWSER_DOM_INTERCEPTION',
        reason: 'Target is not within authorized local laboratory boundary (localhost, 127.0.0.1, host.docker.internal)'
      }));
      return;
    }
  } catch (e) {
    console.log(JSON.stringify({
      status: 'ERROR',
      vulnerable: false,
      detectionMechanism: 'BROWSER_DOM_INTERCEPTION',
      reason: 'Invalid URL format: ' + e.message
    }));
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    const canaryId = 'cyber19_dom_' + Math.random().toString(36).substring(2, 9);
    const canaryPayload = `<iframe src="javascript:void(0)" id="${canaryId}"></iframe>`;

    // Hook dangerous DOM sinks before any scripts run
    await page.evaluateOnNewDocument((cid) => {
      window.__cyber19_sinks = [];
      const hookMethod = (obj, prop, name) => {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
          if (descriptor && descriptor.set) {
            const originalSet = descriptor.set;
            Object.defineProperty(obj, prop, {
              set: function(val) {
                if (typeof val === 'string' && val.includes(cid)) {
                  window.__cyber19_sinks.push({ sink: name, valSnippet: val.substring(0, 120) });
                }
                return originalSet.call(this, val);
              }
            });
          }
        } catch (_) {}
      };

      hookMethod(Element.prototype, 'innerHTML', 'Element.innerHTML');
      hookMethod(Element.prototype, 'outerHTML', 'Element.outerHTML');
      
      const origDocWrite = document.write;
      document.write = function(...args) {
        for (const a of args) {
          if (typeof a === 'string' && a.includes(cid)) {
            window.__cyber19_sinks.push({ sink: 'document.write', valSnippet: a.substring(0, 120) });
          }
        }
        return origDocWrite.apply(this, args);
      };
    }, canaryId);

    // Build URL with test parameter
    let fullUrl = targetUrl;
    if (fullUrl.includes('?')) {
      fullUrl += `&${encodeURIComponent(testParam)}=${encodeURIComponent(canaryPayload)}`;
    } else {
      fullUrl += `?${encodeURIComponent(testParam)}=${encodeURIComponent(canaryPayload)}`;
    }

    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: timeoutMs }).catch(() => {});

    // Allow framework / Angular digest cycle to settle
    await new Promise(r => setTimeout(r, 2000));

    const result = await page.evaluate((cid) => {
      const el = document.getElementById(cid);
      return {
        elementRendered: !!el,
        recordedSinks: window.__cyber19_sinks || [],
        title: document.title
      };
    }, canaryId);

    const isVulnerable = result.elementRendered || result.recordedSinks.length > 0;
    const durationMs = Date.now() - startTime;

    const output = {
      status: 'SUCCESS',
      vulnerable: isVulnerable,
      detectionMechanism: 'BROWSER_DOM_INTERCEPTION',
      browserEngine: execPath.includes('Chrome') ? 'Google Chrome (Headless)' : 'Microsoft Edge (Headless)',
      targetUrl,
      parameter: testParam,
      elementRendered: result.elementRendered,
      recordedSinks: result.recordedSinks,
      executionDurationMs: durationMs,
      evidence: isVulnerable
        ? `Dynamic browser DOM execution confirmed: Canary token '${canaryId}' injected and rendered via parameter '${testParam}' into client-side DOM.`
        : `Dynamic browser evaluation completed: Canary token '${canaryId}' was not reflected or executed in client DOM sinks.`
    };

    console.log(JSON.stringify(output));
  } catch (err) {
    console.log(JSON.stringify({
      status: 'EXECUTION_ERROR',
      vulnerable: false,
      detectionMechanism: 'BROWSER_DOM_INTERCEPTION',
      reason: err.message,
      executionDurationMs: Date.now() - startTime
    }));
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

executeProbe();
