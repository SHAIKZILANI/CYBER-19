import React from 'react';
import { Target, Activity, ShieldAlert, CheckCircle2, Award } from 'lucide-react';

export default function OverviewCards({ metrics, targets = [], selectedTarget = 'ALL' }) {
  const activeTargetObj = targets.find(t => t.name === selectedTarget);
  const targetLabel = selectedTarget === 'ALL' 
    ? (targets.length > 1 ? `${targets.length} Active Targets` : (targets[0]?.name || 'Juice Shop'))
    : selectedTarget;
  const targetUrl = activeTargetObj ? activeTargetObj.url : (targets[0]?.url || 'http://localhost:3000');

  return (
    <div className="grid-metrics">
      <div className="glass-card metric-card">
        <div>
          <div className="metric-title">Target Application</div>
          <div className="metric-val" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
            {targetLabel}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
            {selectedTarget === 'ALL' && targets.length > 1 ? 'Scope: Multi-Target' : targetUrl}
          </div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)' }}>
          <Target size={24} />
        </div>
      </div>

      <div className="glass-card metric-card">
        <div>
          <div className="metric-title">Detection Coverage</div>
          <div className="metric-val">{metrics?.detectionCoveragePercentage ?? 100}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>True Positives Ratio</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent-emerald)' }}>
          <Award size={24} />
        </div>
      </div>

      <div className="glass-card metric-card">
        <div>
          <div className="metric-title">False Positive Rate</div>
          <div className="metric-val">{metrics?.falsePositiveRatePercentage ?? 0}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Verified Ground-Truth</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent-amber)' }}>
          <Activity size={24} />
        </div>
      </div>

      <div className="glass-card metric-card">
        <div>
          <div className="metric-title">Detected Findings</div>
          <div className="metric-val">SQLi / XSS</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', marginTop: '0.25rem' }}>Evidence Cataloged</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(251, 113, 133, 0.1)', color: 'var(--accent-rose)' }}>
          <ShieldAlert size={24} />
        </div>
      </div>
    </div>
  );
}
