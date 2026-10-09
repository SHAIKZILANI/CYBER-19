import React, { useState, useEffect } from 'react';
import {
  Shield,
  PlaySquare,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Square,
  Zap,
  Globe,
  Lock,
  Server,
  FileText,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function NewScanView({
  targets = [],
  scans = [],
  onStartLiveScan,
  onNavigateTab,
  onSelectScanId
}) {
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000');
  const [targetName, setTargetName] = useState('OWASP Juice Shop');
  const [runZap, setRunZap] = useState(true);
  const [useAuth, setUseAuth] = useState(false);
  const [authUsername, setAuthUsername] = useState('admin@juice-sh.op');
  const [authPassword, setAuthPassword] = useState('admin123');

  // Pre-flight validation state
  const [validating, setValidating] = useState(false);
  const [validationState, setValidationState] = useState({
    checked: true,
    valid: true,
    authorized: true,
    reachable: true,
    message: 'Target is authorized (127.0.0.1 loopback scope)'
  });

  const labPresets = [
    {
      id: 'juice-shop',
      name: 'OWASP Juice Shop',
      url: 'http://localhost:3000',
      port: '3000',
      type: 'Single-Page Node.js / Angular',
      auth: { user: 'admin@juice-sh.op', pass: 'admin123' }
    },
    {
      id: 'webgoat',
      name: 'OWASP WebGoat',
      url: 'http://localhost:8084/WebGoat',
      port: '8084',
      type: 'Enterprise Java / Spring Boot',
      auth: { user: 'webgoat', pass: 'webgoat123' }
    },
    {
      id: 'dvwa',
      name: 'DVWA (Damn Vulnerable Web App)',
      url: 'http://localhost:8082',
      port: '8082',
      type: 'Classic PHP / MySQL LAMP',
      auth: { user: 'admin', pass: 'password' }
    }
  ];

  // Pre-flight check when URL changes
  useEffect(() => {
    if (!targetUrl.trim()) {
      setValidationState({ checked: false, valid: false, authorized: false, reachable: false, message: '' });
      return;
    }

    const timer = setTimeout(() => {
      validateUrl(targetUrl);
    }, 450);

    return () => clearTimeout(timer);
  }, [targetUrl]);

  const validateUrl = (urlToValidate) => {
    setValidating(true);
    fetch('/api/targets/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlToValidate })
    })
      .then(res => res.json())
      .then(data => {
        setValidating(false);
        setValidationState({
          checked: true,
          valid: data.valid !== false,
          authorized: data.authorized !== false,
          reachable: data.reachable !== false,
          message: data.message || (data.authorized ? 'Target is online and authorized' : data.error)
        });
      })
      .catch(() => {
        setValidating(false);
        // Fallback client check
        const isLocal = urlToValidate.includes('localhost') || urlToValidate.includes('127.0.0.1') || urlToValidate.includes('host.docker.internal');
        setValidationState({
          checked: true,
          valid: true,
          authorized: isLocal,
          reachable: true,
          message: isLocal ? 'Local laboratory target' : 'Target is outside the authorized scan scope'
        });
      });
  };

  const handleSelectPreset = (preset) => {
    setTargetUrl(preset.url);
    setTargetName(preset.name);
    setAuthUsername(preset.auth.user);
    setAuthPassword(preset.auth.pass);
  };

  const handleLaunchScan = (e) => {
    e.preventDefault();
    if (!validationState.authorized) {
      alert('Cannot launch scan: Target is outside the authorized scan scope (must be 127.0.0.1 / localhost).');
      return;
    }

    if (onStartLiveScan) {
      onStartLiveScan({
        targetUrl: targetUrl.trim(),
        targetName: targetName.trim(),
        runZap,
        authenticated: useAuth,
        username: authUsername,
        password: authPassword
      });
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Launch Real-Time Security Assessment
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '640px', margin: '0 auto' }}>
          Enter a local target URL or select an authorized laboratory testbed to initiate attack surface discovery, real vulnerability detection, and OWASP ZAP benchmarking.
        </p>
      </div>

      {/* Main Scan Configuration Form */}
      <div className="cyber-card" style={{ padding: '2.25rem', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
            <PlaySquare size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Target Website</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Authorized Local Vulnerability Laboratory</div>
          </div>
        </div>

        <form onSubmit={handleLaunchScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Target URL Input */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Target URL</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Example: <code>http://localhost:3000</code></span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  const foundPreset = labPresets.find(p => p.url === e.target.value.trim());
                  if (foundPreset) setTargetName(foundPreset.name);
                }}
                placeholder="http://localhost:3000"
                className="form-input"
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.92rem',
                  padding: '0.8rem 1rem',
                  color: 'var(--accent-cyan)',
                  borderColor: !validationState.authorized ? 'var(--accent-rose)' : 'var(--border-color)'
                }}
                required
              />

              {validating && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Loader2 size={15} className="spin" /> Checking...
                </div>
              )}
            </div>

            {/* Validation Feedback Badge */}
            {validationState.checked && !validating && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
                {validationState.authorized && validationState.reachable ? (
                  <span style={{ color: '#86efac', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={14} /> {validationState.message}
                  </span>
                ) : !validationState.authorized ? (
                  <span style={{ color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={14} /> {validationState.message || 'Target is outside the authorized scan scope'}
                  </span>
                ) : (
                  <span style={{ color: '#fde047', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} /> {validationState.message || 'Target is not reachable'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Predefined Laboratory Targets */}
          <div>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
              Predefined Laboratory Targets (Quick Select)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {labPresets.map(preset => {
                const isSelected = targetUrl.trim() === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : '#ffffff', fontSize: '0.88rem' }}>
                        {preset.name}
                      </span>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Port {preset.port}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {preset.url}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assessment Modules Options */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>Active Scanner Engines</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'default' }}
              >
                <div style={{ color: 'var(--accent-cyan)', marginTop: '2px' }}><CheckSquare size={18} /></div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>CYBER-19 Core Engine</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active SQLi, XSS, DOM XSS, and passive security headers</div>
                </div>
              </div>

              <div
                onClick={() => setRunZap(prev => !prev)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}
              >
                <div style={{ color: runZap ? 'var(--accent-purple)' : 'var(--text-muted)', marginTop: '2px' }}>
                  {runZap ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>OWASP ZAP 2.17.0 Comparative Sweep</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Benchmark against independent container daemon on port 8080</div>
                </div>
              </div>
            </div>

            {/* Authenticated Scanning Toggle */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <div
                onClick={() => setUseAuth(prev => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginBottom: useAuth ? '0.75rem' : 0 }}
              >
                <div style={{ color: useAuth ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {useAuth ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>
                  Authenticated Scan Context (Protected Routes: /rest/basket, /rest/wallet, /profile)
                </div>
              </div>

              {useAuth && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingLeft: '1.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Username / Email</label>
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Launch Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={13} color="var(--accent-cyan)" />
              Authorized testing scope: strictly 127.0.0.1 / localhost loopback
            </div>

            <button
              type="submit"
              disabled={validating || !validationState.authorized}
              className="btn btn-primary"
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                padding: '0.85rem 2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
                opacity: (!validationState.authorized) ? 0.6 : 1,
                cursor: (!validationState.authorized) ? 'not-allowed' : 'pointer'
              }}
            >
              <PlaySquare size={20} /> Start Security Scan
            </button>
          </div>
        </form>
      </div>

      {/* Recent Laboratory Scans */}
      {scans.length > 0 && (
        <div className="cyber-card" style={{ padding: '1.75rem', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Clock size={18} /> Recent Laboratory Scans ({scans.length})
            </h3>
            <button
              onClick={() => onNavigateTab && onNavigateTab('history')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              View Full History <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
                  <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Scan Name</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '0.6rem 0.8rem' }}>Findings</th>
                  <th style={{ textAlign: 'center', padding: '0.6rem 0.8rem' }}>Duration</th>
                  <th style={{ textAlign: 'right', padding: '0.6rem 0.8rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {scans.slice(-5).reverse().map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      #{s.id} {s.scanName}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span className={s.status === 'COMPLETED' ? 'badge badge-success' : 'badge badge-warning'}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.6rem 0.8rem', fontWeight: 700, color: (s.totalVulnerabilitiesFound || 0) > 0 ? '#fca5a5' : '#86efac' }}>
                      {s.totalVulnerabilitiesFound || 0}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.6rem 0.8rem', color: 'var(--text-muted)' }}>
                      {s.executionTimeMs ? `${Math.round(s.executionTimeMs / 1000)}s` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.6rem 0.8rem' }}>
                      <button
                        onClick={() => {
                          if (onSelectScanId) onSelectScanId(s.id);
                          if (onNavigateTab) onNavigateTab('assessment-report');
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <FileText size={12} /> View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
