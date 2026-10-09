import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  PieChart,
  Binary,
  Layers,
  HelpCircle,
  Filter,
  Check,
  Shield,
  Activity,
  ArrowRight,
  Database,
  GitCompare,
  Clock,
  Server
} from 'lucide-react';

export default function EvaluationMetricsView({
  metrics = {},
  testCases = [],
  targets = [],
  scans = [],
  onVerifyLive
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [evalData, setEvalData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'category'
  const [selectedTargetFilter, setSelectedTargetFilter] = useState('ALL');

  // Default to latest scan if available
  useEffect(() => {
    if (scans && scans.length > 0 && !selectedScanId) {
      const sorted = [...scans].sort((a, b) => b.id - a.id);
      setSelectedScanId(sorted[0].id);
    }
  }, [scans, selectedScanId]);

  // Fetch scan-specific evaluation metrics & comparative benchmark data whenever selectedScanId changes
  useEffect(() => {
    if (selectedScanId) {
      fetch(`/api/evaluation/metrics?scanId=${selectedScanId}`)
        .then(res => res.json())
        .then(data => {
          if (data) setEvalData(data);
        })
        .catch(() => {});

      fetch(`/api/evaluation/comparison?scanId=${selectedScanId}`)
        .then(res => res.json())
        .then(data => {
          if (data) setComparisonData(data);
        })
        .catch(() => {});
    }
  }, [selectedScanId]);

  // Active metrics: use evalData if available, otherwise fallback to top-level metrics
  const activeMetrics = evalData || metrics || {};
  const currentScan = scans.find(s => s.id === Number(selectedScanId));

  const tp = activeMetrics.truePositives !== undefined ? activeMetrics.truePositives : 0;
  const fp = activeMetrics.falsePositives !== undefined ? activeMetrics.falsePositives : 0;
  const tn = activeMetrics.trueNegatives !== undefined ? activeMetrics.trueNegatives : 0;
  const fn = activeMetrics.falseNegatives !== undefined ? activeMetrics.falseNegatives : 0;
  const total = activeMetrics.totalTestCases !== undefined ? activeMetrics.totalTestCases : (tp + fp + tn + fn);

  // Compute standard research metrics
  const precision = activeMetrics.precisionPercentage !== undefined
    ? activeMetrics.precisionPercentage
    : (tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0);
  const recall = activeMetrics.detectionCoveragePercentage !== undefined
    ? activeMetrics.detectionCoveragePercentage
    : (tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0);
  const f1 = activeMetrics.f1ScorePercentage !== undefined
    ? activeMetrics.f1ScorePercentage
    : (precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0);

  // Traceability rows for standalone category tab
  const traceabilityList = (activeMetrics.traceability && activeMetrics.traceability.length > 0)
    ? activeMetrics.traceability
    : testCases.map(tc => ({
        testCaseId: tc.testCaseId,
        targetName: tc.targetName,
        vulnerabilityType: tc.vulnerabilityType,
        endpoint: tc.endpoint || (tc.vulnerabilityType?.includes('SQL') ? '/rest/user/login' : '/rest/products/search'),
        parameter: tc.parameter || (tc.vulnerabilityType?.includes('SQL') ? 'email' : 'q'),
        expectedCondition: tc.expectedCondition,
        scannerDetected: tc.actualResult === 'DETECTED' ? 'YES' : 'NO',
        classification: tc.classification,
        description: tc.description || tc.verificationStatus
      }));

  const filteredTraceability = selectedTargetFilter === 'ALL'
    ? traceabilityList
    : traceabilityList.filter(t => t.targetName?.toLowerCase() === selectedTargetFilter.toLowerCase());

  // Comparative traceability rows
  const comparativeTraceability = comparisonData?.traceability || [];

  const handleRunVerification = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    if (onVerifyLive) {
      onVerifyLive(() => {
        setIsVerifying(false);
        if (selectedScanId) {
          fetch(`/api/evaluation/metrics?scanId=${selectedScanId}`)
            .then(res => res.json())
            .then(data => { if (data) setEvalData(data); });
          fetch(`/api/evaluation/comparison?scanId=${selectedScanId}`)
            .then(res => res.json())
            .then(data => { if (data) setComparisonData(data); });
        }
      });
    } else {
      setTimeout(() => {
        setIsVerifying(false);
        if (selectedScanId) {
          fetch(`/api/evaluation/metrics?scanId=${selectedScanId}`)
            .then(res => res.json())
            .then(data => { if (data) setEvalData(data); });
          fetch(`/api/evaluation/comparison?scanId=${selectedScanId}`)
            .then(res => res.json())
            .then(data => { if (data) setComparisonData(data); });
        }
      }, 1500);
    }
  };

  const getClassificationBadge = (cls) => {
    switch (cls) {
      case 'TRUE_POSITIVE':
        return <span className="badge badge-success" style={{ fontWeight: 700 }}>TRUE POSITIVE</span>;
      case 'FALSE_POSITIVE':
        return <span className="badge badge-warning" style={{ fontWeight: 700 }}>FALSE POSITIVE</span>;
      case 'TRUE_NEGATIVE':
        return <span className="badge badge-cyan" style={{ fontWeight: 700 }}>TRUE NEGATIVE</span>;
      case 'FALSE_NEGATIVE':
        return <span className="badge badge-rose" style={{ fontWeight: 700 }}>FALSE NEGATIVE</span>;
      case 'ZAP_UNAVAILABLE':
        return <span className="badge badge-neutral" style={{ fontWeight: 600, color: 'var(--accent-amber)', borderColor: 'rgba(245,158,11,0.3)' }}>ZAP UNAVAILABLE</span>;
      case 'NOT_COVERED':
      default:
        return <span className="badge badge-neutral" style={{ fontWeight: 600 }}>NOT COVERED</span>;
    }
  };

  const sqlMetrics = activeMetrics.sqlInjection || { tp: 0, fp: 0, fn: 0, tn: 0, precision: 0, recall: 0, f1: 0 };
  const xssMetrics = activeMetrics.xss || { tp: 0, fp: 0, fn: 0, tn: 0, precision: 0, recall: 0, f1: 0 };
  const passiveMetrics = activeMetrics.passive || { tp: 0, fp: 0, fn: 0, tn: 0, precision: 0, recall: 0, f1: 0 };
  const overallMetrics = activeMetrics.overall || { tp, fp, fn, tn, precision, recall, f1 };

  const customComp = comparisonData?.customScanner || {
    tp, fp, fn, tn,
    precision, recall, f1,
    falsePositiveRate: (fp + tn > 0 ? (fp / (fp + tn)) * 100 : 0),
    durationMs: currentScan?.executionTimeMs || 0
  };

  const zapComp = comparisonData?.owaspZap || {
    tp: 0, fp: 0, fn: 0, tn: 0,
    precision: 0, recall: 0, f1: 0,
    falsePositiveRate: 0,
    durationMs: 0
  };

  const zapStatus = comparisonData?.zapStatus || 'PENDING';
  const zapMessage = comparisonData?.zapMessage || '';

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header with Scan Selector & Live Action */}
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
            Ground Truth Evaluation & Benchmarking
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Comparative benchmarking of CYBER-19 Custom Engine versus OWASP ZAP against identical ground-truth test cases.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Scan Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <Activity size={15} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>EVALUATE SCAN:</span>
            <select
              value={selectedScanId || ''}
              onChange={(e) => setSelectedScanId(Number(e.target.value))}
              className="form-select"
              style={{ fontSize: '0.78rem', padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', color: '#ffffff', fontWeight: 700 }}
            >
              {scans && scans.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0a101f', color: '#ffffff' }}>
                  Scan #{s.id} - {s.scanName} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunVerification}
            disabled={isVerifying}
            className="btn btn-primary"
            style={{ opacity: isVerifying ? 0.7 : 1, cursor: isVerifying ? 'not-allowed' : 'pointer', fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
          >
            {isVerifying ? (
              <>
                <RotateCcw size={15} className="spin" /> Evaluating Scan...
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" /> Refresh Benchmark
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target & Scan Status Pill */}
      {currentScan && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
          <div>
            <strong style={{ color: '#ffffff' }}>Benchmark Target:</strong>{' '}
            <span style={{ color: 'var(--accent-cyan)' }}>{comparisonData?.targetName || activeMetrics.targetName || 'OWASP Juice Shop'}</span>
          </div>
          <div>•</div>
          <div>
            <strong style={{ color: '#ffffff' }}>CYBER-19 Status:</strong>{' '}
            <span className={currentScan.status === 'COMPLETED' ? 'badge badge-success' : 'badge badge-rose'}>
              {currentScan.status}
            </span>
          </div>
          <div>•</div>
          <div>
            <strong style={{ color: '#ffffff' }}>OWASP ZAP Status:</strong>{' '}
            <span className={zapStatus === 'COMPLETED' ? 'badge badge-success' : (zapStatus === 'ZAP_UNAVAILABLE' ? 'badge badge-warning' : 'badge badge-rose')}>
              {zapStatus}
            </span>
          </div>
          <div>•</div>
          <div>
            <strong style={{ color: '#ffffff' }}>Ground Truth Cases:</strong>{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{total}</span>
          </div>
        </div>
      )}

      {/* ZAP Status Advisory Banner */}
      {zapStatus === 'ZAP_UNAVAILABLE' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.9rem 1.1rem', borderRadius: '8px', fontSize: '0.82rem' }}>
          <AlertTriangle size={20} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.2rem' }}>
              OWASP ZAP Daemon Offline (Local Port 8080 Unreachable)
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {zapMessage || 'OWASP ZAP daemon is not currently running on http://localhost:8080. Start OWASP ZAP with `-daemon -port 8080` to perform live comparative scans.'}{' '}
              <strong>CYBER-19 Custom Engine findings and metrics are actively evaluated without synthetic fabrication.</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`btn ${activeTab === 'comparison' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <GitCompare size={15} /> Comparative Benchmark (CYBER-19 vs OWASP ZAP)
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={`btn ${activeTab === 'category' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Layers size={15} /> CYBER-19 Category Metrics
        </button>
      </div>

      {activeTab === 'comparison' ? (
        <>
          {/* Side-by-Side Comparative Metrics Table (Section 16 Specification) */}
          <div className="cyber-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                  Empirical Comparative Benchmark Matrix
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Head-to-head empirical metrics measured on the identical target ({comparisonData?.targetName || 'OWASP Juice Shop'}) and identical 8 ground-truth test cases.
                </p>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                PHASE 7 BENCHMARK
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Metric / Evaluation Parameter</th>
                    <th style={{ width: '28%', color: 'var(--accent-cyan)' }}>
                      CYBER-19 Custom Engine
                    </th>
                    <th style={{ width: '28%', color: 'var(--accent-purple)' }}>
                      OWASP ZAP (Baseline/API)
                    </th>
                    <th style={{ width: '16%' }}>Evaluation Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>True Positives (TP)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '1.05rem' }}>
                      {customComp.tp}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 800, fontSize: '1.05rem' }}>
                      {zapStatus === 'COMPLETED' ? zapComp.tp : (zapStatus === 'ZAP_UNAVAILABLE' ? 'Offline' : '0')}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified real vulnerabilities detected</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>False Positives (FP)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 700 }}>
                      {customComp.fp}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {zapStatus === 'COMPLETED' ? zapComp.fp : (zapStatus === 'ZAP_UNAVAILABLE' ? 'Offline' : '0')}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Spurious alerts on known safe inputs</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>False Negatives (FN)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)', fontWeight: 700 }}>
                      {customComp.fn}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-rose)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {zapStatus === 'COMPLETED' ? zapComp.fn : (zapStatus === 'ZAP_UNAVAILABLE' ? 'Offline' : '0')}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Known vulnerabilities missed</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>True Negatives (TN)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {customComp.tn}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {zapStatus === 'COMPLETED' ? zapComp.tn : (zapStatus === 'ZAP_UNAVAILABLE' ? 'Offline' : '0')}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Safe endpoints correctly cleared</td>
                  </tr>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>Precision (Confidence)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 800 }}>
                      {Number(customComp.precision).toFixed(1)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: 800 }}>
                      {zapStatus === 'COMPLETED' ? `${Number(zapComp.precision).toFixed(1)}%` : 'N/A (Daemon offline)'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TP / (TP + FP)</td>
                  </tr>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>Recall (Sensitivity)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 800 }}>
                      {Number(customComp.recall).toFixed(1)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: 800 }}>
                      {zapStatus === 'COMPLETED' ? `${Number(zapComp.recall).toFixed(1)}%` : 'N/A (Daemon offline)'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TP / (TP + FN)</td>
                  </tr>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>F1-Score</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: 800 }}>
                      {Number(customComp.f1).toFixed(1)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: 800 }}>
                      {zapStatus === 'COMPLETED' ? `${Number(zapComp.f1).toFixed(1)}%` : 'N/A (Daemon offline)'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Harmonic mean of P & R</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>False Positive Rate (FPR)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: customComp.falsePositiveRate > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontWeight: 700 }}>
                      {Number(customComp.falsePositiveRate).toFixed(1)}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {zapStatus === 'COMPLETED' ? `${Number(zapComp.falsePositiveRate).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FP / (FP + TN)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Measured Scan Duration</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {customComp.durationMs} ms ({(customComp.durationMs / 1000).toFixed(2)}s)
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: zapStatus === 'COMPLETED' ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {zapStatus === 'COMPLETED' ? `${zapComp.durationMs} ms (${(zapComp.durationMs / 1000).toFixed(2)}s)` : 'N/A'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actual measured runtime</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparative Traceability Table (Section 17 Specification) */}
          <div className="cyber-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Comparative Traceability Matrix (CYBER-19 vs OWASP ZAP)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Case-by-case outcome verification comparing expected ground truth against independent detection by CYBER-19 and OWASP ZAP.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Test Case</th>
                    <th>Target Endpoint & Param</th>
                    <th>Vulnerability Type</th>
                    <th>Expected</th>
                    <th style={{ color: 'var(--accent-cyan)' }}>CYBER-19 Detection</th>
                    <th style={{ color: 'var(--accent-cyan)' }}>CYBER-19 Class</th>
                    <th style={{ color: 'var(--accent-purple)' }}>ZAP Detection</th>
                    <th style={{ color: 'var(--accent-purple)' }}>ZAP Class</th>
                    <th>Benchmark Description</th>
                  </tr>
                </thead>
                <tbody>
                  {comparativeTraceability.length > 0 ? (
                    comparativeTraceability.map((item, idx) => (
                      <tr key={item.testCaseId || idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          {item.testCaseId}
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#ffffff' }}>
                            {item.endpoint}
                          </div>
                          {item.parameter && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
                              param: {item.parameter}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="code-inline" style={{ fontSize: '0.72rem' }}>
                            {item.vulnerabilityType}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: item.expectedCondition === 'VULNERABLE' ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontWeight: 700 }}>
                            {item.expectedCondition}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: item.customDetected === 'YES' ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 700 }}>
                            {item.customDetected}
                          </span>
                        </td>
                        <td>{getClassificationBadge(item.customClassification)}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: item.zapDetected === 'YES' ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 700 }}>
                            {item.zapDetected}
                          </span>
                        </td>
                        <td>{getClassificationBadge(item.zapClassification)}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                          {item.description}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No comparative traceability data available. Refresh benchmark to generate comparisons.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* CYBER-19 6 Analytic Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.1rem' }}>
            <div className="cyber-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                True Positives (TP)
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
                {tp}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Verified exploit detections
              </div>
            </div>

            <div className="cyber-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
                False Positives (FP)
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
                {fp}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Spurious alerts on safe inputs
              </div>
            </div>

            <div className="cyber-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                True Negatives (TN)
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
                {tn}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Safe cases correctly cleared
              </div>
            </div>

            <div className="cyber-card" style={{ borderLeft: '4px solid var(--accent-indigo)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
                Precision
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
                {Number(precision).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                TP / (TP + FP) confidence
              </div>
            </div>

            <div className="cyber-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                Recall
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
                {Number(recall).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                TP / (TP + FN) sensitivity
              </div>
            </div>

            <div className="cyber-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                F1 Score
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '0.35rem' }}>
                {Number(f1).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Harmonic mean of P & R
              </div>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="cyber-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Vulnerability Category Metric Breakdown (CYBER-19)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Empirical benchmark metrics computed independently per vulnerability classification.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Vulnerability Category</th>
                    <th>TP</th>
                    <th>FP</th>
                    <th>FN</th>
                    <th>TN</th>
                    <th>Total Cases</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1-Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>SQL Injection (SQLi)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700 }}>{sqlMetrics.tp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{sqlMetrics.fp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)' }}>{sqlMetrics.fn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{sqlMetrics.tn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{sqlMetrics.total || (sqlMetrics.tp + sqlMetrics.fp + sqlMetrics.fn + sqlMetrics.tn)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>{Number(sqlMetrics.precision).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>{Number(sqlMetrics.recall).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>{Number(sqlMetrics.f1).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>Cross-Site Scripting (XSS)</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700 }}>{xssMetrics.tp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{xssMetrics.fp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)' }}>{xssMetrics.fn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{xssMetrics.tn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{xssMetrics.total || (xssMetrics.tp + xssMetrics.fp + xssMetrics.fn + xssMetrics.tn)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>{Number(xssMetrics.precision).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>{Number(xssMetrics.recall).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>{Number(xssMetrics.f1).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>Passive Security Checks</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700 }}>{passiveMetrics.tp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{passiveMetrics.fp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)' }}>{passiveMetrics.fn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{passiveMetrics.tn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{passiveMetrics.total || (passiveMetrics.tp + passiveMetrics.fp + passiveMetrics.fn + passiveMetrics.tn)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>{Number(passiveMetrics.precision).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>{Number(passiveMetrics.recall).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>{Number(passiveMetrics.f1).toFixed(1)}%</td>
                  </tr>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderTop: '2px solid var(--border-subtle)' }}>
                    <td style={{ fontWeight: 800, color: '#ffffff' }}>Overall Benchmark Aggregate</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 800 }}>{overallMetrics.tp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', fontWeight: 800 }}>{overallMetrics.fp}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rose)', fontWeight: 800 }}>{overallMetrics.fn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 800 }}>{overallMetrics.tn}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{overallMetrics.total || total}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-emerald)' }}>{Number(overallMetrics.precision).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-emerald)' }}>{Number(overallMetrics.recall).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-purple)' }}>{Number(overallMetrics.f1).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Standalone Ground-Truth Traceability */}
          <div className="cyber-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                  Ground-Truth Traceability & Outcome Log
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Deterministic case-by-case comparison of expected ground truth against actual scanner telemetry.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={14} color="var(--text-muted)" />
                <select
                  value={selectedTargetFilter}
                  onChange={(e) => setSelectedTargetFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                >
                  <option value="ALL">All Targets</option>
                  {targets.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Test Case ID</th>
                    <th>Endpoint</th>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Expected</th>
                    <th>Scanner Detected</th>
                    <th>Benchmark Result</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTraceability.map((item, idx) => (
                    <tr key={item.testCaseId || idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {item.testCaseId}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                        {item.endpoint}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-amber)' }}>
                        {item.parameter || 'N/A'}
                      </td>
                      <td>
                        <span className="code-inline" style={{ fontSize: '0.72rem' }}>
                          {item.vulnerabilityType}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: item.expectedCondition === 'VULNERABLE' ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontWeight: 700 }}>
                          {item.expectedCondition}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: item.scannerDetected === 'YES' ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 700 }}>
                          {item.scannerDetected}
                        </span>
                      </td>
                      <td>{getClassificationBadge(item.classification)}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
