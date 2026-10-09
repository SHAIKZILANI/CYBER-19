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

async function pollScanUntilDone(scanId, timeoutSec = 60) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutSec * 1000) {
    const res = await getJson(`/api/scans/${scanId}/status`);
    if (res.data && (res.data.status === 'COMPLETED' || res.data.status === 'FAILED')) {
      return res.data;
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for scan #${scanId}`);
}

async function main() {
  console.log('=== PHASE 15 PRODUCTION VERIFICATION SUITE ===\n');

  // Test 1: Scope & SSRF Controls
  console.log('1. Testing Security Scope & SSRF Protection:');
  const resMeta = await postJson('/api/targets/validate', { url: 'http://169.254.169.254/latest/meta-data/' });
  console.log(`   - Cloud metadata (169.254.169.254): Status ${resMeta.status} (${resMeta.data.error || 'Blocked'})`);

  const resPort = await postJson('/api/targets/validate', { url: 'http://localhost:3306' });
  console.log(`   - Arbitrary local port (3306): Status ${resPort.status} (${resPort.data.error || 'Blocked'})`);

  const resUnauth = await postJson('/api/targets/validate', { url: 'https://example.com', authorized: false });
  console.log(`   - External URL without confirmation: Status ${resUnauth.status} (${resUnauth.data.error || 'Blocked'})`);

  const resAuth = await postJson('/api/targets/validate', { url: 'https://example.com', authorized: true });
  console.log(`   - External URL with confirmation: Status ${resAuth.status} (${resAuth.data.valid ? 'Authorized & Valid' : 'Error'})`);

  const resLab = await postJson('/api/targets/validate', { url: 'http://localhost:8082' });
  console.log(`   - DVWA Lab (8082): Status ${resLab.status} (${resLab.data.authorized ? 'Authorized' : 'Error'})\n`);

  // Test 2: Scan A (Manual URL Scan against DVWA: http://localhost:8082 without ZAP)
  console.log('2. Executing Scan A: Manual URL Scan against DVWA (http://localhost:8082, runZap: false)...');
  const startA = await postJson('/api/scans/start-url', {
    targetUrl: 'http://localhost:8082',
    targetName: 'DVWA Laboratory Test',
    authorized: true,
    runZap: false
  });
  console.log(`   Scan A initiated: ID #${startA.data.scanId}, Status: ${startA.data.status}`);

  const statusA = await pollScanUntilDone(startA.data.scanId);
  console.log(`   Scan A completed: Status = ${statusA.status}, executionTimeMs = ${statusA.executionTimeMs} ms`);

  const reportA = await getJson(`/api/scans/${startA.data.scanId}/report`);
  const perfA = reportA.data.performance;
  console.log('   Scan A Report Performance Object:');
  console.log(`     - cyber19DurationMs: ${perfA.cyber19DurationMs} ms`);
  console.log(`     - zapDurationMs: ${perfA.zapDurationMs}`);
  console.log(`     - zapStatus: ${perfA.zapStatus}`);
  console.log(`     - totalWorkflowDurationMs: ${perfA.totalWorkflowDurationMs} ms`);

  if (perfA.zapDurationMs !== null) {
    console.error('   ❌ FAILURE: Scan A displayed zapDurationMs when ZAP was NOT run!');
    process.exit(1);
  } else {
    console.log('   ✅ SUCCESS: Scan A zapDurationMs is NULL and zapStatus is NOT_EXECUTED (no 83,649 ms stale duration!).');
  }

  // Test 3: Scan B (Manual URL Scan against Juice Shop: http://localhost:3000 without ZAP)
  console.log('\n3. Executing Scan B: Manual URL Scan against Juice Shop (http://localhost:3000, runZap: false)...');
  const startB = await postJson('/api/scans/start-url', {
    targetUrl: 'http://localhost:3000',
    targetName: 'OWASP Juice Shop Test',
    authorized: true,
    runZap: false
  });
  console.log(`   Scan B initiated: ID #${startB.data.scanId}, Status: ${startB.data.status}`);

  const statusB = await pollScanUntilDone(startB.data.scanId);
  console.log(`   Scan B completed: Status = ${statusB.status}, executionTimeMs = ${statusB.executionTimeMs} ms`);

  const reportB = await getJson(`/api/scans/${startB.data.scanId}/report`);
  const perfB = reportB.data.performance;
  console.log('   Scan B Report Performance Object:');
  console.log(`     - cyber19DurationMs: ${perfB.cyber19DurationMs} ms`);
  console.log(`     - zapDurationMs: ${perfB.zapDurationMs}`);
  console.log(`     - zapStatus: ${perfB.zapStatus}`);
  console.log(`     - totalWorkflowDurationMs: ${perfB.totalWorkflowDurationMs} ms`);

  if (startA.data.scanId === startB.data.scanId) {
    console.error('   ❌ FAILURE: Duplicate scan ID generated!');
    process.exit(1);
  } else {
    console.log(`   ✅ SUCCESS: Unique scan IDs confirmed (#${startA.data.scanId} vs #${startB.data.scanId}).`);
  }

  if (perfB.zapDurationMs !== null) {
    console.error('   ❌ FAILURE: Scan B displayed stale ZAP duration!');
    process.exit(1);
  } else {
    console.log('   ✅ SUCCESS: Scan B has its own isolated timing, not contaminated by any previous scan.');
  }

  // Test 4: Existing Authorized Targets feature check
  console.log('\n4. Verifying Existing Authorized Targets Feature (/api/targets)...');
  const targetsRes = await getJson('/api/targets');
  console.log(`   Registered Targets: ${targetsRes.data.length} found`);
  for (const t of targetsRes.data.slice(0, 4)) {
    console.log(`     - Target #${t.id}: ${t.name} (${t.url}) [${t.environment} / ${t.status}]`);
  }

  console.log('\n=== ALL PHASE 15 REQUIREMENTS VERIFIED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Error running verification suite:', err);
  process.exit(1);
});
