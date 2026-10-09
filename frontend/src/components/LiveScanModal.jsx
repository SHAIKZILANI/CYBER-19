import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileText,
  Layers,
  Zap,
  Server
} from 'lucide-react';

export default function LiveScanModal({
  scanConfig,
  onFinishScan,
  onCancelScan,
  onViewReport,
  onViewFindings
}) {
  const [scanId, setScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState('INITIALIZING');
  const [stageMessage, setStageMessage] = useState('Validating target scope and initializing assessment worker...');
  const [counters, setCounters] = useState({
    pagesDiscovered: 0,
    endpointsDiscoveredCount: 0,
    parametersDiscoveredCount: 0,
    totalVulnerabilitiesFound: 0,
    sqliCount: 0,
    xssCount: 0,
    zapAlertsCount: 0
  });
  const [executionTimeMs, setExecutionTimeMs] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const startTimeRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const targetName = scanConfig?.targetName || 'Local Laboratory Target';
  const targetUrl = scanConfig?.targetUrl || 'http://localhost:3000';

  // 1. Initiate Real Scan via POST /api/scans/start
  useEffect(() => {
    startTimeRef.current = Date.now();

    // Start elapsed timer ticker
    timerIntervalRef.current = setInterval(() => {
      setExecutionTimeMs(Date.now() - startTimeRef.current);
    }, 1000);

    fetch('/api/scans/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId: scanConfig?.targetId || null,
        targetUrl: scanConfig?.targetUrl || null,
        targetName: scanConfig?.targetName || null,
        runZap: scanConfig?.runZap !== false,
        authenticated: Boolean(scanConfig?.authenticated),
        username: scanConfig?.username || null,
        password: scanConfig?.password || null
      })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => {
            throw new Error(data.message || data.error || `HTTP ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        setScanId(data.scanId);
        setScanStatus(data.status || 'INITIALIZING');
        setStageMessage(data.stageMessage || 'Scope confirmed. Starting attack surface crawler...');
      })
      .catch(err => {
        console.error('Failed to initiate scan:', err);
        setIsFailed(true);
        setErrorMessage(err.message || 'Connection refused to backend or target');
        clearInterval(timerIntervalRef.current);
      });

    return () => {
      clearInterval(timerIntervalRef.current);
      clearInterval(pollIntervalRef.current);
    };
  }, []);

  // 2. Poll /api/scans/{id}/status every 1000ms once scanId is known
  useEffect(() => {
    if (!scanId || isCompleted || isFailed) return;

    pollIntervalRef.current = setInterval(() => {
      fetch(`/api/scans/${scanId}/status`)
        .then(res => {
          if (!res.ok) throw new Error(`Status check HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          setScanStatus(data.status);
          if (data.stageMessage) setStageMessage(data.stageMessage);

          setCounters({
            pagesDiscovered: data.pagesDiscovered || 0,
            endpointsDiscoveredCount: data.endpointsDiscoveredCount || 0,
            parametersDiscoveredCount: data.parametersDiscoveredCount || 0,
            totalVulnerabilitiesFound: data.totalVulnerabilitiesFound || 0,
            sqliCount: data.sqliCount || 0,
            xssCount: data.xssCount || 0,
            zapAlertsCount: data.zapAlertsCount || 0
          });

          if (data.executionTimeMs) {
            setExecutionTimeMs(data.executionTimeMs);
          }

          if (data.status === 'COMPLETED') {
            setIsCompleted(true);
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
          } else if (data.status === 'FAILED') {
            setIsFailed(true);
            setErrorMessage(data.errorMessage || 'Scan terminated: target became unreachable or dropped connection.');
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
          }
        })
        .catch(err => {
          console.debug('Polling error (transient):', err.message);
        });
    }, 1000);

    return () => clearInterval(pollIntervalRef.current);
  }, [scanId, isCompleted, isFailed]);

  const formatTimer = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Determine stage progression
  const stages = [
    {
      id: 'scope',
      title: 'Target Authorization & Scope',
      detail: 'Local laboratory 127.0.0.1 scope confirmed',
      done: scanStatus !== 'INITIALIZING',
      current: scanStatus === 'INITIALIZING'
    },
    {
      id: 'discovery',
      title: 'Attack Surface Discovery',
      detail: `${counters.pagesDiscovered} pages, ${counters.endpointsDiscoveredCount} endpoints discovered`,
      done: scanStatus === 'ANALYZING' || scanStatus === 'AUDITING_ACCESS_CONTROL' || scanStatus === 'RUNNING_ZAP' || scanStatus === 'COMPLETED',
      current: scanStatus === 'DISCOVERING'
    },
    {
      id: 'analysis',
      title: 'CYBER-19 Injection & Header Probes',
      detail: `SQLi (${counters.sqliCount}), XSS (${counters.xssCount}), Security Headers`,
      done: scanStatus === 'AUDITING_ACCESS_CONTROL' || scanStatus === 'RUNNING_ZAP' || scanStatus === 'COMPLETED',
      current: scanStatus === 'ANALYZING'
    },
    {
      id: 'accessControl',
      title: 'Automated Access Control & IDOR Checks',
      detail: 'Probing unauthorized endpoint access and object boundary controls',
      done: scanStatus === 'RUNNING_ZAP' || scanStatus === 'COMPLETED',
      current: scanStatus === 'AUDITING_ACCESS_CONTROL'
    },
    {
      id: 'zap',
      title: 'OWASP ZAP Comparative Sweep',
      detail: scanConfig?.runZap === false ? 'Skipped by configuration' : 'Independent verification daemon on port 8080',
      done: scanStatus === 'COMPLETED',
      current: scanStatus === 'RUNNING_ZAP'
    },
    {
      id: 'report',
      title: 'Finalizing Assessment Report',
      detail: 'Persisting findings and generating security dossier',
      done: scanStatus === 'COMPLETED',
      current: scanStatus === 'COMPLETED'
    }
  ];

  return (
    <div className="modal-overlay" style={{ background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '640px', border: '1px solid var(--border-accent)', background: 'var(--bg-card)', padding: '2rem', borderRadius: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: isCompleted ? 'rgba(34, 197, 94, 0.15)' : isFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: isCompleted ? '#22c55e' : isFailed ? '#ef4444' : 'var(--accent-cyan)' }}>
              {isCompleted ? <ShieldCheck size={24} /> : isFailed ? <AlertTriangle size={24} /> : <Shield size={24} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {isCompleted ? 'Security Assessment Complete' : isFailed ? 'Assessment Terminated' : 'Executing Security Assessment'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {targetName} ({targetUrl})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {scanId && (
              <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)' }}>
                Scan #{scanId}
              </span>
            )}
            {isCompleted ? (
              <span className="badge badge-success"><Check size={12} /> COMPLETED</span>
            ) : isFailed ? (
              <span className="badge badge-danger">FAILED</span>
            ) : (
              <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Loader2 size={12} className="spin" /> {scanStatus}
              </span>
            )}
            <button
              onClick={onCancelScan}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Elapsed Time</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
              {formatTimer(executionTimeMs)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pages</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {counters.pagesDiscovered}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Endpoints</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc' }}>
              {counters.endpointsDiscoveredCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Findings</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: counters.totalVulnerabilitiesFound > 0 ? '#fca5a5' : '#86efac' }}>
              {counters.totalVulnerabilitiesFound}
            </div>
          </div>
        </div>

        {/* Status Stage Message */}
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} color="var(--accent-cyan)" />
          <span>{stageMessage}</span>
        </div>

        {/* Failure Message Alert */}
        {isFailed && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-rose)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.88rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Assessment Failed:</div>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Real Stages List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {stages.map(st => {
            return (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: st.current ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                  border: st.current ? '1px solid var(--accent-cyan)' : '1px solid transparent'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: st.done ? 'rgba(34, 197, 94, 0.2)' : st.current ? 'rgba(56, 189, 248, 0.2)' : 'rgba(100, 116, 139, 0.2)', color: st.done ? '#22c55e' : st.current ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {st.done ? <Check size={14} /> : st.current ? <Loader2 size={14} className="spin" /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: st.done || st.current ? '#ffffff' : 'var(--text-muted)' }}>
                    {st.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {st.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <button
            onClick={onCancelScan}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            {isCompleted || isFailed ? 'Close' : 'Cancel Scan'}
          </button>

          {isCompleted && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {onViewFindings && (
                <button
                  onClick={() => onViewFindings(scanId)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  View Findings Table
                </button>
              )}

              {onViewReport && (
                <button
                  onClick={() => onViewReport(scanId)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <FileText size={15} /> View Assessment Report <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
