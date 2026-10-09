import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Play,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Check,
  Zap,
  Server,
  FileText,
  Clock,
  ExternalLink,
  Info,
  Lock,
  X
} from 'lucide-react';

export default function ScanAnyUrlView({
  onViewReport,
  onNavigateTab
}) {
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000');
  const [targetName, setTargetName] = useState('');
  const [isAuthorizedConfirmed, setIsAuthorizedConfirmed] = useState(false);
  const [runZap, setRunZap] = useState(false);

  // Pre-flight validation state
  const [validating, setValidating] = useState(false);
  const [scopeResult, setScopeResult] = useState({
    valid: true,
    authorized: true,
    reachable: true,
    message: 'Authorized laboratory target (ports 3000, 8082, 8084)'
  });

  // Active scan execution state
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanId, setActiveScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState('INITIALIZING');
  const [stageMessage, setStageMessage] = useState('');
  const [scanCounters, setScanCounters] = useState({
    pagesDiscovered: 0,
    endpointsDiscoveredCount: 0,
    parametersDiscoveredCount: 0,
    totalVulnerabilitiesFound: 0,
    sqliCount: 0,
    xssCount: 0
  });
  const [measuredDurationMs, setMeasuredDurationMs] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [scanError, setScanError] = useState(null);

  const pollIntervalRef = useRef(null);
  const tickerIntervalRef = useRef(null);
  const scanStartTimeRef = useRef(null);

  // Suggested laboratory & public testing URLs
  const sampleTargets = [
    { name: 'OWASP Juice Shop', url: 'http://localhost:3000', badge: 'LAB' },
    { name: 'DVWA Laboratory', url: 'http://localhost:8082', badge: 'LAB' },
    { name: 'OWASP WebGoat', url: 'http://localhost:8084/WebGoat', badge: 'LAB' },
    { name: 'Example Domain', url: 'https://example.com', badge: 'EXTERNAL' }
  ];

  // Pre-flight check on URL or authorization checkbox change
  useEffect(() => {
    if (!targetUrl.trim()) {
      setScopeResult({ valid: false, authorized: false, reachable: false, message: 'Invalid target URL.' });
      return;
    }

    const timer = setTimeout(() => {
      runPreflightValidation(targetUrl.trim(), isAuthorizedConfirmed);
    }, 400);

    return () => clearTimeout(timer);
  }, [targetUrl, isAuthorizedConfirmed]);

  const runPreflightValidation = (url, authorized) => {
    setValidating(true);
    fetch('/api/targets/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, authorized })
    })
      .then(res => res.json())
      .then(data => {
        setValidating(false);
        setScopeResult({
          valid: data.valid !== false,
          authorized: data.authorized !== false,
          reachable: data.reachable !== false,
          message: data.message || (data.authorized ? 'Target is authorized and reachable' : data.error)
        });
      })
      .catch(() => {
        setValidating(false);
        const isLocalLab = url.includes(':3000') || url.includes(':8082') || url.includes(':8084') || url.includes(':8080');
        setScopeResult({
          valid: true,
          authorized: isLocalLab || authorized,
          reachable: true,
          message: isLocalLab ? 'Authorized local laboratory target' : (authorized ? 'External target authorized by user confirmation' : 'Authorization confirmation is required.')
        });
      });
  };

  const handleStartScan = (e) => {
    e.preventDefault();
    setScanError(null);

    if (!isAuthorizedConfirmed) {
      setScanError('Authorization confirmation is required.');
      return;
    }

    if (!scopeResult.valid) {
      setScanError(scopeResult.message || 'Invalid target URL.');
      return;
    }

    if (!scopeResult.authorized) {
      setScanError('Target blocked by security scope policy.');
      return;
    }

    setIsScanning(true);
    setIsCompleted(false);
    setScanStatus('INITIALIZING');
    setStageMessage('Validating target scope and setting up scan pipeline...');
    scanStartTimeRef.current = Date.now();

    tickerIntervalRef.current = setInterval(() => {
      if (scanStartTimeRef.current) {
        setMeasuredDurationMs(Date.now() - scanStartTimeRef.current);
      }
    }, 1000);

    // Call POST /api/scans/start-url
    fetch('/api/scans/start-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: targetUrl.trim(),
        targetName: targetName.trim() || null,
        authorized: isAuthorizedConfirmed,
        runZap
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
        setActiveScanId(data.scanId);
        setScanStatus(data.status || 'INITIALIZING');
        setStageMessage(data.stageMessage || 'Target validated. Executing inspection pipeline...');
        startPolling(data.scanId);
      })
      .catch(err => {
        console.error('Scan failed to start:', err);
        setIsScanning(false);
        let msg = err.message || 'Failed to start scan.';
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          msg = 'Backend connection unavailable.';
        } else if (msg.includes('scope policy') || msg.includes('forbidden') || msg.includes('SSRF')) {
          msg = 'Target blocked by security scope policy.';
        } else if (msg.includes('confirmation') || msg.includes('authorization')) {
          msg = 'Authorization confirmation is required.';
        } else if (msg.includes('unreachable') || msg.includes('503')) {
          msg = 'Target is unreachable.';
        } else if (msg.includes('Invalid') || msg.includes('400')) {
          msg = 'Invalid target URL.';
        }
        setScanError(msg);
        clearInterval(tickerIntervalRef.current);
      });
  };

  const startPolling = (scanId) => {
    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      fetch(`/api/scans/${scanId}/status`)
        .then(res => res.json())
        .then(data => {
          setScanStatus(data.status);
          if (data.stageMessage) setStageMessage(data.stageMessage);

          setScanCounters({
            pagesDiscovered: data.pagesDiscovered || 0,
            endpointsDiscoveredCount: data.endpointsDiscoveredCount || 0,
            parametersDiscoveredCount: data.parametersDiscoveredCount || 0,
            totalVulnerabilitiesFound: data.totalVulnerabilitiesFound || 0,
            sqliCount: data.sqliCount || 0,
            xssCount: data.xssCount || 0
          });

          if (data.executionTimeMs) {
            setMeasuredDurationMs(data.executionTimeMs);
          }

          if (data.status === 'COMPLETED') {
            setIsCompleted(true);
            setIsScanning(false);
            clearInterval(pollIntervalRef.current);
            clearInterval(tickerIntervalRef.current);
          } else if (data.status === 'FAILED') {
            setIsScanning(false);
            let msg = data.stageMessage || 'Target is unreachable.';
            if (msg.includes('scope policy') || msg.includes('forbidden')) {
              msg = 'Target blocked by security scope policy.';
            } else if (msg.includes('unreachable') || msg.includes('connection refused') || msg.includes('dropped')) {
              msg = 'Target is unreachable.';
            }
            setScanError(msg);
            clearInterval(pollIntervalRef.current);
            clearInterval(tickerIntervalRef.current);
          }
        })
        .catch(err => {
          console.debug('Transient status poll notice:', err);
        });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(tickerIntervalRef.current);
    };
  }, []);

  const handleReset = () => {
    setIsScanning(false);
    setIsCompleted(false);
    setActiveScanId(null);
    setScanError(null);
    setScanCounters({
      pagesDiscovered: 0,
      endpointsDiscoveredCount: 0,
      parametersDiscoveredCount: 0,
      totalVulnerabilitiesFound: 0,
      sqliCount: 0,
      xssCount: 0
    });
  };

  const formatTimer = (ms) => {
    if (!ms || ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // 5-Stage Step Progress Pipeline (Requirement 7)
  const getStepStatus = (stepKey) => {
    if (scanStatus === 'FAILED') return 'failed';
    if (isCompleted) {
      if (stepKey === 'zap' && !runZap) return 'skipped';
      return 'completed';
    }

    switch (stepKey) {
      case 'validate':
        if (scanStatus === 'INITIALIZING') return 'active';
        return 'completed';

      case 'cyber19':
        if (scanStatus === 'INITIALIZING') return 'pending';
        if (['DISCOVERING', 'ANALYZING'].includes(scanStatus)) return 'active';
        return 'completed';

      case 'zap':
        if (!runZap) return 'skipped';
        if (['INITIALIZING', 'DISCOVERING', 'ANALYZING'].includes(scanStatus)) return 'pending';
        if (scanStatus === 'RUNNING_ZAP') return 'active';
        return 'completed';

      case 'evaluating':
        if (['INITIALIZING', 'DISCOVERING', 'ANALYZING', 'RUNNING_ZAP'].includes(scanStatus)) return 'pending';
        if (scanStatus === 'EVALUATING') return 'active';
        return 'completed';

      case 'report':
        if (scanStatus === 'REPORTING') return 'active';
        if (scanStatus === 'COMPLETED') return 'completed';
        return 'pending';

      default:
        return 'pending';
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Title Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.65rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
          <Globe size={13} /> AUTHORIZED WEB SCANNER
        </div>
        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Scan Any Authorized Website
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '640px', margin: '0 auto' }}>
          Enter a target URL directly to initiate real-time attack surface discovery, SQL injection analysis, XSS inspection, and generate an empirical security assessment dossier.
        </p>
      </div>

      {/* Main Workflow Card */}
      <div className="cyber-card" style={{ padding: '2.25rem', border: '1px solid var(--border-accent)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* If scan is completed */}
        {isCompleted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e', color: '#22c55e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle size={36} />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                Security Assessment Completed
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto' }}>
                Target <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{targetUrl}</span> has been assessed. Findings and timing metrics have been stored authoritatively in the database.
              </p>
            </div>

            {/* Metrics preview cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scan ID</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>#{activeScanId}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Endpoints</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>{scanCounters.endpointsDiscoveredCount}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SQLi Found</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: scanCounters.sqliCount > 0 ? '#ef4444' : '#22c55e' }}>{scanCounters.sqliCount}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>XSS Found</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: scanCounters.xssCount > 0 ? '#f59e0b' : '#22c55e' }}>{scanCounters.xssCount}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Workflow Time</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#86efac', fontFamily: 'var(--font-mono)' }}>{(measuredDurationMs / 1000).toFixed(2)}s</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onViewReport && onViewReport(activeScanId)}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FileText size={18} /> View Security Report <ArrowRight size={16} />
              </button>
              <button
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}
              >
                Scan Another Website
              </button>
            </div>
          </div>
        )}

        {/* If scan is actively running */}
        {isScanning && !isCompleted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scan #{activeScanId || '...'}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Scanning {targetUrl}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontSize: '1.1rem', fontWeight: 700 }}>
                <Clock size={18} /> {formatTimer(measuredDurationMs)}
              </div>
            </div>

            {/* 5-Step Real-Time Progress Pipeline (Requirement 7) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Step 1: Target Validation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: getStepStatus('validate') === 'active' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {getStepStatus('validate') === 'completed' ? (
                    <CheckCircle size={18} color="#22c55e" />
                  ) : getStepStatus('validate') === 'active' ? (
                    <Loader2 size={18} className="spin" color="var(--accent-cyan)" />
                  ) : (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                      Target Validation
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Syntax check, loopback/port boundaries, SSRF metadata filter
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: getStepStatus('validate') === 'completed' ? '#22c55e' : (getStepStatus('validate') === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)') }}>
                  {getStepStatus('validate') === 'completed' ? '✓' : (getStepStatus('validate') === 'active' ? '● Running...' : '○ Waiting')}
                </div>
              </div>

              {/* Step 2: CYBER-19 Security Assessment */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: getStepStatus('cyber19') === 'active' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {getStepStatus('cyber19') === 'completed' ? (
                    <CheckCircle size={18} color="#22c55e" />
                  ) : getStepStatus('cyber19') === 'active' ? (
                    <Loader2 size={18} className="spin" color="var(--accent-cyan)" />
                  ) : (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                      CYBER-19 Security Assessment
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Crawler discovered {scanCounters.endpointsDiscoveredCount} endpoints • {scanCounters.sqliCount} SQLi • {scanCounters.xssCount} XSS
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: getStepStatus('cyber19') === 'completed' ? '#22c55e' : (getStepStatus('cyber19') === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)') }}>
                  {getStepStatus('cyber19') === 'completed' ? '✓' : (getStepStatus('cyber19') === 'active' ? '● Running...' : '○ Waiting')}
                </div>
              </div>

              {/* Step 3: OWASP ZAP Baseline Scan */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: getStepStatus('zap') === 'active' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {getStepStatus('zap') === 'completed' ? (
                    <CheckCircle size={18} color="#22c55e" />
                  ) : getStepStatus('zap') === 'active' ? (
                    <Loader2 size={18} className="spin" color="#c084fc" />
                  ) : getStepStatus('zap') === 'skipped' ? (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>—</span>
                  ) : (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                      OWASP ZAP Baseline Scan
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {runZap ? 'Passive baseline crawl over localhost:8080' : 'ZAP baseline was not selected for this scan'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: getStepStatus('zap') === 'completed' ? '#22c55e' : (getStepStatus('zap') === 'active' ? '#c084fc' : 'var(--text-muted)') }}>
                  {getStepStatus('zap') === 'completed' ? '✓' : (getStepStatus('zap') === 'active' ? '● Running...' : (getStepStatus('zap') === 'skipped' ? '— Not executed' : '○ Waiting'))}
                </div>
              </div>

              {/* Step 4: Comparative Evaluation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: getStepStatus('evaluating') === 'active' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {getStepStatus('evaluating') === 'completed' ? (
                    <CheckCircle size={18} color="#22c55e" />
                  ) : getStepStatus('evaluating') === 'active' ? (
                    <Loader2 size={18} className="spin" color="var(--accent-amber)" />
                  ) : (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                      Comparative Evaluation
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Precision, Recall, F1 score computation against test cases
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: getStepStatus('evaluating') === 'completed' ? '#22c55e' : (getStepStatus('evaluating') === 'active' ? 'var(--accent-amber)' : 'var(--text-muted)') }}>
                  {getStepStatus('evaluating') === 'completed' ? '✓' : (getStepStatus('evaluating') === 'active' ? '● Running...' : '○ Waiting')}
                </div>
              </div>

              {/* Step 5: Report Generation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: getStepStatus('report') === 'active' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {getStepStatus('report') === 'completed' ? (
                    <CheckCircle size={18} color="#22c55e" />
                  ) : getStepStatus('report') === 'active' ? (
                    <Loader2 size={18} className="spin" color="var(--accent-cyan)" />
                  ) : (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-muted)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                      Report Generation
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Compiling evidence dossier and persisting authoritative timings
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: getStepStatus('report') === 'completed' ? '#22c55e' : (getStepStatus('report') === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)') }}>
                  {getStepStatus('report') === 'completed' ? '✓' : (getStepStatus('report') === 'active' ? '● Running...' : '○ Waiting')}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Status: <strong style={{ color: 'var(--accent-cyan)' }}>{scanStatus}</strong> — {stageMessage}
            </div>
          </div>
        )}

        {/* Input Form (visible when not scanning and not completed) */}
        {!isScanning && !isCompleted && (
          <form onSubmit={handleStartScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Target URL Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.45rem' }}>
                Target URL <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com or http://localhost:3000"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}
                  required
                />
                {validating && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader2 size={18} className="spin" color="var(--accent-cyan)" />
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Supported schemes: <strong style={{ color: '#ffffff' }}>http://</strong> and <strong style={{ color: '#ffffff' }}>https://</strong> only.
              </div>
            </div>

            {/* Quick Sample Target Chips */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Authorized Preset Targets:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {sampleTargets.map((st) => (
                  <button
                    key={st.url}
                    type="button"
                    onClick={() => {
                      setTargetUrl(st.url);
                      setTargetName(st.name);
                    }}
                    style={{
                      background: targetUrl === st.url ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: targetUrl === st.url ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.65rem',
                      color: targetUrl === st.url ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>{st.name}</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '3px', background: st.badge === 'LAB' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: st.badge === 'LAB' ? '#22c55e' : 'var(--accent-cyan)' }}>
                      {st.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Name (optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Target Descriptive Name (Optional)
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="e.g. Production Demo or Laboratory Audit"
                className="form-input"
                style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.88rem' }}
              />
            </div>

            {/* Scanning Options (Requirement 1) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Scanning Options:
              </div>

              {/* Option 1: CYBER-19 (Mandatory) */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <ShieldCheck size={18} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>Run CYBER-19 Custom Engine</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Crawl endpoints, audit security headers, and probe SQLi / XSS vulnerabilities (Mandatory)</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  style={{ width: '18px', height: '18px', cursor: 'not-allowed', accentColor: 'var(--accent-cyan)' }}
                />
              </div>

              {/* Option 2: OWASP ZAP (Optional) */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Zap size={18} color="#c084fc" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>Run OWASP ZAP Baseline Scan</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Execute passive baseline spider and alert collection via OWASP ZAP 2.17.0 (localhost:8080)</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={runZap}
                  onChange={(e) => setRunZap(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#c084fc' }}
                />
              </div>
            </div>

            {/* Scope / Authorization Warning (Requirement 1) */}
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: '#fcd34d' }}>
              <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span>
                <strong>Important Notice:</strong> Only scan systems that you own or have explicit permission to test.
              </span>
            </div>

            {/* Authorization Confirmation Checkbox (Requirement 1) */}
            <div style={{ background: isAuthorizedConfirmed ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.06)', border: `1px solid ${isAuthorizedConfirmed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.25)'}`, borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="authConfirmCheck"
                checked={isAuthorizedConfirmed}
                onChange={(e) => setIsAuthorizedConfirmed(e.target.checked)}
                style={{ width: '19px', height: '19px', marginTop: '2px', cursor: 'pointer' }}
                required
              />
              <label htmlFor="authConfirmCheck" style={{ fontSize: '0.88rem', color: '#ffffff', cursor: 'pointer', lineHeight: 1.45 }}>
                <strong style={{ color: isAuthorizedConfirmed ? '#86efac' : '#fca5a5' }}>
                  I confirm that I am authorized to perform security testing against this target.
                </strong>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  I warrant that I have explicit authorization to assess this target URL, or that it is an authorized local security research laboratory under my control.
                </div>
              </label>
            </div>

            {/* Pre-flight Scope Feedback Banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', background: scopeResult.valid && scopeResult.authorized ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${scopeResult.valid && scopeResult.authorized ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.3)'}` }}>
              {scopeResult.valid && scopeResult.authorized ? (
                <ShieldCheck size={16} color="#22c55e" />
              ) : (
                <AlertTriangle size={16} color="#f59e0b" />
              )}
              <span style={{ color: scopeResult.valid && scopeResult.authorized ? '#86efac' : '#fcd34d' }}>
                {scopeResult.message}
              </span>
            </div>

            {/* Error Message if present */}
            {scanError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '0.85rem 1rem', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={17} color="#ef4444" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={validating}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)'
              }}
            >
              <Play size={18} /> START SECURITY SCAN
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
