const http = require('http');

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 8081,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 8081,
      path: urlPath
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Testing Live ZAP Execution on http://localhost:8082 (DVWA)...');
  const start = await postJson('/api/scans/start-url', {
    targetUrl: 'http://localhost:8082',
    targetName: 'DVWA with Live ZAP',
    authorized: true,
    runZap: true
  });
  console.log('Initiated Scan with ZAP:', start.data);

  const scanId = start.data.scanId;
  const pollStart = Date.now();
  let finalStatus = null;

  while ((Date.now() - pollStart) < 60000) {
    const s = await getJson(`/api/scans/${scanId}/status`);
    console.log(`[+${Math.round((Date.now() - pollStart)/1000)}s] Status: ${s.data.status} - ${s.data.stageMessage}`);
    if (s.data.status === 'COMPLETED' || s.data.status === 'FAILED') {
      finalStatus = s.data;
      break;
    }
    await sleep(2000);
  }

  const report = await getJson(`/api/scans/${scanId}/report`);
  console.log('\nFinal Report Performance for Scan #' + scanId + ':');
  console.log(JSON.stringify(report.data.performance, null, 2));
}

main().catch(console.error);
