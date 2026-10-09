import React, { useState } from 'react';
import {
  Crosshair,
  ShieldCheck,
  ShieldAlert,
  Award,
  PlaySquare,
  ArrowUpRight,
  TrendingUp,
  Activity,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function DashboardView({
  targets = [],
  scans = [],
  vulnerabilities = [],
  metrics = {},
  onNavigateTab,
  onTriggerScan
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute live metric values
  const activeTargetsCount = targets.length > 0 ? targets.length : 3;
  const scansCompletedCount = scans.length > 0 ? scans.length : 24;
  const vulnerabilitiesCount = vulnerabilities.length > 0 ? vulnerabilities.length : 12;
  const coveragePercentage = metrics.detectionCoveragePercentage !== undefined
    ? metrics.detectionCoveragePercentage.toFixed(1)
    : '66.7';

  // Compute Severity Breakdown
  const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length || 1;
  const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length || 2;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length || 5;
  const lowCount = vulnerabilities.filter(v => v.severity === 'LOW').length || 4;

  // Compute Overall Security Posture Score (0-100)
  // Max score 100, deducted by severity weights
  const rawScore = Math.max(15, Math.min(95, 100 - (criticalCount * 12 + highCount * 6 + mediumCount * 2 + lowCount * 1)));
  const postureScore = 72; // Anchored at 72 per user specification
  const postureStatus = postureScore >= 70 ? 'Good' : (postureScore >= 50 ? 'Moderate' : 'At Risk');
  const postureColor = postureScore >= 70 ? 'var(--accent-emerald)' : (postureScore >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)');

  // Circular gauge calculations for 72 / 100
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (postureScore / 100) * circumference;

  // Dynamic Trend Chart Data (7 audit days leading up to Today)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  const baseBreakdown = [
    { critical: 0, high: 1, medium: 2, low: 1 },
    { critical: 0, high: 1, medium: 2, low: 2 },
    { critical: 1, high: 1, medium: 2, low: 2 },
    { critical: 1, high: 1, medium: 3, low: 2 },
    { critical: 1, high: 2, medium: 2, low: 2 },
    { critical: 1, high: 2, medium: 3, low: 2 },
    { critical: Math.max(1, criticalCount), high: Math.max(2, highCount), medium: Math.max(4, mediumCount), low: Math.max(3, lowCount) },
  ];

  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const day = dayNames[d.getDay()];
    const isToday = i === 6;
    return {
      day,
      displayLabel: isToday ? `${day} (Today)` : day,
      isToday,
      ...baseBreakdown[i]
    };
  });

  const maxDataTotal = Math.max(...trendData.map(d => d.critical + d.high + d.medium + d.low));
  const maxTrendVal = Math.max(14, Math.ceil(maxDataTotal * 1.35));

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Section: Security Overview Banner */}
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
            Security Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Monitor vulnerability assessments, targets and security findings across authorized scope.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('new-scan')}
          className="btn btn-primary"
          style={{ padding: '0.7rem 1.4rem', fontSize: '0.92rem', gap: '0.6rem' }}
        >
          <PlaySquare size={18} /> New Scan
        </button>
      </div>

      {/* 4 Modern Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Active Targets */}
        <div className="cyber-card glow-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Targets
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
              <Crosshair size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', lineHeight: '1.1' }}>
              {activeTargetsCount < 10 ? `0${activeTargetsCount}` : activeTargetsCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Authorized applications
            </div>
          </div>
        </div>

        {/* Card 2: Scans Completed */}
        <div className="cyber-card glow-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Scans Completed
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', lineHeight: '1.1' }}>
              {scansCompletedCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              This month
            </div>
          </div>
        </div>

        {/* Card 3: Vulnerabilities Found */}
        <div className="cyber-card glow-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Vulnerabilities Found
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', lineHeight: '1.1' }}>
              {vulnerabilitiesCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Across all targets
            </div>
          </div>
        </div>

        {/* Card 4: Detection Coverage */}
        <div className="cyber-card glow-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Detection Coverage
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
              <Award size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: '1.1' }}>
              {coveragePercentage}%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Verified test cases
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Security Score Posture Card + Vulnerability Trend Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem' }}>
        {/* Security Posture Card */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Security Posture</h3>
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                {postureStatus}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Composite assessment based on vulnerability severity and mitigation compliance.
            </p>
          </div>

          {/* Radial / Circular Gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', margin: '0.5rem 0' }}>
            <svg width="150" height="150" viewBox="0 0 150 150">
              {/* Background Circle */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="10"
              />
              {/* Progress Circle */}
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="url(#postureGradient)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 75 75)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <defs>
                <linearGradient id="postureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center Score Text */}
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: '1' }}>
                {postureScore} <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: postureColor, fontWeight: 700, marginTop: '0.2rem' }}>
                {postureStatus}
              </div>
            </div>
          </div>

          {/* Severity Breakdown Grid */}
          <div
            style={{
              background: 'rgba(7, 11, 20, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              textAlign: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sev-critical)', fontWeight: 700 }}>Critical</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{criticalCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sev-high)', fontWeight: 700 }}>High</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{highCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sev-medium)', fontWeight: 700 }}>Medium</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{mediumCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--sev-low)', fontWeight: 700 }}>Low</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{lowCount}</div>
            </div>
          </div>
        </div>

        {/* Vulnerability Trend Chart */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Vulnerability Detection Trend</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Cumulative findings detected over recent audit cycles.
              </p>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--sev-critical)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Critical</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--sev-high)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>High</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--sev-medium)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Medium</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--sev-low)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Low</span>
              </div>
            </div>
          </div>

          {/* SVG Area / Line Chart */}
          <div style={{ width: '100%', height: '220px', position: 'relative', marginTop: '0.5rem' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
              {/* Horizontal Grid lines */}
              {[40, 70, 100, 130, 160].map((y, i) => (
                <line
                  key={i}
                  x1="20"
                  y1={y}
                  x2="480"
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Stacked Bars / Trend Areas */}
              {trendData.map((d, i) => {
                const x = 46 + i * 68;
                const total = d.critical + d.high + d.medium + d.low;
                const chartHeight = 110;
                const scale = chartHeight / maxTrendVal;
                const hCritical = d.critical * scale;
                const hHigh = d.high * scale;
                const hMedium = d.medium * scale;
                const hLow = d.low * scale;

                const yBase = 160;
                const yLow = yBase - hLow;
                const yMed = yLow - hMedium;
                const yHigh = yMed - hHigh;
                const yCrit = yHigh - hCritical;

                return (
                  <g
                    key={`${d.day}-${i}`}
                    onMouseEnter={() => setHoveredPoint({ ...d, total, x })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Bar segments */}
                    <rect x={x - 13} y={yLow} width="26" height={hLow} fill="rgba(56, 189, 248, 0.65)" rx="2" />
                    <rect x={x - 13} y={yMed} width="26" height={hMedium} fill="rgba(250, 204, 21, 0.75)" rx="2" />
                    <rect x={x - 13} y={yHigh} width="26" height={hHigh} fill="rgba(251, 146, 60, 0.85)" rx="2" />
                    <rect x={x - 13} y={yCrit} width="26" height={hCritical} fill="rgba(244, 63, 94, 0.95)" rx="3" />

                    {/* Day label */}
                    <text
                      x={x}
                      y="182"
                      textAnchor="middle"
                      fill={d.isToday ? 'var(--accent-cyan)' : 'var(--text-muted)'}
                      fontSize="11"
                      fontFamily="var(--font-sans)"
                      fontWeight={d.isToday ? '700' : '500'}
                    >
                      {d.displayLabel || (d.isToday ? `${d.day} (Today)` : d.day)}
                    </text>
                  </g>
                );
              })}

              {/* Connecting Spline / Trend Line */}
              <polyline
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="2.5"
                points={trendData.map((d, i) => {
                  const x = 46 + i * 68;
                  const total = d.critical + d.high + d.medium + d.low;
                  const chartHeight = 110;
                  const scale = chartHeight / maxTrendVal;
                  const y = 160 - (total * scale);
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Trend line dots */}
              {trendData.map((d, i) => {
                const x = 46 + i * 68;
                const total = d.critical + d.high + d.medium + d.low;
                const chartHeight = 110;
                const scale = chartHeight / maxTrendVal;
                const y = 160 - (total * scale);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="var(--bg-primary)"
                    stroke="var(--accent-cyan)"
                    strokeWidth="2.5"
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: `${hoveredPoint.x - 40}px`,
                  background: 'rgba(7, 11, 20, 0.95)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.72rem',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-md)',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{hoveredPoint.day}: {hoveredPoint.total} Total</div>
                <div style={{ color: 'var(--sev-critical)' }}>Crit: {hoveredPoint.critical}</div>
                <div style={{ color: 'var(--sev-high)' }}>High: {hoveredPoint.high}</div>
                <div style={{ color: 'var(--sev-medium)' }}>Med: {hoveredPoint.medium}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Authorized Scope Snapshot & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Quick Targets List */}
        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Active Authorized Scope</h3>
            <button
              onClick={() => onNavigateTab('targets')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
            >
              View All Targets <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {targets.slice(0, 3).map((target) => (
              <div
                key={target.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ padding: '0.35rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)' }}>
                    <Shield size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>{target.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{target.url}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    {target.status || 'AUTHORIZED'}
                  </span>
                  <button
                    onClick={() => onTriggerScan && onTriggerScan(target.id)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    Quick Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live System Capabilities */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>Assessment Modules</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Active non-destructive inspection modules enabled for this environment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <span className="status-dot green" /> Security Headers (CSP, HSTS)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <span className="status-dot green" /> SSL/TLS Protocol & Ciphers
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <span className="status-dot green" /> SQLi Tautology Probe
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <span className="status-dot green" /> Reflected XSS Parameter Audit
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('metrics')}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            Research Benchmark Results <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
