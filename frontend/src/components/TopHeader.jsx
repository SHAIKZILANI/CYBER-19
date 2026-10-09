import React, { useState } from 'react';
import {
  Bell,
  HelpCircle,
  Shield,
  CheckCircle,
  Menu,
  ExternalLink,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function TopHeader({
  activeTab,
  onToggleMobileMenu,
  backendOnline = true,
  onNavigateTab
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Tab titles and breadcrumbs
  const tabMetadata = {
    dashboard: {
      title: 'Security Overview',
      breadcrumb: 'Dashboard / Platform Posture'
    },
    targets: {
      title: 'Authorized Target Applications',
      breadcrumb: 'Targets / Assessment Scope'
    },
    'new-scan': {
      title: 'Start Security Assessment',
      breadcrumb: 'Scans / Configure New Audit'
    },
    history: {
      title: 'Scan Audit History',
      breadcrumb: 'Assessments / Historical Execution Logs'
    },
    findings: {
      title: 'Vulnerability Findings',
      breadcrumb: 'Telemetry / Detected Issues & Evidence'
    },
    metrics: {
      title: 'Evaluation Metrics',
      breadcrumb: 'Research Analytics / Benchmark Matrix'
    },
    reports: {
      title: 'Research Reports',
      breadcrumb: 'Documentation / Formal Audit Dossiers'
    },
    'assessment-report': {
      title: 'Security Assessment Report',
      breadcrumb: 'Assessments / Technical Security Dossier'
    },
    settings: {
      title: 'Platform Settings',
      breadcrumb: 'Configuration / Scanner & API Preferences'
    }
  };

  const currentMeta = tabMetadata[activeTab] || {
    title: 'Security Dashboard',
    breadcrumb: 'CYBER-19 / Platform'
  };

  const notifications = [
    {
      id: 1,
      title: 'Empirical Benchmark Verified',
      desc: 'Ground-truth test suite executed against live OWASP Juice Shop lab.',
      time: '10m ago',
      type: 'success'
    },
    {
      id: 2,
      title: 'Authorized Scope Confirmed',
      desc: 'Strict non-destructive policy active across all target assessments.',
      time: '1h ago',
      type: 'info'
    },
    {
      id: 3,
      title: 'Backend Synchronized',
      desc: 'Spring Boot REST service active on port 8081.',
      time: '2h ago',
      type: 'info'
    }
  ];

  return (
    <header className="top-header">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleMobileMenu}
          className="btn btn-secondary no-print"
          style={{ padding: '0.4rem', display: 'none' }}
          id="mobileMenuBtn"
          title="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {currentMeta.title}
            </h2>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
            {currentMeta.breadcrumb}
          </div>
        </div>
      </div>

      {/* Right: Telemetry & Utility Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
        {/* Backend Status Indicator */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '0.3rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <span>Backend:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
            <span className={`status-dot ${backendOnline ? 'green' : 'amber'}`} />
            {backendOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Notifications Icon with Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: showNotifications ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-medium)',
              color: showNotifications ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            title="System Notifications"
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-cyan)',
                boxShadow: '0 0 6px var(--accent-cyan)'
              }}
            />
          </button>

          {showNotifications && (
            <div
              className="cyber-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '320px',
                zIndex: 200,
                padding: '1rem',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>System Notifications</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.65rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong style={{ color: n.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                        {n.title}
                      </strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{n.time}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.3' }}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Documentation / Help Icon */}
        <button
          onClick={() => setShowHelpModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
          title="Platform Guidance & Ethics Documentation"
        >
          <HelpCircle size={17} />
        </button>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Shield size={22} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CYBER-19 Assessment Platform Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.3rem' }}>1. Non-Destructive Audit Policy</strong>
                CYBER-19 is engineered strictly for authorized web security audits. It inspects HTTP headers, evaluates SSL/TLS cipher strength, probes reflected inputs using benign markers, and tests SQL tautologies without executing data alteration, denial of service, or credential brute-forcing.
              </div>

              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.3rem' }}>2. Benchmark Ground Truth</strong>
                The platform includes an empirical verification engine that tests live application endpoints to compute true detection coverage, false positive resilience, and precision against OWASP standards.
              </div>

              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.3rem' }}>3. Target Scope Verification</strong>
                All target URLs added must belong to internal development labs, staging servers, or authorized practice environments with explicit permission.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="btn btn-primary"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
