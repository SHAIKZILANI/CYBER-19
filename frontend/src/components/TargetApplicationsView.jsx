import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Play,
  Filter
} from 'lucide-react';
import TargetSecurityCard from './TargetSecurityCard';

const PRESET_LABS = [
  { name: 'OWASP Juice Shop', url: 'http://localhost:3000', env: 'LOCAL_NODE' },
  { name: 'Google Gruyere Lab', url: 'https://google-gruyere.appspot.com', env: 'AUTHORIZED_LAB' },
  { name: 'Acunetix Practice Lab', url: 'http://testphp.vulnweb.com', env: 'AUTHORIZED_LAB' },
  { name: 'Altoro Mutual Testbed', url: 'http://demo.testfire.net', env: 'AUTHORIZED_LAB' }
];

export default function TargetApplicationsView({
  targets = [],
  scans = [],
  vulnerabilities = [],
  testCases = [],
  onAddTarget,
  onTriggerScan,
  onNavigateTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTargetDetails, setSelectedTargetDetails] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState('LOCAL_NODE');
  const [authorizedConsent, setAuthorizedConsent] = useState(false);
  const [formError, setFormError] = useState('');

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
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a descriptive Target Name.');
      return;
    }

    if (!url.trim() || !isValidUrl(url.trim())) {
      setFormError('Invalid URL. Must begin with http:// or https:// (e.g. http://localhost:3000).');
      return;
    }

    if (!authorizedConsent) {
      setFormError('Please check the authorization box confirming you have explicit permission to test this target.');
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
    setShowAddModal(false);
  };

  // Filtered Targets
  const filteredTargets = targets.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnv = envFilter === 'ALL' || t.environment === envFilter;
    return matchesSearch && matchesEnv;
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Search Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Authorized Targets
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Manage intentionally vulnerable lab environments and verified targets for non-destructive security assessment.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <Plus size={18} /> Add Authorized Target
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="cyber-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.85rem 1.25rem'
        }}
      >
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search targets by name or endpoint URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              width: '100%'
            }}
          />
        </div>

        {/* Environment Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="form-select"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <option value="ALL">All Environments</option>
            <option value="LOCAL_NODE">Local Labs (Docker / Node)</option>
            <option value="AUTHORIZED_LAB">Authorized Practice Labs</option>
            <option value="STAGING_SERVER">Staging Servers</option>
          </select>
          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
            {filteredTargets.length} Targets
          </span>
        </div>
      </div>

      {/* Target Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredTargets.map((target) => (
          <TargetSecurityCard
            key={target.id || target.name}
            target={target}
            scans={scans}
            vulnerabilities={vulnerabilities}
            testCases={testCases}
            onStartScan={onTriggerScan}
            onViewDetails={(t) => setSelectedTargetDetails(t)}
          />
        ))}

        {filteredTargets.length === 0 && (
          <div
            className="cyber-card"
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <ShieldAlert size={36} color="var(--text-muted)" />
            <h4 style={{ fontSize: '1.1rem', color: '#ffffff' }}>No matching authorized targets found</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px' }}>
              No target applications match your current search criteria. Add a new authorized lab or adjust your filters.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              <Plus size={16} /> Add Target
            </button>
          </div>
        )}
      </div>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Configure Authorized Target</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Ethical Safety Notice */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}
            >
              <strong style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <ShieldCheck size={14} /> Strict Non-Destructive Audit Mandate
              </strong>
              Only scan systems you own or have explicit authorization to test. All assessments remain passive and non-destructive.
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={12} color="var(--accent-cyan)" /> Quick-Fill Authorized Practice Labs:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {PRESET_LABS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-medium)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Target Name</label>
                <input
                  type="text"
                  placeholder="e.g. Staging Customer API or Internal Lab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Website URL</label>
                <input
                  type="text"
                  placeholder="http://localhost:3000 or https://authorized-lab.internal"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Environment Classification</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="form-select"
                >
                  <option value="LOCAL_NODE">LOCAL LAB (Local Node / Docker Testbed)</option>
                  <option value="AUTHORIZED_LAB">AUTHORIZED LAB (Cybersecurity Practice Lab)</option>
                  <option value="STAGING_SERVER">STAGING SERVER (Internal Staging)</option>
                  <option value="EXTERNAL_AUTHORIZED">EXTERNAL AUTHORIZED (Explicitly Permitted)</option>
                </select>
              </div>

              {/* Ethics Confirmation Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="authConsentModal"
                  checked={authorizedConsent}
                  onChange={(e) => setAuthorizedConsent(e.target.checked)}
                  style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                />
                <label htmlFor="authConsentModal" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: '1.4' }}>
                  I confirm that I own this target or have <strong>explicit authorization</strong> to audit it, and all security assessments will remain strictly <strong>non-destructive</strong>.
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!authorizedConsent || !name || !url}
                  className="btn btn-primary"
                  style={{ opacity: (!authorizedConsent || !name || !url) ? 0.6 : 1 }}
                >
                  <Plus size={16} /> Register Authorized Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Details Modal */}
      {selectedTargetDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={22} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedTargetDetails.name}</h3>
              </div>
              <button
                onClick={() => setSelectedTargetDetails(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>ENDPOINT URL</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  <a href={selectedTargetDetails.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    {selectedTargetDetails.url} <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(7, 11, 20, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ENVIRONMENT</div>
                  <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>{selectedTargetDetails.environment || 'LOCAL LAB'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>STATUS</div>
                  <div style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '0.2rem' }}>✓ AUTHORIZED SCOPE</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>SCAN AUDIT HISTORY</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {scans.filter(s => s.targetId === selectedTargetDetails.id).map(scan => (
                    <div key={scan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontWeight: 500 }}>{scan.scanName}</span>
                      <span className="badge badge-success">{scan.status}</span>
                    </div>
                  ))}
                  {scans.filter(s => s.targetId === selectedTargetDetails.id).length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      No scans executed yet. Click "Start Scan" to run non-destructive audit.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setSelectedTargetDetails(null);
                    if (onNavigateTab) onNavigateTab('metrics');
                  }}
                  className="btn btn-secondary"
                >
                  View Benchmark
                </button>
                <button
                  onClick={() => {
                    if (onTriggerScan) onTriggerScan(selectedTargetDetails.id);
                    setSelectedTargetDetails(null);
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
