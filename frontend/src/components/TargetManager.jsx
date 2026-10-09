import React, { useState } from 'react';
import { Plus, CheckCircle, ExternalLink, Shield, ShieldCheck, AlertCircle, Sparkles, Check, LayoutGrid, List, X, Play } from 'lucide-react';
import TargetSecurityCard from './TargetSecurityCard';

const PRESET_LABS = [
  { name: 'OWASP Juice Shop', url: 'http://localhost:3000', env: 'LOCAL_NODE' },
  { name: 'Acunetix Practice Lab', url: 'http://testphp.vulnweb.com', env: 'AUTHORIZED_LAB' },
  { name: 'Altoro Mutual Testbed', url: 'http://demo.testfire.net', env: 'AUTHORIZED_LAB' },
  { name: 'Google Gruyere Lab', url: 'https://google-gruyere.appspot.com', env: 'AUTHORIZED_LAB' }
];

export default function TargetManager({
  targets = [],
  scans = [],
  vulnerabilities = [],
  testCases = [],
  onAddTarget,
  onTriggerScan,
  onNavigateTab
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState('LOCAL_NODE');
  const [authorizedConsent, setAuthorizedConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [selectedDetailsTarget, setSelectedDetailsTarget] = useState(null);

  const isValidUrl = (testUrl) => {
    try {
      const parsed = new URL(testUrl);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setUrl(preset.url);
    setEnvironment(preset.env);
    setAuthorizedConsent(true);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please provide a descriptive Target Name.');
      return;
    }

    if (!url.trim() || !isValidUrl(url.trim())) {
      setErrorMsg('Invalid URL. Must begin with http:// or https:// (e.g. http://localhost:3000 or https://example-lab.com).');
      return;
    }

    if (!authorizedConsent) {
      setErrorMsg('Please check the authorization box confirming you have explicit permission to audit this target.');
      return;
    }

    onAddTarget({
      name: name.trim(),
      url: url.trim(),
      environment,
      status: 'AUTHORIZED'
    });

    setName('');
    setUrl('');
    setAuthorizedConsent(false);
    setErrorMsg('');
  };

  const urlValid = url.length > 0 && isValidUrl(url);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.95fr', gap: '1.5rem' }}>
      {/* Left Column: Target Configuration Form */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color="var(--accent-cyan)" /> Configure Authorized Target
        </h3>

        {/* Ethical Safety Notice */}
        <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <ShieldCheck size={14} /> Non-Destructive Audit Policy
          </strong>
          Only authorized lab environments or targets with explicit permission are evaluated using passive, non-exploitative security checks (headers, SSL/TLS, configuration).
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={12} color="var(--accent-cyan)" /> Quick-Fill Authorized Practice Labs:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESET_LABS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(251, 113, 133, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Target Name</label>
            <input
              type="text"
              placeholder="e.g. Staging Customer API or Lab Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Website URL</label>
              {url.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: urlValid ? 'var(--accent-emerald)' : 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {urlValid ? <Check size={12} /> : <AlertCircle size={12} />}
                  {urlValid ? 'Valid URL' : 'Must start with http:// or https://'}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="https://example-lab.internal or http://localhost:3000"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.4)',
                border: urlValid ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="LOCAL_NODE">LOCAL LAB (Local Testbed)</option>
              <option value="AUTHORIZED_LAB">AUTHORIZED LAB (Cybersecurity Practice Lab)</option>
              <option value="STAGING_SERVER">STAGING SERVER (Internal Staging)</option>
              <option value="EXTERNAL_AUTHORIZED">EXTERNAL AUTHORIZED (Explicitly Permitted)</option>
            </select>
          </div>

          {/* Explicit Authorization Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="authConsent"
              checked={authorizedConsent}
              onChange={(e) => setAuthorizedConsent(e.target.checked)}
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="authConsent" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: '1.4' }}>
              I confirm that I own this target or have <strong>explicit authorized permission</strong> to audit it, and that all assessments will remain strictly <strong>non-destructive</strong>.
            </label>
          </div>

          <button
            type="submit"
            disabled={!authorizedConsent || !name || !urlValid}
            className="btn btn-primary"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              justifyContent: 'center',
              opacity: (!authorizedConsent || !name || !urlValid) ? 0.6 : 1,
              cursor: (!authorizedConsent || !name || !urlValid) ? 'not-allowed' : 'pointer'
            }}
          >
            <Plus size={16} /> Validate & Register Target
          </button>
        </form>
      </div>

      {/* Right Column: Registered Targets (Cards View matching ASCII mockup) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* View Mode Toolbar */}
        <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Authorized Target Applications</h3>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              {targets.length} Active
            </span>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '4px',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--accent-cyan)' : 'transparent',
                color: viewMode === 'cards' ? '#000' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={13} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '4px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-cyan)' : 'transparent',
                color: viewMode === 'table' ? '#000' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <List size={13} /> Table
            </button>
          </div>
        </div>

        {/* View Mode: Cards Grid */}
        {viewMode === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
            {targets.map((t) => (
              <TargetSecurityCard
                key={t.id || t.name}
                target={t}
                scans={scans}
                vulnerabilities={vulnerabilities}
                testCases={testCases}
                onStartScan={onTriggerScan}
                onViewDetails={(target) => setSelectedDetailsTarget(target)}
              />
            ))}
          </div>
        )}

        {/* View Mode: Traditional Table */}
        {viewMode === 'table' && (
          <div className="glass-card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Target Name</th>
                    <th>Target URL</th>
                    <th>Environment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t, idx) => (
                    <tr key={t.id || idx}>
                      <td>#{t.id || idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td>
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {t.url} <ExternalLink size={12} />
                        </a>
                      </td>
                      <td><span className="code-inline">{t.environment}</span></td>
                      <td>
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> {t.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => onTriggerScan && onTriggerScan(t.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <Play size={11} /> Scan
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

      {/* Target Details Modal */}
      {selectedDetailsTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
        >
          <div className="glass-card" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedDetailsTarget.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDetailsTarget(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ENDPOINT URL</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{selectedDetailsTarget.url}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ENVIRONMENT</div>
                  <div style={{ fontWeight: 600 }}>{selectedDetailsTarget.environment || 'LOCAL LAB'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AUTHORIZATION</div>
                  <div style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>✓ Verified Authorized Scope</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>SCAN AUDIT HISTORY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {scans.filter(s => s.targetId === selectedDetailsTarget.id).map(scan => (
                    <div key={scan.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span>{scan.scanName}</span>
                      <span className="badge badge-success">{scan.status}</span>
                    </div>
                  ))}
                  {scans.filter(s => s.targetId === selectedDetailsTarget.id).length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>No scans performed yet. Click "Start Scan" to run a non-destructive audit.</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setSelectedDetailsTarget(null);
                    if (onNavigateTab) onNavigateTab('metrics');
                  }}
                  className="btn btn-secondary"
                >
                  View in Evaluation Matrix
                </button>
                <button
                  onClick={() => {
                    if (onTriggerScan) onTriggerScan(selectedDetailsTarget.id);
                    setSelectedDetailsTarget(null);
                  }}
                  className="btn btn-primary"
                >
                  <Play size={14} fill="currentColor" /> Run Instant Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
