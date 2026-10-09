const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 8081,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('====================================================');
  console.log('   CYBER-19 PHASE 16 END-TO-END VERIFICATION SUITE   ');
  console.log('====================================================\n');

  // 1. Security & Scope Tests
  console.log('--- 1. SECURITY & SSRF SCOPE CONTROLS ---');
  
  // Test A: Metadata SSRF
  const metaRes = await request('POST', '/api/scans/start-url', {
    targetUrl: 'http://169.254.169.254/latest/meta-data',
    authorized: true,
    runZap: false
  });
  console.log('A. Metadata SSRF (169.254.169.254): Status', metaRes.status, 'Message:', metaRes.body.message);
  if (metaRes.status === 403 && metaRes.body.message.includes('Target blocked by security scope policy')) {
    console.log('   ✓ PASSED: Cloud metadata endpoint successfully blocked.');
  } else {
    console.error('   ✗ FAILED: Metadata not blocked properly.');
  }

  // Test B: Unauthorized local port (e.g. MySQL 3306)
  const portRes = await request('POST', '/api/scans/start-url', {
    targetUrl: 'http://localhost:3306',
    authorized: true,
    runZap: false
  });
  console.log('B. Localhost port 3306: Status', portRes.status, 'Message:', portRes.body.message);
  if (portRes.status === 403 && portRes.body.message.includes('Target blocked by security scope policy')) {
    console.log('   ✓ PASSED: Non-lab localhost port successfully blocked.');
  } else {
    console.error('   ✗ FAILED: Port 3306 not blocked properly.');
  }

  // Test C: External URL without authorization confirmation
  const unauthRes = await request('POST', '/api/scans/start-url', {
    targetUrl: 'https://example.com',
    authorized: false,
    runZap: false
  });
  console.log('C. External URL without authorization confirmation: Status', unauthRes.status, 'Message:', unauthRes.body.message);
  if (unauthRes.status === 403 && unauthRes.body.message.includes('Authorization confirmation is required')) {
    console.log('   ✓ PASSED: Unconfirmed external target successfully blocked.');
  } else {
    console.error('   ✗ FAILED: Unconfirmed authorization not rejected properly.');
  }

  // 2. Full End-to-End URL Scan with CYBER-19 + OWASP ZAP (Requirement 15 & 19)
  console.log('\n--- 2. END-TO-END SCAN: DVWA (http://localhost:8082) WITH CYBER-19 + OWASP ZAP ---');
  const startZapRes = await request('POST', '/api/scans/start-url', {
    targetUrl: 'http://localhost:8082',
    targetName: 'DVWA Presentation Demo',
    authorized: true,
    runZap: true
  });
  console.log('Scan Launch Response:', startZapRes.status, 'Scan ID:', startZapRes.body.scanId);
  const scanWithZapId = startZapRes.body.scanId;

  // Poll status
  let scanWithZapStatus = null;
  while (true) {
    await sleep(500);
    const poll = await request('GET', `/api/scans/${scanWithZapId}/status`);
    console.log(`   Status Poll: ${poll.body.status} | Stage: ${poll.body.stageMessage} | Endpoints: ${poll.body.endpointsDiscoveredCount}`);
    if (poll.body.status === 'COMPLETED' || poll.body.status === 'FAILED') {
      scanWithZapStatus = poll.body;
      break;
    }
  }

  // Fetch Report for Scan with ZAP
  const zapReport = await request('GET', `/api/scans/${scanWithZapId}/report`);
  const perfWithZap = zapReport.body.performance;
  console.log('\nScan with ZAP Performance Breakdown:');
  console.log('   - Scan ID: #' + zapReport.body.scan.id);
  console.log('   - Target: ' + zapReport.body.target.url);
  console.log('   - CYBER-19 Duration: ' + perfWithZap.cyber19DurationMs + ' ms');
  console.log('   - OWASP ZAP Duration: ' + perfWithZap.zapDurationMs + ' ms');
  console.log('   - Benchmark Duration: ' + perfWithZap.benchmarkDurationMs + ' ms');
  console.log('   - Total Workflow Duration: ' + perfWithZap.totalWorkflowDurationMs + ' ms');
  console.log('   - ZAP Status: ' + perfWithZap.zapStatus);
  console.log('   - ZAP Scan ID: #' + perfWithZap.zapScanId);
  console.log('   - CYBER-19 Unique Findings: ' + zapReport.body.vulnerabilities.filter(v => v.source !== 'OWASP_ZAP').length);
  console.log('   - Total Findings Count: ' + zapReport.body.vulnerabilities.length);

  // 3. Full End-to-End URL Scan with ZAP DISABLED (Requirement 19)
  console.log('\n--- 3. END-TO-END SCAN: DVWA (http://localhost:8082) WITH ZAP DISABLED ---');
  const startNoZapRes = await request('POST', '/api/scans/start-url', {
    targetUrl: 'http://localhost:8082',
    targetName: 'DVWA Isolated Scan',
    authorized: true,
    runZap: false
  });
  console.log('Scan Launch Response:', startNoZapRes.status, 'Scan ID:', startNoZapRes.body.scanId);
  const scanNoZapId = startNoZapRes.body.scanId;

  // Poll status
  while (true) {
    await sleep(500);
    const poll = await request('GET', `/api/scans/${scanNoZapId}/status`);
    console.log(`   Status Poll: ${poll.body.status} | Stage: ${poll.body.stageMessage}`);
    if (poll.body.status === 'COMPLETED' || poll.body.status === 'FAILED') {
      break;
    }
  }

  // Fetch Report for Scan without ZAP
  const noZapReport = await request('GET', `/api/scans/${scanNoZapId}/report`);
  const perfNoZap = noZapReport.body.performance;
  console.log('\nScan without ZAP Performance Breakdown:');
  console.log('   - Scan ID: #' + noZapReport.body.scan.id);
  console.log('   - Target: ' + noZapReport.body.target.url);
  console.log('   - CYBER-19 Duration: ' + perfNoZap.cyber19DurationMs + ' ms');
  console.log('   - OWASP ZAP Duration: ' + (perfNoZap.zapDurationMs === null ? 'null (Not executed)' : perfNoZap.zapDurationMs + ' ms'));
  console.log('   - Benchmark Duration: ' + perfNoZap.benchmarkDurationMs + ' ms');
  console.log('   - Total Workflow Duration: ' + perfNoZap.totalWorkflowDurationMs + ' ms');
  console.log('   - ZAP Status: ' + perfNoZap.zapStatus);
  console.log('   - ZAP Scan ID: ' + perfNoZap.zapScanId);

  // Verify Timing Isolation & Integrity
  console.log('\n--- 4. DATASET & TIMING ISOLATION VERIFICATION ---');
  if (scanWithZapId !== scanNoZapId) {
    console.log('   ✓ PASSED: Scans received unique IDs (#' + scanWithZapId + ' vs #' + scanNoZapId + ').');
  } else {
    console.error('   ✗ FAILED: Duplicate scan IDs detected.');
  }

  if (perfNoZap.zapDurationMs === null && perfNoZap.zapStatus === 'NOT_EXECUTED') {
    console.log('   ✓ PASSED: Disabled ZAP scan shows zapDurationMs = null and zapStatus = NOT_EXECUTED.');
    console.log('   ✓ PASSED: Stale 83,649 ms duration does NOT appear!');
  } else {
    console.error('   ✗ FAILED: Disabled ZAP scan did not report NOT_EXECUTED correctly:', perfNoZap);
  }

  if (perfWithZap.zapDurationMs !== null && perfWithZap.zapDurationMs > 0 && perfWithZap.zapStatus === 'COMPLETED') {
    console.log('   ✓ PASSED: Enabled ZAP scan shows live measured zapDurationMs = ' + perfWithZap.zapDurationMs + ' ms.');
  } else {
    console.error('   ✗ FAILED: Live ZAP scan duration missing or invalid:', perfWithZap);
  }

  // 5. Existing Authorized Targets Check (Requirement 14)
  console.log('\n--- 5. VERIFY EXISTING AUTHORIZED TARGETS WORKFLOW ---');
  const targetsRes = await request('GET', '/api/targets');
  console.log('Targets count in registry:', targetsRes.body.length);
  const juiceTarget = targetsRes.body.find(t => t.url && t.url.includes(':3000'));
  const dvwaTarget = targetsRes.body.find(t => t.url && t.url.includes(':8082'));
  const webGoatTarget = targetsRes.body.find(t => t.url && t.url.includes(':8084'));
  console.log('   - OWASP Juice Shop present:', !!juiceTarget);
  console.log('   - DVWA present:', !!dvwaTarget);
  console.log('   - WebGoat present:', !!webGoatTarget);
  if (juiceTarget && dvwaTarget && webGoatTarget) {
    console.log('   ✓ PASSED: All Authorized laboratory targets preserved and active.');
  } else {
    console.error('   ✗ FAILED: Missing authorized laboratory targets.');
  }

  console.log('\n====================================================');
  console.log('           ALL PHASE 16 VERIFICATIONS COMPLETE       ');
  console.log('====================================================');
}

run().catch(console.error);
