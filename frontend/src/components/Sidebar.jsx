import React from 'react';
import {
  LayoutDashboard,
  Crosshair,
  PlaySquare,
  Clock,
  ShieldAlert,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
  Award,
  Globe
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  backendOnline = true,
  onLogout
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'targets', label: 'Target Applications', icon: Crosshair },
    { id: 'scan-url', label: 'Scan Website', icon: Globe, badge: 'NEW' },
    { id: 'new-scan', label: 'New Scan', icon: PlaySquare, badge: 'READY' },
    { id: 'history', label: 'Scan History', icon: Clock },
    { id: 'findings', label: 'Vulnerability Findings', icon: ShieldAlert },
    { id: 'metrics', label: 'Evaluation Metrics', icon: BarChart3 },
    { id: 'reports', label: 'Research Reports', icon: FileText },
    { id: 'assessment-report', label: 'Security Report', icon: Award, badge: 'PRO' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Top Brand / Logo */}
      <div
        style={{
          padding: isCollapsed ? '1.25rem 0.5rem' : '1.25rem 1.4rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
            }}
          >
            <ShieldCheck size={22} />
          </div>
          {!isCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                CYBER-19
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700
                  }}
                >
                  v2.4
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                Web Vulnerability Assessment
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px'
            }}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <button
            onClick={() => setIsCollapsed(false)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px'
            }}
            title="Expand Sidebar"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav style={{ padding: '0.85rem 0.65rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: '8px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0.03) 100%)'
                  : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                position: 'relative'
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                size={18}
                color={isActive ? 'var(--accent-cyan)' : 'currentColor'}
                style={{ flexShrink: 0 }}
              />
              {!isCollapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>
                  {item.label}
                </span>
              )}
              {!isCollapsed && item.badge && (
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: 'var(--accent-emerald)',
                    fontWeight: 700
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: System Status & User Profile */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.85rem 0.75rem' }}>
        {/* System Status */}
        {!isCollapsed ? (
          <div
            style={{
              background: 'rgba(7, 11, 20, 0.65)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.65rem 0.75rem',
              marginBottom: '0.75rem',
              fontSize: '0.72rem'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
              SYSTEM STATUS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                <span className={`status-dot ${backendOnline ? 'green' : 'amber'}`} />
                <span>Backend Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}>
                <span className="status-dot cyan" />
                <span>Scanner Ready</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.75rem' }} title="Backend Connected & Scanner Ready">
            <span className="status-dot green" />
            <span className="status-dot cyan" />
          </div>
        )}

        {/* User Profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: '0.4rem 0.2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                flexShrink: 0
              }}
            >
              <User size={16} />
            </div>
            {!isCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Lead Analyst
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  SOC Analyst / Capstone
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.3rem',
                borderRadius: '4px'
              }}
              title="Sign Out / Switch User"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
