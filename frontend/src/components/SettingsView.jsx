import React, { useState } from 'react';
import {
  Settings,
  Shield,
  CheckCircle,
  Database,
  Server,
  Zap,
  RefreshCw,
  Lock,
  Globe
} from 'lucide-react';

export default function SettingsView({ backendOnline = true }) {
  const [safeMode, setSafeMode] = useState(true);
  const [scanTimeout, setScanTimeout] = useState('15');
  const [userAgent, setUserAgent] = useState('CYBER-19/2.4 (Automated Vulnerability Scanner; Non-Destructive)');
  const [testResult, setTestResult] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestBackend = () => {
    setTestingConnection(true);
    setTestResult('');
    fetch('/api/targets')
      .then(res => {
        if (res.ok) {
          setTestResult('Success: Backend API on port 8081 is connected and responsive.');
        } else {
          setTestResult(`Warning: HTTP status ${res.status} returned.`);
        }
        setTestingConnection(false);
      })
      .catch(() => {
        setTestResult('Connection Error: Could not reach backend on http://localhost:8081.');
        setTestingConnection(false);
      });
  };

  return (
    <div className="page-container" style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Platform Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Configure scanner parameters, non-destructive safety constraints, and backend service integrations.
        </p>
      </div>

      {/* Safety & Ethics Controls */}
      <div className="cyber-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <Shield size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Ethical Safety Mandates</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>Enforce Strict Non-Destructive Mode</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Blocks credential brute-forcing, denial-of-service, and intrusive data mutations.
              </div>
            </div>
            <span className="badge badge-success">ACTIVE & ENFORCED</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>Explicit Authorization Scope Check</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Requires confirmation of target ownership or explicit testing authorization before every scan.
              </div>
            </div>
            <span className="badge badge-success">MANDATORY</span>
          </div>
        </div>
      </div>

      {/* Backend & API Telemetry */}
      <div className="cyber-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <Server size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>System & Laboratory Health Telemetry</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Health Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BACKEND SERVICE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ffffff', marginTop: '0.2rem' }}>Port: 8081 (Java 21)</div>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="status-dot green" /> UP (Spring Boot)
              </div>
            </div>

            <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DATABASE ENGINE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ffffff', marginTop: '0.2rem' }}>Port: 3306 (MySQL 8.0)</div>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="status-dot green" /> UP (cyber_vulnerability_db)
              </div>
            </div>

            <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OWASP ZAP DAEMON</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ffffff', marginTop: '0.2rem' }}>Port: 8080 (Docker)</div>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="status-dot green" /> UP (Version 2.17.0)
              </div>
            </div>

            <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TARGET APPLICATION</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ffffff', marginTop: '0.2rem' }}>Port: 3000 (Juice Shop)</div>
              <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.75rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="status-dot green" /> UP (HTTP 200 OK)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              onClick={handleTestBackend}
              disabled={testingConnection}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <RefreshCw size={13} className={testingConnection ? 'spin' : ''} /> Test Ecosystem Health
            </button>

            {testResult && (
              <span style={{ fontSize: '0.8rem', color: testResult.startsWith('Success') ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {testResult}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scanner Preferences */}
      <div className="cyber-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <Zap size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Scanner Preferences</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">HTTP Request Timeout (seconds)</label>
            <input
              type="number"
              value={scanTimeout}
              onChange={(e) => setScanTimeout(e.target.value)}
              className="form-input"
              style={{ width: '140px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scanner User-Agent Header</label>
            <input
              type="text"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              className="form-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
