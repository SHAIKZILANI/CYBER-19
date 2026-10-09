const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForBackend() {
  console.log('Checking backend at http://localhost:8081...');
  for (let i = 0; i < 30; i++) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 8081,
        path: '/api/scans',
        method: 'GET'
      });
      if (res.status === 200) {
        console.log('Backend is UP and responsive!');
        return true;
      }
    } catch (e) {
      // wait
    }
    await sleep(1000);
  }
  throw new Error('Backend failed to start in time');
}

async function runScan(targetUrl, targetName, runZap = false) {
  console.log(`\n======================================================`);
  console.log(`LAUNCHING SCAN: ${targetName} (${targetUrl}) | ZAP: ${runZap}`);
  console.log(`======================================================`);

  const scanReqPayload = {
    targetUrl,
    targetName,
    authenticated: false,
    runZap,
    authorizationConfirmed: true
  };

  const startRes = await request({
    hostname: 'localhost',
    port: 8081,
    path: '/api/scans/start',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, scanReqPayload);

  const scanId = startRes.data.scanId || startRes.data.id;
  if (!scanId) {
    throw new Error('Failed to start scan: ' + JSON.stringify(startRes.data));
  }
  console.log(`Scan #${scanId} initiated. Polling for completion...`);

  let scanObj = null;
  while (true) {
    await sleep(2000);
    const pollRes = await request({
      hostname: 'localhost',
      port: 8081,
      path: `/api/scans/${scanId}`,
      method: 'GET'
    });
    scanObj = pollRes.data;
    console.log(`[Scan #${scanId}] Status: ${scanObj.status}, ZAP Status: ${scanObj.zapExecutionStatus || 'N/A'}, Stage: ${scanObj.currentStage || 'N/A'}, Time: ${scanObj.executionTimeMs}ms`);
    if (scanObj.status === 'COMPLETED' || scanObj.status === 'FAILED') {
      break;
    }
  }

  // Fetch Report
  console.log(`Fetching Report for Scan #${scanId}...`);
  const reportRes = await request({
    hostname: 'localhost',
    port: 8081,
    path: `/api/scans/${scanId}/report`,
    method: 'GET'
  });

  const report = reportRes.data;
  console.log(`\n--- REPORT SUMMARY FOR SCAN #${scanId} (${targetName}) ---`);
  console.log(`Report Status: ${reportRes.status}`);
  console.log(`Total Findings: ${report.vulnerabilities?.length || 0}`);
  console.log(`Total Workflow Duration: ${report.performance?.totalWorkflowDurationMs}ms`);
  console.log(`CYBER-19 Duration: ${report.performance?.cyber19DurationMs}ms`);
  console.log(`Access Control Duration: ${report.performance?.accessControlDurationMs || scanObj.accessControlDurationMs || 'N/A'}ms`);
  if (runZap) {
    console.log(`OWASP ZAP Duration: ${report.performance?.zapDurationMs}ms`);
  }

  // A. Access Control Assessment Verification
  console.log('\n[A. Access Control Assessment]');
  const ac = report.accessControl;
  if (ac) {
    const items = ac.checkItems || ac.items || ac.checks || [];
    console.log(`  Checks Performed: ${ac.checksPerformed != null ? ac.checksPerformed : ac.totalChecksPerformed}`);
    console.log(`  Endpoints Tested: ${ac.endpointsTested != null ? ac.endpointsTested : ac.endpointsTestedCount}`);
    console.log(`  Protected Endpoints: ${ac.protectedEndpoints != null ? ac.protectedEndpoints : ac.protectedEndpointsFound}`);
    console.log(`  Authorization Violations: ${ac.authorizationViolations != null ? ac.authorizationViolations : ac.violationsFound}`);
    console.log(`  Potential IDOR: ${ac.potentialIdorFindings != null ? ac.potentialIdorFindings : (items.filter(i => i.idor).length)}`);
    console.log(`  Audit Items Count: ${items.length}`);
    if (items.length > 0) {
      console.log('  Sample Audit Items:');
      items.slice(0, 3).forEach(it => {
        console.log(`    - [${it.httpMethod}] ${it.endpoint} => HTTP ${it.actualHttpStatus} | Result: ${it.result} | Violation: ${it.violation}`);
      });
    }
  } else {
    console.warn('  WARN: No accessControl object in report response');
  }

  // B. Remediation Guidance Verification
  console.log('\n[B. Remediation Guidance on Findings]');
  const vulns = report.vulnerabilities || [];
  let remediatedCount = 0;
  for (const v of vulns) {
    if (v.remediationGuidance) {
      remediatedCount++;
    }
  }
  console.log(`  Total CYBER-19 Findings: ${vulns.length}`);
  console.log(`  Findings with Centralized Remediation: ${remediatedCount}`);
  if (vulns.length > 0) {
    const sample = vulns[0];
    console.log(`  Sample Finding [${sample.vulnerabilityType}]:`);
    console.log(`    Severity: ${sample.severity}`);
    console.log(`    Endpoint: ${sample.endpointUrl}`);
    if (sample.remediationGuidance) {
      console.log(`    Remediation Title: ${sample.remediationGuidance.vulnerabilityType || sample.remediationGuidance.title}`);
      console.log(`    Description: ${sample.remediationGuidance.description}`);
      console.log(`    Impact: ${sample.remediationGuidance.impact}`);
      console.log(`    Fix: ${sample.remediationGuidance.recommendedFix || sample.remediationGuidance.remediation}`);
      console.log(`    Developer Action: ${sample.remediationGuidance.recommendedDeveloperAction || sample.remediationGuidance.developerAction}`);
      console.log(`    Security Practice: ${sample.remediationGuidance.securityPracticeReference || sample.remediationGuidance.reference}`);
    }
  }

  // C. Detection Coverage Verification
  console.log('\n[C. Detection Coverage]');
  const cov = report.coverage;
  if (cov) {
    console.log('  Category Breakdown:');
    for (const [cat, data] of Object.entries(cov)) {
      const covPctStr = data.coveragePercent != null ? `${data.coveragePercent.toFixed(1)}%` : 'N/A';
      console.log(`    - ${cat}: Total=${data.totalCases}, Vuln=${data.vulnerableCases}, Detected=${data.detected}, Missed=${data.missed}, Coverage=${covPctStr}, P=${data.precision}%, R=${data.recall}%, F1=${data.f1}`);
    }
  } else {
    console.warn('  WARN: No coverage object in report response');
  }

  // D. Traceability
  const trace = report.zapComparison?.traceability || [];
  console.log(`\n[D. Ground Truth Traceability]: ${trace.length} entries`);

  return { scanId, scanObj, report };
}

async function main() {
  await waitForBackend();

  // 1. Scan OWASP Juice Shop with CYBER-19 + OWASP ZAP
  console.log('\n>>> TARGET 1: OWASP Juice Shop (http://localhost:3000) with CYBER-19 + ZAP <<<');
  const juiceResult = await runScan('http://localhost:3000', 'OWASP Juice Shop', true);

  // 2. Scan DVWA
  console.log('\n>>> TARGET 2: DVWA (http://localhost:8082) with CYBER-19 <<<');
  const dvwaResult = await runScan('http://localhost:8082', 'DVWA Local Lab', false);

  // 3. Scan WebGoat
  console.log('\n>>> TARGET 3: WebGoat (http://localhost:8084/WebGoat) with CYBER-19 <<<');
  const webgoatResult = await runScan('http://localhost:8084/WebGoat', 'OWASP WebGoat', false);

  console.log('\n======================================================');
  console.log('>>> ALL END-TO-END VERIFICATION SCANS COMPLETED! <<<');
  console.log('======================================================');
}

main().catch(err => {
  console.error('Execution failure:', err);
  process.exit(1);
});
