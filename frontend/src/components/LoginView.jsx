import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  CheckCircle,
  KeyRound,
  ExternalLink
} from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('analyst@cyber19.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--bg-primary)'
      }}
    >
      {/* Left Column: Cyber Visual Branding */}
      <div
        style={{
          flex: 1.1,
          background: 'radial-gradient(ellipse at bottom left, #0e1d38 0%, #070b14 70%)',
          borderRight: '1px solid var(--border-subtle)',
          padding: '4rem 3.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Background Grid/Network Graphic */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            opacity: 0.8,
            pointerEvents: 'none'
          }}
        />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.2)'
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                CYBER-19
              </span>
              <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                ENTERPRISE
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#ffffff', lineHeight: '1.2', letterSpacing: '-0.03em', maxWidth: '520px', marginBottom: '1.25rem' }}>
            Automated Web Vulnerability Assessment Platform
          </h2>

          <p style={{ fontSize: '1.15rem', color: 'var(--accent-cyan)', fontStyle: 'italic', fontWeight: 500, letterSpacing: '0.02em', marginBottom: '2rem' }}>
            "Measure. Detect. Verify."
          </p>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '480px' }}>
            A rigorous cybersecurity research testbed delivering non-destructive vulnerability detection, security header verification, and empirical ground-truth benchmark auditing.
          </p>
        </div>

        {/* Feature Highlights at Bottom */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>87%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ground Truth Recall</div>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>0%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Destructive Actions</div>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>100%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authorized Testing Scope</div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div
        style={{
          flex: 0.9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem',
          background: 'var(--bg-secondary)'
        }}
      >
        <div
          className="cyber-card"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2.5rem',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
              Sign In to CYBER-19
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Enter your credentials to access the SOC vulnerability platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.2rem' }}
                  required
                />
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.2rem' }}
                  required
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember this workstation
              </label>
              <span style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }}>Authorized Session</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                marginTop: '0.5rem',
                letterSpacing: '0.02em'
              }}
            >
              LOGIN <ArrowRight size={16} />
            </button>

            {/* Quick Demo Bypass Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.82rem',
                gap: '0.4rem'
              }}
            >
              <KeyRound size={14} color="var(--accent-cyan)" /> Enter as Security Lead (Demo Mode)
            </button>
          </form>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
              textAlign: 'center'
            }}
          >
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
              <ShieldCheck size={14} /> Secure Authentication & Audit Policy
            </div>
            <div>All access sessions are logged for ethical testing verification.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
