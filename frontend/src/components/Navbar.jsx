import React from 'react';
import { ShieldCheck, Server, Cpu } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'targets', label: 'Target Applications' },
    { id: 'metrics', label: 'Evaluation Metrics' },
    { id: 'history', label: 'Scan History & Findings' },
    { id: 'reports', label: 'Research Reports' },
  ];

  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(10, 13, 20, 0.95)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CYBER-19 PLATFORM
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated Web Vulnerability Assessment Platform</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-success">
            <Server size={12} /> Target: OWASP Juice Shop (3000)
          </span>
          <span className="badge badge-info">
            <Cpu size={12} /> Backend: Active (8081)
          </span>
        </div>
      </div>
    </header>
  );
}
