import React, { useState } from 'react';
import { ShieldAlert, Play, Clock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function ScanHistory({ scans = [], vulnerabilities = [], targets = [], onTriggerScan }) {
  const [selectedScanId, setSelectedScanId] = useState('ALL');
  const [scanningTargetId, setScanningTargetId] = useState(targets[0]?.id || 1);
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    if (onTriggerScan) {
      onTriggerScan(scanningTargetId, () => {
        setIsScanning(false);
      });
    } else {
      setTimeout(() => setIsScanning(false), 2000);
    }
  };

  // Find target name for a scan
  const getTargetName = (targetId) => {
    const found = targets.find((t) => t.id === targetId);
    return found ? found.name : `Target #${targetId}`;
  };

  const filteredVulnerabilities = selectedScanId === 'ALL'
    ? vulnerabilities
    : vulnerabilities.filter((v) => v.scanId === Number(selectedScanId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Scan Runner Toolbar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} /> Automated Vulnerability Scanner:
          </span>
          <select
            value={scanningTargetId}
            onChange={(e) => setScanningTargetId(Number(e.target.value))}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.url})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleStartScan}
          disabled={isScanning}
          className="btn btn-primary"
          style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {isScanning ? (
            <>
              <Loader2 size={16} className="spin" /> Scanning Endpoints...
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" /> Run Scan on Selected Target
            </>
          )}
        </button>
      </div>

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left: Scan History Logs */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--accent-cyan)" /> Scan History Logs
            </h3>
            <button
              onClick={() => setSelectedScanId('ALL')}
              style={{
                fontSize: '0.75rem',
                background: selectedScanId === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: selectedScanId === 'ALL' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Show All Scans
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {scans.map((scan) => {
              const isSelected = selectedScanId === scan.id;
              const targetName = getTargetName(scan.targetId);
              return (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScanId(scan.id)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{scan.scanName}</span>
                    <span className="badge badge-success">{scan.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>
                    Target: <strong>{targetName}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Duration: {scan.executionTimeMs} ms | Findings: {scan.totalVulnerabilitiesFound || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detected Findings & Evidence */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="var(--accent-rose)" /> Detected Findings & Evidence
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {filteredVulnerabilities.length} findings
            </span>
          </div>

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
                {filteredVulnerabilities.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className={v.vulnerabilityType?.includes('SQL') ? 'badge badge-danger' : 'badge badge-warning'}>
                        {v.vulnerabilityType}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <span className="code-inline">{v.endpointUrl}</span>
                    </td>
                    <td><span className="code-inline">{v.parameter}</span></td>
                    <td>
                      <span className={v.severity === 'HIGH' ? 'badge badge-danger' : 'badge badge-warning'}>
                        {v.severity}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.evidence}</td>
                  </tr>
                ))}
                {filteredVulnerabilities.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No vulnerability findings recorded for this scan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
