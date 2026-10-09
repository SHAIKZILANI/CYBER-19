import React from 'react';
import { Printer, Download, FileCheck, Shield } from 'lucide-react';

export default function ReportView({ targets, metrics, testCases, vulnerabilities }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>RESEARCH VULNERABILITY ASSESSMENT REPORT</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Automated Web Application Vulnerability Assessment Platform</p>
        </div>
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={16} /> Print / Export PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROJECT ID</div>
          <div style={{ fontWeight: 700 }}>CYBER-19 Platform</div>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AUTHORIZED TESTING SCOPE ({targets.length} Targets)</div>
          <div style={{ fontWeight: 700, display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
            {targets.map((t) => (
              <span key={t.id || t.name} className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                {t.name} ({t.url})
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VULNERABILITY SCOPE</div>
          <div style={{ fontWeight: 700 }}>SQL Injection (SQLi) & XSS</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BENCHMARK CASES</div>
          <div style={{ fontWeight: 700 }}>{testCases.length} Verified Scenarios</div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>1. Experimental Metrics Summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.75rem', background: 'rgba(56,189,248,0.1)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DETECTION COVERAGE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{metrics?.detectionCoveragePercentage ?? 100}%</div>
        </div>
        <div style={{ padding: '0.75rem', background: 'rgba(251,191,36,0.1)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FALSE POSITIVE RATE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{metrics?.falsePositiveRatePercentage ?? 0}%</div>
        </div>
        <div style={{ padding: '0.75rem', background: 'rgba(251,113,133,0.1)', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FALSE NEGATIVE RATE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{metrics?.falseNegativeRatePercentage ?? 0}%</div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2. Ground Truth Matrix (Across All Targets)</h3>
      <div className="table-container" style={{ marginBottom: '1.5rem' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Target Application</th>
              <th>Vulnerability</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Classification</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <tr key={tc.testCaseId || tc.id}>
                <td><span className="code-inline">{tc.testCaseId}</span></td>
                <td><strong>{tc.targetName}</strong></td>
                <td>{tc.vulnerabilityType}</td>
                <td>
                  <span className={tc.expectedCondition === 'VULNERABLE' ? 'badge badge-danger' : 'badge badge-success'}>
                    {tc.expectedCondition}
                  </span>
                </td>
                <td>
                  <span className={tc.actualResult === 'DETECTED' ? 'badge badge-info' : 'badge badge-warning'}>
                    {tc.actualResult}
                  </span>
                </td>
                <td>
                  <span className={
                    tc.classification === 'TRUE_POSITIVE' ? 'badge badge-success' :
                    tc.classification === 'FALSE_POSITIVE' ? 'badge badge-warning' :
                    tc.classification === 'FALSE_NEGATIVE' ? 'badge badge-danger' : 'badge badge-info'
                  }>
                    {tc.classification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3. Cataloged Vulnerability Evidence</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Endpoint URL</th>
              <th>Parameter</th>
              <th>Severity</th>
              <th>Evidence Snippet</th>
            </tr>
          </thead>
          <tbody>
            {vulnerabilities.map((v) => (
              <tr key={v.id}>
                <td><span className="badge badge-warning">{v.vulnerabilityType}</span></td>
                <td><span className="code-inline">{v.endpointUrl}</span></td>
                <td><span className="code-inline">{v.parameter}</span></td>
                <td><span className="badge badge-danger">{v.severity}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
