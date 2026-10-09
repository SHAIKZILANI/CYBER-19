import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Download,
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  Layers,
  Server,
  Zap,
  Check,
  X,
  FileCode,
  ArrowRight,
  Filter,
  Activity,
  Award,
  ChevronLeft,
  Info,
  Lock,
  Unlock,
  Key,
  BookOpen
} from 'lucide-react';

export default function SecurityAssessmentReportView({
  scanId,
  scans = [],
  onSelectScanId,
  onNavigateTab
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [activeScanId, setActiveScanId] = useState(scanId || (scans.length > 0 ? scans[scans.length - 1].id : null));
  const [expandedVulnId, setExpandedVulnId] = useState(null);
  const [expandedRemediationIds, setExpandedRemediationIds] = useState(new Set());
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [cyber19Page, setCyber19Page] = useState(1);
  const [zapPage, setZapPage] = useState(1);
  const [traceabilityPage, setTraceabilityPage] = useState(1);
  const [accessControlPage, setAccessControlPage] = useState(1);
  const [accessControlFilter, setAccessControlFilter] = useState('ALL');
  const [appFilter, setAppFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (scanId) {
      setActiveScanId(scanId);
    } else if (!activeScanId && scans.length > 0) {
      setActiveScanId(scans[scans.length - 1].id);
    }
  }, [scanId, scans]);

  useEffect(() => {
    if (!activeScanId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCyber19Page(1);
    setZapPage(1);
    setTraceabilityPage(1);

    fetch(`/api/scans/${activeScanId}/report`)
      .then(res => {
        if (!res.ok) throw new Error(`Report endpoint returned HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setReportData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load scan report:', err);
        setError(`Unable to load assessment report for Scan #${activeScanId}: ${err.message}`);
        setLoading(false);
      });
  }, [activeScanId]);

  const toggleExpand = (id) => {
    setExpandedVulnId(prev => prev === id ? null : id);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CYBER-19-Assessment-Report-Scan-${activeScanId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.vulnerabilities) return;
    const vulns = reportData.vulnerabilities;
    const headers = ['ID', 'ScanID', 'Severity', 'VulnerabilityType', 'EndpointUrl', 'Parameter', 'Source', 'HttpStatus', 'Evidence', 'Remediation'];
    const rows = vulns.map(v => {
      const g = v.remediationGuidance || reportData?.remediations?.[v.vulnerabilityType] || {};
      return [
        v.id || '',
        v.scanId || '',
        v.severity || '',
        `"${(v.vulnerabilityType || '').replace(/"/g, '""')}"`,
        `"${(v.endpointUrl || '').replace(/"/g, '""')}"`,
        `"${(v.parameter || '').replace(/"/g, '""')}"`,
        v.source || '',
        v.httpStatus || '',
        `"${(v.evidence || '').replace(/"/g, '""')}"`,
        `"${(g.remediation || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CYBER-19-Findings-Scan-${activeScanId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Authoritative duration formatter from backend milliseconds
  const formatDuration = (ms) => {
    if (ms === null || ms === undefined || isNaN(ms)) return 'N/A';
    if (ms <= 0) return '0.00 s';
    const totalSec = ms / 1000;
    if (totalSec < 60) {
      return `${totalSec.toFixed(3)} s (${ms.toLocaleString()} ms)`;
    }
    const min = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toFixed(1);
    return `${min}m ${sec}s (${ms.toLocaleString()} ms)`;
  };

  const formatShortDuration = (ms) => {
    if (ms === null || ms === undefined || isNaN(ms)) return 'N/A';
    if (ms <= 0) return '0.00 s';
    const totalSec = ms / 1000;
    if (totalSec < 60) {
      return `${totalSec.toFixed(2)} s`;
    }
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    return `${min}m ${sec}s`;
  };

  // Memoized datasets
  const scan = reportData?.scan;
  const target = reportData?.target;
  const perf = reportData?.performance || {};
  const discovery = reportData?.discovery || {};
  const zapComparison = reportData?.zapComparison;
  const recommendations = reportData?.recommendations || [];
  const limitations = reportData?.limitations || [];

  // Metric objects & ZAP engine status
  const customMetrics = zapComparison?.customScanner || zapComparison?.cyber19;
  const zapMetrics = zapComparison?.owaspZap;
  const perfZapStatus = perf.zapStatus;
  const zapStatus = perfZapStatus || zapComparison?.zapStatus || 'UNAVAILABLE';
  const zapReused = Boolean(perf.zapReused || zapStatus === 'REUSED_BENCHMARK');
  const zapNotExecuted = zapStatus === 'NOT_EXECUTED';
  const zapOnline = zapStatus === 'COMPLETED' || zapReused;

  // Authoritative server timestamps & measured durations (strictly from backend performance object)
  const cyber19DurationMs = perf.cyber19DurationMs ?? scan?.executionTimeMs ?? 0;
  const zapDurationMs = (zapNotExecuted || zapReused)
    ? null
    : (perf.zapDurationMs !== undefined ? perf.zapDurationMs : (zapMetrics?.durationMs ?? null));
  const benchmarkDurationMs = perf.benchmarkDurationMs ?? zapComparison?.benchmarkDurationMs ?? null;
  const accessControlDurationMs = perf.accessControlDurationMs ?? scan?.accessControlDurationMs ?? null;
  const totalWorkflowDurationMs = perf.totalWorkflowDurationMs ?? (
    (scan?.startTime && scan?.endTime)
      ? Math.max(cyber19DurationMs, new Date(scan.endTime).getTime() - new Date(scan.startTime).getTime())
      : cyber19DurationMs + (zapDurationMs || 0)
  );

  const scanStartedAt = perf.startedAt || scan?.startTime;
  const scanCompletedAt = perf.completedAt || scan?.endTime;

  // Separate CYBER-19 findings from ZAP findings to guarantee clean dataset separation
  const cyber19Findings = useMemo(() => {
    return (reportData?.vulnerabilities || []).filter(v => v.source !== 'OWASP_ZAP');
  }, [reportData]);

  // Extract ZAP alerts with full Ground-Truth Match Status
  const zapAlertsList = useMemo(() => {
    if (zapComparison?.zapAlerts && zapComparison.zapAlerts.length > 0) {
      return zapComparison.zapAlerts.map((a, idx) => ({
        id: a.alertId || `zap-${idx}`,
        pluginId: a.pluginId || 'N/A',
        alertName: a.alertName || 'ZAP Alert',
        vulnerabilityType: a.alertName || 'ZAP Alert',
        endpointUrl: a.url,
        url: a.url,
        parameter: a.parameter,
        risk: a.risk || 'Low',
        severity: a.risk || 'Low',
        confidence: a.confidence || 'Medium',
        source: 'OWASP_ZAP',
        evidence: a.evidence || 'OWASP ZAP passive/active alert',
        groundTruthMatchStatus: a.groundTruthMatchStatus || 'NOT_COVERED_BY_GROUND_TRUTH',
        matchedTestCaseId: a.matchedTestCaseId || null,
        explanation: a.explanation || (a.groundTruthMatchStatus === 'MATCHED_TO_GROUND_TRUTH'
          ? `Matched to ground-truth test case ${a.matchedTestCaseId || ''}.`
          : 'OWASP ZAP detected this alert, but the current CYBER-19 benchmark does not contain a corresponding ground-truth test case. Therefore this alert is excluded from TP/FP/FN/TN accuracy calculations.')
      }));
    }
    const zapVulns = (reportData?.vulnerabilities || []).filter(v => v.source === 'OWASP_ZAP');
    if (zapVulns.length > 0) {
      return zapVulns.map(v => {
        let alertName = v.vulnerabilityType;
        let pluginId = 'N/A';
        let risk = v.severity || 'LOW';
        let confidence = 'Medium';
        const evidenceStr = v.evidence || '';
        const m = evidenceStr.match(/\[OWASP ZAP Alert:\s*(.*?)\s*\|\s*PluginID:\s*(.*?)\s*\|\s*Risk:\s*(.*?)\s*\|\s*Confidence:\s*(.*?)\]/);
        if (m) {
          alertName = m[1];
          pluginId = m[2];
          risk = m[3];
          confidence = m[4];
        }
        return {
          id: v.id,
          pluginId,
          alertName,
          vulnerabilityType: alertName,
          endpointUrl: v.endpointUrl,
          url: v.endpointUrl,
          parameter: v.parameter,
          risk,
          severity: v.severity || risk,
          confidence,
          source: 'OWASP_ZAP',
          evidence: v.evidence || 'OWASP ZAP passive/active alert',
          groundTruthMatchStatus: v.groundTruthMatchStatus || 'NOT_COVERED_BY_GROUND_TRUTH',
          matchedTestCaseId: v.matchedTestCaseId || null,
          explanation: v.explanation || 'OWASP ZAP detected this alert, but the current CYBER-19 benchmark does not contain a corresponding ground-truth test case. Therefore this alert is excluded from TP/FP/FN/TN accuracy calculations.'
        };
      });
    }
    return (zapComparison?.traceability || [])
      .filter(t => t.zapDetected === 'YES')
      .map((t, idx) => ({
        id: `zap-${idx}`,
        pluginId: 'N/A',
        alertName: t.vulnerabilityType || t.testCaseId,
        vulnerabilityType: t.vulnerabilityType || t.testCaseId,
        endpointUrl: t.endpoint,
        url: t.endpoint,
        parameter: t.parameter,
        risk: 'LOW',
        severity: 'LOW',
        confidence: 'Medium',
        source: 'OWASP_ZAP',
        evidence: t.description || 'OWASP ZAP passive/active alert',
        groundTruthMatchStatus: t.zapClassification === 'NOT_COVERED_BY_GROUND_TRUTH' ? 'NOT_COVERED_BY_GROUND_TRUTH' : 'MATCHED_TO_GROUND_TRUTH',
        matchedTestCaseId: t.testCaseId,
        explanation: 'OWASP ZAP alert correlated during scan.'
      }));
  }, [reportData, zapComparison]);

  // Traceability items prepared with proper target naming
  const fullTraceabilityList = useMemo(() => {
    return (zapComparison?.traceability || [])
      .filter(item => !item.testCaseId?.startsWith('FINDING-') && !item.testCaseId?.startsWith('ZAP-ALERT-'))
      .map(item => {
        let targetDisplay = item.targetName;
        if (!targetDisplay) {
          if (item.testCaseId?.startsWith('TC-WG-')) targetDisplay = 'WebGoat';
          else if (item.testCaseId?.startsWith('TC-DV-')) targetDisplay = 'DVWA';
          else if (item.testCaseId?.startsWith('TC-')) targetDisplay = 'Juice Shop';
          else targetDisplay = target?.name || 'Target';
        }
        return {
          ...item,
          targetDisplay
        };
      });
  }, [zapComparison, target]);

  // Filtered traceability list
  const filteredTraceability = useMemo(() => {
    return fullTraceabilityList.filter(item => {
      // 1. Application Filter
      if (appFilter === 'JUICE_SHOP') {
        const isJuice = (item.testCaseId?.startsWith('TC-') && !item.testCaseId?.startsWith('TC-WG-') && !item.testCaseId?.startsWith('TC-DV-')) || item.targetDisplay?.toLowerCase().includes('juice');
        if (!isJuice) return false;
      } else if (appFilter === 'WEBGOAT') {
        const isWg = item.testCaseId?.startsWith('TC-WG-') || item.targetDisplay?.toLowerCase().includes('webgoat');
        if (!isWg) return false;
      } else if (appFilter === 'DVWA') {
        const isDvwa = item.testCaseId?.startsWith('TC-DV-') || item.targetDisplay?.toLowerCase().includes('dvwa');
        if (!isDvwa) return false;
      }

      // 2. Vulnerability Type Filter
      if (typeFilter !== 'ALL') {
        const vt = (item.vulnerabilityType || '').toUpperCase();
        const cat = (item.category || '').toUpperCase();
        if (typeFilter === 'SQL_INJECTION') {
          if (!vt.includes('SQL') && !cat.includes('SQL')) return false;
        } else if (typeFilter === 'XSS') {
          if (!vt.includes('XSS') && !cat.includes('XSS')) return false;
        } else if (typeFilter === 'AUTHENTICATION') {
          if (!vt.includes('AUTH') && !cat.includes('AUTH') && !vt.includes('BRUTE')) return false;
        } else if (typeFilter === 'AUTHORIZATION') {
          if (!vt.includes('ACCESS') && !vt.includes('IDOR') && !cat.includes('AUTHORIZATION')) return false;
        } else if (typeFilter === 'PATH_TRAVERSAL') {
          if (!vt.includes('TRAVERSAL') && !vt.includes('FILE') && !vt.includes('FI') && !cat.includes('TRAVERSAL')) return false;
        } else if (typeFilter === 'INFORMATION_DISCLOSURE') {
          if (!vt.includes('INFORMATION') && !cat.includes('INFORMATION')) return false;
        } else if (typeFilter === 'SECURITY_HEADERS') {
          if (!vt.includes('CSP') && !vt.includes('HSTS') && !vt.includes('HEADER') && !vt.includes('TRANSPORT') && !cat.includes('HEADER')) return false;
        } else if (typeFilter === 'OTHER') {
          const isStandard = vt.includes('SQL') || vt.includes('XSS') || vt.includes('AUTH') || vt.includes('ACCESS') || vt.includes('TRAVERSAL') || vt.includes('CSP') || vt.includes('HSTS');
          if (isStandard) return false;
        }
      }

      return true;
    });
  }, [fullTraceabilityList, appFilter, typeFilter]);

  const totalTraceabilityPages = Math.max(1, Math.ceil(filteredTraceability.length / PAGE_SIZE));
  const pagedTraceability = useMemo(() => {
    const start = (traceabilityPage - 1) * PAGE_SIZE;
    return filteredTraceability.slice(start, start + PAGE_SIZE);
  }, [filteredTraceability, traceabilityPage]);

  // Evaluated ground-truth test cases (strictly Expected = VULNERABLE or SAFE)
  const gtBenchmarkCases = useMemo(() => {
    return fullTraceabilityList.filter(t => t.expectedCondition === 'VULNERABLE' || t.expectedCondition === 'SAFE');
  }, [fullTraceabilityList]);

  // Summary counts
  const totalGtCases = zapComparison?.totalTestCases || gtBenchmarkCases.length;
  const vulnerableGtCases = zapComparison?.vulnerableCases || gtBenchmarkCases.filter(t => t.expectedCondition === 'VULNERABLE').length;
  const safeGtCases = zapComparison?.safeCases || gtBenchmarkCases.filter(t => t.expectedCondition === 'SAFE').length;

  const cTp = customMetrics?.tp ?? gtBenchmarkCases.filter(t => t.customClassification === 'TRUE_POSITIVE').length;
  const cTn = customMetrics?.tn ?? gtBenchmarkCases.filter(t => t.customClassification === 'TRUE_NEGATIVE').length;
  const cFp = customMetrics?.fp ?? gtBenchmarkCases.filter(t => t.customClassification === 'FALSE_POSITIVE').length;
  const cFn = customMetrics?.fn ?? gtBenchmarkCases.filter(t => t.customClassification === 'FALSE_NEGATIVE').length;
  const cNotEval = customMetrics?.notEvaluated ?? gtBenchmarkCases.filter(t => t.customClassification === 'NOT_EVALUATED').length;

  const zTp = zapNotExecuted ? 0 : (zapMetrics?.tp ?? gtBenchmarkCases.filter(t => t.zapClassification === 'TRUE_POSITIVE').length);
  const zTn = zapNotExecuted ? 0 : (zapMetrics?.tn ?? gtBenchmarkCases.filter(t => t.zapClassification === 'TRUE_NEGATIVE').length);
  const zFp = zapNotExecuted ? 0 : (zapMetrics?.fp ?? gtBenchmarkCases.filter(t => t.zapClassification === 'FALSE_POSITIVE').length);
  const zFn = zapNotExecuted ? 0 : (zapMetrics?.fn ?? gtBenchmarkCases.filter(t => t.zapClassification === 'FALSE_NEGATIVE').length);
  const zNotEval = zapNotExecuted ? totalGtCases : (zapMetrics?.notEvaluated ?? gtBenchmarkCases.filter(t => t.zapClassification === 'NOT_EVALUATED' || t.zapClassification === 'ZAP_UNAVAILABLE').length);

  const rawZapAlertCount = zapComparison?.totalZapAlerts ?? zapAlertsList.length;

  // Filtered CYBER-19 findings
  const filteredCyber19 = useMemo(() => {
    return cyber19Findings.filter(v => {
      if (filterSeverity === 'ALL') return true;
      return (v.severity || '').toUpperCase() === filterSeverity;
    });
  }, [cyber19Findings, filterSeverity]);

  // Pagination for CYBER-19 findings
  const totalCyber19Pages = Math.max(1, Math.ceil(filteredCyber19.length / PAGE_SIZE));
  const pagedCyber19Findings = useMemo(() => {
    const start = (cyber19Page - 1) * PAGE_SIZE;
    return filteredCyber19.slice(start, start + PAGE_SIZE);
  }, [filteredCyber19, cyber19Page]);

  // Pagination for ZAP alerts
  const totalZapPages = Math.max(1, Math.ceil(zapAlertsList.length / PAGE_SIZE));
  const pagedZapAlerts = useMemo(() => {
    const start = (zapPage - 1) * PAGE_SIZE;
    return zapAlertsList.slice(start, start + PAGE_SIZE);
  }, [zapAlertsList, zapPage]);

  // Severity counts for CYBER-19
  const cyber19Severity = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: cyber19Findings.length };
    cyber19Findings.forEach(v => {
      const s = (v.severity || '').toUpperCase();
      if (s === 'CRITICAL') counts.critical++;
      else if (s === 'HIGH') counts.high++;
      else if (s === 'MEDIUM') counts.medium++;
      else if (s === 'LOW') counts.low++;
      else counts.info++;
    });
    return counts;
  }, [cyber19Findings]);

  // Severity counts for OWASP ZAP Alert Instances (Requirement 8-D)
  const zapSeverity = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0, info: 0, total: zapAlertsList.length };
    zapAlertsList.forEach(a => {
      const s = (a.severity || a.classification || '').toUpperCase();
      if (s === 'HIGH' || s === 'CRITICAL') counts.high++;
      else if (s === 'MEDIUM' || s === 'MED') counts.medium++;
      else if (s === 'LOW') counts.low++;
      else counts.info++;
    });
    return counts;
  }, [zapAlertsList]);

  // Access Control Assessment dataset
  const accessControl = reportData?.accessControl || {};
  const accessChecks = useMemo(() => {
    return accessControl.checks || [];
  }, [accessControl]);

  const toggleRemediation = (id) => {
    setExpandedRemediationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredAccessChecks = useMemo(() => {
    return accessChecks.filter(chk => {
      if (accessControlFilter === 'VIOLATIONS') return Boolean(chk.violation);
      if (accessControlFilter === 'SECURE') return !chk.violation;
      if (accessControlFilter === 'IDOR') return Boolean(chk.idor);
      return true;
    });
  }, [accessChecks, accessControlFilter]);

  const totalAccessPages = Math.max(1, Math.ceil(filteredAccessChecks.length / PAGE_SIZE));
  const pagedAccessChecks = useMemo(() => {
    const start = (accessControlPage - 1) * PAGE_SIZE;
    return filteredAccessChecks.slice(start, start + PAGE_SIZE);
  }, [filteredAccessChecks, accessControlPage]);

  // Detection Coverage datasets
  const CANONICAL_CATEGORIES = [
    { key: 'SQL_INJECTION', label: 'SQL Injection (SQLi)' },
    { key: 'XSS', label: 'Cross-Site Scripting (Reflected & DOM XSS)' },
    { key: 'BROKEN_ACCESS_CONTROL', label: 'Broken Access Control & IDOR' },
    { key: 'AUTHENTICATION_BYPASS', label: 'Authentication Bypass & Session Management' },
    { key: 'PATH_TRAVERSAL', label: 'Path Traversal / Local File Inclusion' },
    { key: 'COMMAND_INJECTION', label: 'OS Command Injection' },
    { key: 'INFORMATION_DISCLOSURE', label: 'Information Disclosure & Sensitive Data Exposure' },
    { key: 'MISSING_CSP', label: 'Content Security Policy (CSP)' },
    { key: 'MISSING_HSTS', label: 'HTTP Strict Transport Security (HSTS)' },
    { key: 'MISSING_X_FRAME_OPTIONS', label: 'X-Frame-Options (Clickjacking)' },
    { key: 'MISSING_X_CONTENT_TYPE_OPTIONS', label: 'X-Content-Type-Options (MIME Sniffing)' },
    { key: 'MISSING_PERMISSIONS_POLICY', label: 'Permissions-Policy Header' },
    { key: 'INSECURE_TRANSPORT', label: 'Insecure Transport / Plain HTTP' }
  ];

  const detectionCoverageList = useMemo(() => {
    const rawCoverage = reportData?.coverage || zapComparison?.categoryCoverage || {};
    return CANONICAL_CATEGORIES.map(cat => {
      const serverStat = rawCoverage[cat.key];
      if (serverStat) {
        return {
          key: cat.key,
          label: cat.label,
          totalCases: serverStat.totalCases ?? 0,
          vulnerableCases: serverStat.vulnerableCases ?? 0,
          safeCases: serverStat.safeCases ?? 0,
          detectedVulnerableCases: serverStat.detectedVulnerableCases ?? serverStat.detected ?? 0,
          missedVulnerableCases: serverStat.missedVulnerableCases ?? serverStat.missed ?? 0,
          correctSafeCases: serverStat.correctSafeCases ?? 0,
          falsePositives: serverStat.falsePositives ?? 0,
          coveragePercent: serverStat.coveragePercent !== undefined ? serverStat.coveragePercent : null,
          precision: serverStat.precision !== undefined ? serverStat.precision : null,
          recall: serverStat.recall !== undefined ? serverStat.recall : null,
          f1: serverStat.f1 !== undefined ? serverStat.f1 : null
        };
      }

      // Fallback calculation from fullTraceabilityList if server report did not precompute it
      const categoryCases = fullTraceabilityList.filter(item => {
        const vt = (item.vulnerabilityType || '').toUpperCase();
        const c = (item.category || '').toUpperCase();
        if (cat.key === 'SQL_INJECTION') return vt.includes('SQL') || c.includes('SQL');
        if (cat.key === 'XSS') return vt.includes('XSS') || c.includes('XSS');
        if (cat.key === 'BROKEN_ACCESS_CONTROL') return vt.includes('ACCESS') || vt.includes('IDOR') || c.includes('ACCESS');
        if (cat.key === 'AUTHENTICATION_BYPASS') return vt.includes('AUTH') || c.includes('AUTH') || vt.includes('BRUTE');
        if (cat.key === 'PATH_TRAVERSAL') return vt.includes('TRAVERSAL') || vt.includes('FILE') || c.includes('TRAVERSAL');
        if (cat.key === 'COMMAND_INJECTION') return vt.includes('COMMAND') || c.includes('COMMAND');
        if (cat.key === 'INFORMATION_DISCLOSURE') return vt.includes('INFORMATION') || c.includes('INFORMATION');
        if (cat.key === 'MISSING_CSP') return vt.includes('CSP');
        if (cat.key === 'MISSING_HSTS') return vt.includes('HSTS');
        if (cat.key === 'MISSING_X_FRAME_OPTIONS') return vt.includes('FRAME');
        if (cat.key === 'MISSING_X_CONTENT_TYPE_OPTIONS') return vt.includes('CONTENT_TYPE') || vt.includes('MIME');
        if (cat.key === 'MISSING_PERMISSIONS_POLICY') return vt.includes('PERMISSIONS');
        if (cat.key === 'INSECURE_TRANSPORT') return vt.includes('TRANSPORT') || vt.includes('HTTPS');
        return false;
      });

      const total = categoryCases.length;
      const vulnCases = categoryCases.filter(c => c.expectedCondition === 'VULNERABLE').length;
      const safeCases = categoryCases.filter(c => c.expectedCondition === 'SAFE').length;
      const tp = categoryCases.filter(c => c.expectedCondition === 'VULNERABLE' && (c.customResult === 'DETECTED' || c.customDetected === 'YES')).length;
      const fn = categoryCases.filter(c => c.expectedCondition === 'VULNERABLE' && (c.customResult === 'NOT_DETECTED' || c.customDetected === 'NO')).length;
      const tn = categoryCases.filter(c => c.expectedCondition === 'SAFE' && (c.customResult === 'NOT_DETECTED' || c.customDetected === 'NO')).length;
      const fp = categoryCases.filter(c => c.expectedCondition === 'SAFE' && (c.customResult === 'DETECTED' || c.customDetected === 'YES')).length;

      const coveragePercent = vulnCases > 0 ? (tp * 100.0 / vulnCases) : null;
      const precision = (tp + fp) > 0 ? (tp * 100.0 / (tp + fp)) : null;
      const recall = (tp + fn) > 0 ? (tp * 100.0 / (tp + fn)) : null;
      const f1 = (precision !== null && recall !== null && (precision + recall) > 0)
        ? (2.0 * precision * recall / (precision + recall))
        : null;

      return {
        key: cat.key,
        label: cat.label,
        totalCases: total,
        vulnerableCases: vulnCases,
        safeCases,
        detectedVulnerableCases: tp,
        missedVulnerableCases: fn,
        correctSafeCases: tn,
        falsePositives: fp,
        coveragePercent,
        precision,
        recall,
        f1
      };
    });
  }, [reportData, zapComparison, fullTraceabilityList]);

  const categoriesWithCasesCount = useMemo(() => {
    return detectionCoverageList.filter(c => c.totalCases > 0).length;
  }, [detectionCoverageList]);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-cyan)' }}>
          <div className="spin" style={{ width: '28px', height: '28px', border: '3px solid rgba(56,189,248,0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%' }} />
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Security Assessment Report...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="cyber-card" style={{ padding: '2rem', border: '1px solid var(--accent-rose)', textAlign: 'center' }}>
          <AlertTriangle size={40} color="var(--accent-rose)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Report Unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'No scan data available.'}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {scans.length > 0 && (
              <select
                value={activeScanId || ''}
                onChange={(e) => setActiveScanId(Number(e.target.value))}
                className="form-select"
                style={{ maxWidth: '240px' }}
              >
                {scans.map(s => (
                  <option key={s.id} value={s.id}>Scan #{s.id} - {s.scanName}</option>
                ))}
              </select>
            )}
            <button onClick={() => onNavigateTab && onNavigateTab('new-scan')} className="btn btn-primary">
              Launch New Scan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container security-report-container" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem 1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Dossier</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Scan #{scan?.id} — {target?.name || 'Local Lab Target'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {scans.length > 1 && (
            <select
              value={activeScanId}
              onChange={(e) => setActiveScanId(Number(e.target.value))}
              className="form-select"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
            >
              {scans.map(s => (
                <option key={s.id} value={s.id}>Scan #{s.id}: {s.scanName}</option>
              ))}
            </select>
          )}

          <button onClick={handleExportJson} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
            <Download size={14} /> Export JSON
          </button>
          <button onClick={handleExportCsv} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
            <Printer size={15} /> Print / PDF Report
          </button>
        </div>
      </div>

      {/* Main Printable Dossier Card */}
      <div className="printable-report cyber-card" style={{ padding: '2.5rem', border: '1px solid var(--border-accent)', background: 'var(--bg-card)' }}>
        
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid var(--border-accent)', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.65rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
              CYBER-19 SECURITY ASSESSMENT PLATFORM
            </div>
            <h1 style={{ fontSize: '1.95rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              Web Application Security Assessment Report
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '700px', margin: 0 }}>
              Automated empirical vulnerability assessment, attack surface discovery, and comparative benchmark evaluation against authorized local target.
            </p>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className={`badge ${scan?.status === 'COMPLETED' ? 'badge-success' : scan?.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`} style={{ alignSelf: 'flex-end', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              <CheckCircle size={14} /> {scan?.status || 'COMPLETED'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Scan ID: #{scan?.id}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Report Generated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* SECTION A: TARGET INFORMATION & EXECUTION METADATA */}
        <div style={{ marginBottom: '2.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Globe size={19} /> A. Target Information & Execution Scope
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Name:</span>
                <span style={{ fontWeight: 700, color: '#ffffff' }}>{target?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target URL:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>{target?.url}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Environment / Authorization:</span>
                <span className="badge badge-success">{target?.environment || 'LOCAL_LAB'} / {target?.status || 'AUTHORIZED'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Architecture:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{target?.targetType || 'Standard Web Application'}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scan Status:</span>
                <span style={{ fontWeight: 700, color: scan?.status === 'COMPLETED' ? '#22c55e' : '#ef4444' }}>{scan?.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Started At:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{scanStartedAt ? new Date(scanStartedAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Completed At:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{scanCompletedAt ? new Date(scanCompletedAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Workflow Duration:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>{formatDuration(totalWorkflowDurationMs)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: SCAN ENGINES */}
        <div style={{ marginBottom: '2.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Server size={19} /> B. Scan Engines Evaluated
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1rem' }}>CYBER-19 Custom Engine</span>
                <span className="badge badge-cyan">Active Engine</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                Specialized vulnerability inspection pipeline featuring autonomous endpoint crawler, tautology/boolean SQLi detection, contextual reflected & DOM XSS analysis, and passive security header audit.
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Execution Duration:</span>
                <strong style={{ color: '#ffffff' }}>{formatDuration(cyber19DurationMs)}</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '10px', padding: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: '#c084fc', fontSize: '1rem' }}>OWASP ZAP 2.17.0</span>
                <span className={`badge ${zapStatus === 'COMPLETED' ? 'badge-success' : (zapReused ? 'badge-warning' : (zapNotExecuted ? 'badge-secondary' : 'badge-warning'))}`}>
                  {zapStatus === 'COMPLETED' ? 'Live Baseline' : (zapReused ? 'Reused from benchmark' : (zapNotExecuted ? 'Not executed' : zapStatus))}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                Industry-standard benchmark baseline daemon operating over localhost:8080. Sweeps attack surface using spidering and passive inspection rules to generate comparative alert telemetry.
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Execution Duration:</span>
                <strong style={{ color: '#ffffff' }}>
                  {zapNotExecuted
                    ? 'Not executed'
                    : (zapReused
                        ? 'ZAP Result: Reused from benchmark'
                        : (zapDurationMs ? formatDuration(zapDurationMs) : 'Not executed'))}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: FINDING SUMMARY */}
        <div style={{ marginBottom: '2.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <ShieldAlert size={19} /> C. Finding Summary & Severity Distribution
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 700 }}>CRITICAL</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444' }}>{cyber19Severity.critical}</div>
            </div>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#fdba74', fontWeight: 700 }}>HIGH</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f97316' }}>{cyber19Severity.high}</div>
            </div>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#fde047', fontWeight: 700 }}>MEDIUM</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#eab308' }}>{cyber19Severity.medium}</div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>LOW</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3b82f6' }}>{cyber19Severity.low}</div>
            </div>
            <div style={{ background: 'rgba(100, 116, 139, 0.1)', border: '1px solid rgba(100, 116, 139, 0.3)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>INFO</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#94a3b8' }}>{cyber19Severity.info}</div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>CYBER-19 TOTAL</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>{cyber19Severity.total}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem 1.1rem', fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Info size={16} color="var(--accent-cyan)" />
            <span>
              <strong>Dataset Separation Notice:</strong> CYBER-19 identified <strong>{cyber19Findings.length} distinct vulnerabilities</strong> across the target attack surface. Separately, OWASP ZAP recorded <strong>{rawZapAlertCount.toLocaleString()} raw alerts</strong> (including repetitive passive rule hits across instances). They are reported independently below to maintain data integrity.
            </span>
          </div>
        </div>

        {/* SECTION D: CYBER-19 CUSTOM ENGINE RESULTS */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <ShieldCheck size={19} /> D. CYBER-19 Custom Engine Findings ({filteredCyber19.length})
            </h2>

            <div className="no-print" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <Filter size={13} color="var(--text-muted)" />
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                <button
                  key={sev}
                  onClick={() => { setFilterSeverity(sev); setCyber19Page(1); }}
                  className={`btn ${filterSeverity === sev ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {pagedCyber19Findings.length === 0 ? (
            <div style={{ padding: '1.75rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', color: 'var(--text-muted)' }}>
              No CYBER-19 findings match the selected severity filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pagedCyber19Findings.map(v => {
                const isExpanded = expandedVulnId === v.id;
                const isHigh = v.severity === 'HIGH' || v.severity === 'CRITICAL';
                const isMed = v.severity === 'MEDIUM';

                return (
                  <div
                    key={v.id}
                    style={{
                      border: '1px solid ' + (isHigh ? 'rgba(239, 68, 68, 0.4)' : isMed ? 'rgba(234, 179, 8, 0.4)' : 'var(--border-subtle)'),
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.65)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      onClick={() => toggleExpand(v.id)}
                      style={{
                        padding: '0.85rem 1.1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <span className={`badge ${isHigh ? 'badge-danger' : isMed ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.72rem', minWidth: '60px', textAlign: 'center' }}>
                          {v.severity}
                        </span>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 700, color: '#ffffff', marginRight: '0.6rem' }}>{v.vulnerabilityType}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.endpointUrl}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{v.source || 'CYBER-19'}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.86rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Affected Endpoint: </span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{v.endpointUrl}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Parameter: </span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{v.parameter || 'N/A (Header/Path)'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>HTTP Status: </span>
                            <span>{v.httpStatus ? `HTTP ${v.httpStatus}` : '200 OK'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Detection Engine: </span>
                            <span>CYBER-19 Custom Engine</span>
                          </div>
                        </div>

                        {v.requestPayload && (
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>CANARY PAYLOAD:</div>
                            <pre style={{ margin: 0, padding: '0.6rem 0.85rem', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#fca5a5' }}>
                              {v.requestPayload}
                            </pre>
                          </div>
                        )}

                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>EMPIRICAL EVIDENCE & PROOF-OF-CONCEPT:</div>
                          <pre style={{ margin: 0, padding: '0.75rem 0.85rem', background: '#090d16', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#86efac', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {v.evidence}
                          </pre>
                        </div>

                        {/* Expandable Actionable Remediation Guidance (Phase 17 Requirement B & E) */}
                        {(() => {
                          const guidance = v.remediationGuidance || reportData?.remediations?.[v.vulnerabilityType] || {
                            vulnerabilityType: v.vulnerabilityType,
                            severity: v.severity || 'MEDIUM',
                            description: 'Vulnerability pattern identified during security assessment.',
                            impact: 'Potential unauthorized access or compromise of application security controls.',
                            remediation: 'Implement contextual input validation, parameterized queries, and defensive access controls.',
                            recommendedDeveloperAction: 'Review endpoint implementation and enforce defense-in-depth security principles.',
                            securityPracticeReference: 'OWASP Application Security Verification Standard (ASVS)'
                          };
                          const isRemediationExpanded = expandedRemediationIds.has(v.id);

                          return (
                            <div style={{ marginTop: '0.5rem', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.04)', overflow: 'hidden' }}>
                              <div
                                onClick={(e) => { e.stopPropagation(); toggleRemediation(v.id); }}
                                style={{
                                  padding: '0.65rem 0.85rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  background: 'rgba(56, 189, 248, 0.08)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <BookOpen size={14} color="var(--accent-cyan)" />
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Remediation Guidance
                                  </span>
                                  {guidance.cweId && (
                                    <span className="badge badge-secondary" style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)' }}>
                                      {guidance.cweId}
                                    </span>
                                  )}
                                  {guidance.owaspCategory && (
                                    <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>
                                      {guidance.owaspCategory}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)', fontSize: '0.74rem', fontWeight: 600 }}>
                                  <span>{isRemediationExpanded ? 'Hide Guidance' : 'View Remediation Guidance'}</span>
                                  {isRemediationExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                              </div>

                              {isRemediationExpanded && (
                                <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.82rem' }}>
                                  <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Description:</div>
                                    <div style={{ color: '#ffffff', lineHeight: 1.45 }}>{guidance.description}</div>
                                  </div>
                                  <div>
                                    <div style={{ color: '#fca5a5', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Impact:</div>
                                    <div style={{ color: '#fca5a5', lineHeight: 1.45 }}>{guidance.impact}</div>
                                  </div>
                                  <div>
                                    <div style={{ color: '#86efac', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Recommended Fix:</div>
                                    <div style={{ color: '#86efac', lineHeight: 1.45, background: 'rgba(34, 197, 94, 0.08)', padding: '0.5rem 0.65rem', borderRadius: '5px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                      {guidance.remediation}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Recommended Developer Action:</div>
                                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>{guidance.recommendedDeveloperAction}</div>
                                  </div>
                                  {guidance.securityPracticeReference && (
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <ShieldCheck size={13} color="var(--accent-cyan)" />
                                      <span>Security Standard Reference: <strong style={{ color: '#ffffff' }}>{guidance.securityPracticeReference}</strong></span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalCyber19Pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '6px' }}>
                  <button
                    disabled={cyber19Page <= 1}
                    onClick={() => setCyber19Page(p => Math.max(1, p - 1))}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  >
                    <ChevronLeft size={13} /> Previous
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Page {cyber19Page} of {totalCyber19Pages} (Showing {Math.min(filteredCyber19.length, (cyber19Page - 1) * PAGE_SIZE + 1)}–{Math.min(filteredCyber19.length, cyber19Page * PAGE_SIZE)} of {filteredCyber19.length})
                  </span>
                  <button
                    disabled={cyber19Page >= totalCyber19Pages}
                    onClick={() => setCyber19Page(p => Math.min(totalCyber19Pages, p + 1))}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  >
                    Next <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION E: AUTOMATED ACCESS CONTROL & IDOR ASSESSMENT */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Lock size={19} /> E. Automated Access Control & IDOR Assessment
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Module: <strong style={{ color: 'var(--accent-cyan)' }}>CYBER-19 Access Control Engine</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem' }}>
            {/* Educational Methodology Box */}
            <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
                <Shield size={16} /> Access Control Evaluation Methodology
              </div>
              <div>
                Controlled non-destructive HTTP differential probing against authorized targets. Evaluates unauthenticated access to restricted administrative, telemetry and actuator endpoints, object-level authorization (IDOR), and sensitivity boundaries. False 200s (such as SPA index fallbacks and redirect login pages) are strictly filtered out using content-type and payload signature verification.
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>CHECKS PERFORMED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>{accessControl.checksPerformed || accessChecks.length}</div>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>ENDPOINTS TESTED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>{accessControl.endpointsTested || 0}</div>
              </div>
              <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#fde047', fontWeight: 700 }}>PROTECTED ENDPOINTS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#eab308' }}>{accessControl.protectedEndpoints || 0}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: 700 }}>AUTHORIZATION VIOLATIONS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ef4444' }}>{accessControl.violationsFound || 0}</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#d8b4fe', fontWeight: 700 }}>POTENTIAL IDOR CASES</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#c084fc' }}>{accessChecks.filter(c => c.idor).length}</div>
              </div>
            </div>

            {/* Access Control Table with Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                Access Control Probe Execution Telemetry ({filteredAccessChecks.length} Records)
              </div>
              <div className="no-print" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <Filter size={13} color="var(--text-muted)" />
                {['ALL', 'VIOLATIONS', 'SECURE'].map(flt => (
                  <button
                    key={flt}
                    onClick={() => { setAccessControlFilter(flt); setAccessControlPage(1); }}
                    className={`btn ${accessControlFilter === flt ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            {pagedAccessChecks.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.75rem', fontSize: '0.86rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                {accessChecks.length === 0
                  ? 'No access control probes were executed for this scan. Run an authorized scan to assess authorization boundaries.'
                  : 'No access control checks match the selected filter.'}
              </div>
            ) : (
              <div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Endpoint & Method</th>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Request Context</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>Auth State</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>Expected</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>Actual Status</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>Evaluation Result</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>Severity</th>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Evidence & Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedAccessChecks.map((chk, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                            <span style={{ color: '#fde047', marginRight: '0.35rem' }}>{chk.httpMethod || 'GET'}</span>
                            {chk.endpoint}
                            {chk.parameter ? <span style={{ color: '#fdba74', display: 'block', fontSize: '0.72rem' }}>param: {chk.parameter}</span> : null}
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.76rem', maxWidth: '200px' }}>
                            {chk.requestContext || 'Access probe'}
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontSize: '0.74rem' }}>
                            <span className="badge badge-secondary">{chk.authorizationState || 'UNAUTHENTICATED'}</span>
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {chk.expectedAccessState || '401/403'}
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            <span className={`badge ${chk.actualHttpStatus === 200 && chk.violation ? 'badge-danger' : (chk.actualHttpStatus === 401 || chk.actualHttpStatus === 403 ? 'badge-success' : 'badge-info')}`}>
                              HTTP {chk.actualHttpStatus || 0}
                            </span>
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                            {chk.violation ? (
                              <span className="badge badge-danger" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 800 }}>
                                <AlertTriangle size={11} /> VIOLATION
                              </span>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 800 }}>
                                <CheckCircle size={11} /> SECURE
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                            <span className={`badge ${chk.severity === 'HIGH' || chk.severity === 'CRITICAL' ? 'badge-danger' : (chk.severity === 'MEDIUM' ? 'badge-warning' : 'badge-info')}`} style={{ fontSize: '0.68rem' }}>
                              {chk.severity || 'INFO'}
                            </span>
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.75rem', color: chk.violation ? '#fca5a5' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', maxWidth: '280px', wordBreak: 'break-all' }}>
                            {chk.evidence}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Access Control Pagination */}
                {totalAccessPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <button
                      disabled={accessControlPage <= 1}
                      onClick={() => setAccessControlPage(p => Math.max(1, p - 1))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      <ChevronLeft size={13} /> Previous
                    </button>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Page {accessControlPage} of {totalAccessPages} (Showing {Math.min(filteredAccessChecks.length, (accessControlPage - 1) * PAGE_SIZE + 1)}–{Math.min(filteredAccessChecks.length, accessControlPage * PAGE_SIZE)} of {filteredAccessChecks.length})
                    </span>
                    <button
                      disabled={accessControlPage >= totalAccessPages}
                      onClick={() => setAccessControlPage(p => Math.min(totalAccessPages, p + 1))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Next <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION F: OWASP ZAP RESULTS */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Zap size={19} /> F. OWASP ZAP Baseline Results ({rawZapAlertCount.toLocaleString()} Alert Instances)
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Daemon Status: <strong style={{ color: zapStatus === 'COMPLETED' ? '#22c55e' : (zapReused ? '#f59e0b' : '#94a3b8') }}>
                {zapReused ? 'Reused from benchmark' : (zapNotExecuted ? 'Not executed' : zapStatus)}
              </strong>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.86rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>ZAP Reference Scan: </span><span style={{ fontFamily: 'var(--font-mono)' }}>Scan #{scan?.zapScanId || zapComparison?.zapScanId || 'N/A'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Measured ZAP Duration: </span><strong>
                {zapNotExecuted ? 'Not executed' : (zapReused ? 'Reused from benchmark' : (zapDurationMs ? formatDuration(zapDurationMs) : 'Not executed'))}
              </strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Total Alert Instances: </span><span className="badge badge-purple">{rawZapAlertCount.toLocaleString()}</span></div>
            </div>

            {/* ZAP Alert Instance Severity Breakdown (Requirement 8-D) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: 700 }}>HIGH</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444' }}>{zapSeverity.high}</div>
              </div>
              <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#fde047', fontWeight: 700 }}>MEDIUM</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#eab308' }}>{zapSeverity.medium}</div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#93c5fd', fontWeight: 700 }}>LOW</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6' }}>{zapSeverity.low}</div>
              </div>
              <div style={{ background: 'rgba(100, 116, 139, 0.08)', border: '1px solid rgba(100, 116, 139, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 700 }}>INFORMATIONAL</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#94a3b8' }}>{zapSeverity.info}</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#d8b4fe', fontWeight: 700 }}>TOTAL ALERTS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#c084fc' }}>{rawZapAlertCount.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', background: 'rgba(0,0,0,0.25)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
              <strong>Notice on ZAP Alert Count:</strong> OWASP ZAP logs individual passive alert instances per HTTP request/response. Raw alert counts frequently include duplicate rule triggers across hundreds of static assets and parameters. In the benchmark evaluation below, ZAP findings are correlated against canonical ground-truth test cases.
            </div>

            {pagedZapAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.86rem' }}>
                {zapOnline ? 'No alerts reported by ZAP for this target scope.' : 'ZAP daemon was offline during this scan. Custom CYBER-19 results evaluated.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pagedZapAlerts.map((alert, idx) => {
                  const isMatched = alert.groundTruthMatchStatus === 'MATCHED_TO_GROUND_TRUTH';
                  const riskLevel = (alert.risk || alert.severity || 'LOW').toUpperCase();
                  const riskBadgeClass = riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'badge-danger' : (riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-info');

                  return (
                    <div key={alert.id || idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
                      {/* Top Meta Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                            Plugin #{alert.pluginId && alert.pluginId !== 'N/A' ? alert.pluginId : (alert.id || 'N/A')}
                          </span>
                          <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>
                            {alert.alertName || alert.vulnerabilityType}
                          </span>
                          <span className={`badge ${riskBadgeClass}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                            Risk: {riskLevel}
                          </span>
                          <span className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>
                            Confidence: {alert.confidence || 'Medium'}
                          </span>
                        </div>

                        {/* Ground-Truth Match Status Badge */}
                        <div>
                          {isMatched ? (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                              <CheckCircle size={13} /> MATCHED TO GROUND TRUTH {alert.matchedTestCaseId ? `(${alert.matchedTestCaseId})` : ''}
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid #94a3b8', color: '#cbd5e1' }}>
                              <Info size={13} /> NOT COVERED BY CURRENT BENCHMARK
                            </span>
                          )}
                        </div>
                      </div>

                      {/* URL and Parameter */}
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-cyan)', marginBottom: '0.45rem', wordBreak: 'break-all' }}>
                        <strong>Target URL:</strong> {alert.url || alert.endpointUrl || alert.endpoint || '/'} {alert.parameter ? <span style={{ color: '#fde047' }}>[Parameter: {alert.parameter}]</span> : ''}
                      </div>

                      {/* Evidence Snippet */}
                      {alert.evidence && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', padding: '0.6rem 0.75rem', borderRadius: '5px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: !isMatched ? '0.5rem' : 0 }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>EVIDENCE: </span>
                          {alert.evidence}
                        </div>
                      )}

                      {/* Explanatory Callout for Uncovered Alerts */}
                      {!isMatched && (
                        <div style={{ fontSize: '0.77rem', color: '#cbd5e1', background: 'rgba(100, 116, 139, 0.12)', borderLeft: '3px solid #94a3b8', padding: '0.5rem 0.75rem', borderRadius: '0 5px 5px 0', lineHeight: 1.45 }}>
                          <strong style={{ color: '#e2e8f0' }}>Not covered by current benchmark:</strong> OWASP ZAP detected this alert, but the current CYBER-19 benchmark does not contain a corresponding ground-truth test case. Therefore this alert is excluded from TP/FP/FN/TN accuracy calculations. (Not classified as False Positive).
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ZAP Pagination */}
                {totalZapPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <button
                      disabled={zapPage <= 1}
                      onClick={() => setZapPage(p => Math.max(1, p - 1))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      <ChevronLeft size={13} /> Previous
                    </button>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Page {zapPage} of {totalZapPages} (Showing {Math.min(zapAlertsList.length, (zapPage - 1) * PAGE_SIZE + 1)}–{Math.min(zapAlertsList.length, zapPage * PAGE_SIZE)} of {zapAlertsList.length})
                    </span>
                    <button
                      disabled={zapPage >= totalZapPages}
                      onClick={() => setZapPage(p => Math.min(totalZapPages, p + 1))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Next <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION G: DETECTION COVERAGE BY VULNERABILITY CATEGORY */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Layers size={19} /> G. Detection Coverage by Vulnerability Category
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Metric: <strong style={{ color: '#86efac' }}>Empirical Ground-Truth Detection Coverage</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem' }}>
            {/* Educational Distinction Banner: Test-Case Coverage vs Detection Coverage */}
            <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '0.45rem' }}>
                <Info size={16} /> Understanding Coverage Metrics: Test-Case Coverage vs. Detection Coverage
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem', fontSize: '0.84rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.75rem' }}>
                  <strong style={{ color: 'var(--accent-cyan)' }}>Test-Case Coverage (Benchmark Scope):</strong>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Measures which vulnerability categories are represented in the test suite ({categoriesWithCasesCount} / {CANONICAL_CATEGORIES.length} categories tested on this target). Represents scenario diversity, not scanner accuracy.
                  </p>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.75rem' }}>
                  <strong style={{ color: '#86efac' }}>Detection Coverage (Scanner Effectiveness):</strong>
                  <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Measures the percentage of known vulnerable ground-truth test cases genuinely detected by CYBER-19 (TP / Vulnerable Cases * 100%). Categories with no applicable vulnerable cases display <strong>N/A</strong> instead of 0%.
                  </p>
                </div>
              </div>
            </div>

            {/* Metric Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>CATEGORIES ASSESSED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>{CANONICAL_CATEGORIES.length}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: 700 }}>TOTAL VULNERABLE CASES</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ef4444' }}>{vulnerableGtCases}</div>
              </div>
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#86efac', fontWeight: 700 }}>VULNERABLE DETECTED (TP)</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#22c55e' }}>{cTp}</div>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>OVERALL DETECTION COVERAGE</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                  {vulnerableGtCases > 0 ? `${((cTp / vulnerableGtCases) * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Vulnerability Category</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Test Cases</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Vulnerable</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Safe</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Detected (TP)</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Missed (FN)</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Detection Coverage</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Precision</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Recall</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>F1 Score</th>
                  </tr>
                </thead>
                <tbody>
                  {detectionCoverageList.map((item, idx) => {
                    const hasCases = item.totalCases > 0;
                    const hasVuln = item.vulnerableCases > 0;
                    const covFormatted = (hasVuln && item.coveragePercent !== null) ? `${item.coveragePercent.toFixed(1)}%` : 'N/A';
                    const precFormatted = item.precision !== null ? `${item.precision.toFixed(1)}%` : 'N/A';
                    const recFormatted = item.recall !== null ? `${item.recall.toFixed(1)}%` : 'N/A';
                    const f1Formatted = item.f1 !== null ? `${item.f1.toFixed(1)}%` : 'N/A';

                    return (
                      <tr key={item.key} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontWeight: 700, color: hasCases ? '#ffffff' : 'var(--text-muted)' }}>
                          {item.label}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{item.totalCases}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: item.vulnerableCases > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: item.vulnerableCases > 0 ? 700 : 400 }}>
                          {item.vulnerableCases}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: item.safeCases > 0 ? '#22c55e' : 'var(--text-muted)', fontWeight: item.safeCases > 0 ? 700 : 400 }}>
                          {item.safeCases}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: item.detectedVulnerableCases > 0 ? '#86efac' : 'var(--text-muted)', fontWeight: item.detectedVulnerableCases > 0 ? 700 : 400 }}>
                          {item.detectedVulnerableCases}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: item.missedVulnerableCases > 0 ? '#fca5a5' : 'var(--text-muted)' }}>
                          {item.missedVulnerableCases}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: hasVuln ? (item.coveragePercent >= 75 ? '#86efac' : (item.coveragePercent >= 50 ? '#fde047' : '#fca5a5')) : 'var(--text-muted)' }}>
                          {covFormatted}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: precFormatted !== 'N/A' ? '#ffffff' : 'var(--text-muted)' }}>
                          {precFormatted}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: recFormatted !== 'N/A' ? '#ffffff' : 'var(--text-muted)' }}>
                          {recFormatted}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: f1Formatted !== 'N/A' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                          {f1Formatted}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '0.55rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              * N/A indicates no applicable vulnerable test cases in the configured ground-truth suite for this target. Metrics are mathematically computed without fabrication.
            </div>
          </div>
        </div>

        {/* SECTION H: GROUND-TRUTH TEST CASE TRACEABILITY & BENCHMARK EVALUATION */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Award size={19} /> H. Ground-Truth Test Case Traceability & Benchmark Evaluation
          </h2>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
            {/* Educational Explanations Banner (Part 4) */}
            <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '0.45rem' }}>
                <Info size={16} /> Ground-Truth Evaluation Methodology & Principles
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>
                Ground-truth test cases are predefined security scenarios with a known expected result. They are used to objectively evaluate CYBER-19 and OWASP ZAP.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '5px', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}>
                  <strong style={{ color: '#86efac' }}>VULNERABLE + DETECTED</strong> = <span style={{ color: '#22c55e', fontWeight: 800 }}>TRUE POSITIVE</span>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '5px', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}>
                  <strong style={{ color: '#fca5a5' }}>VULNERABLE + NOT DETECTED</strong> = <span style={{ color: '#ef4444', fontWeight: 800 }}>FALSE NEGATIVE</span>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '5px', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}>
                  <strong style={{ color: '#fca5a5' }}>SAFE + DETECTED</strong> = <span style={{ color: '#ef4444', fontWeight: 800 }}>FALSE POSITIVE</span>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '5px', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}>
                  <strong style={{ color: '#86efac' }}>SAFE + NOT DETECTED</strong> = <span style={{ color: '#22c55e', fontWeight: 800 }}>TRUE NEGATIVE</span>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                <strong>Non-Benchmark Alerts:</strong> ZAP alerts without a corresponding ground-truth case are shown as NOT COVERED and are excluded from benchmark accuracy calculations.
              </div>
            </div>

            {/* Summary Cards Grid (Part 6) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                Benchmark Confusion Matrix Summary
              </div>

              {/* Suite Totals Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL TEST CASES</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>{totalGtCases}</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: 700 }}>VULNERABLE CASES</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ef4444' }}>{vulnerableGtCases}</div>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '6px', padding: '0.65rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#86efac', fontWeight: 700 }}>SAFE NEGATIVE CASES</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#22c55e' }}>{safeGtCases}</div>
                </div>
              </div>

              {/* CYBER-19 Breakdown Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>CYBER-19 TP</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#86efac' }}>{cTp}</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>CYBER-19 TN</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#86efac' }}>{cTn}</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>CYBER-19 FP</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fca5a5' }}>{cFp}</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>CYBER-19 FN</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fca5a5' }}>{cFn}</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>CYBER-19 NOT EVAL</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#94a3b8' }}>{cNotEval}</div>
                </div>
              </div>

              {/* OWASP ZAP Breakdown Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 700 }}>ZAP TP</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#86efac' }}>{zTp}</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 700 }}>ZAP TN</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#86efac' }}>{zTn}</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 700 }}>ZAP FP</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fca5a5' }}>{zFp}</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 700 }}>ZAP FN</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fca5a5' }}>{zFn}</div>
                </div>
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '6px', padding: '0.55rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 700 }}>ZAP NOT EVAL</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#94a3b8' }}>{zNotEval}</div>
                </div>
              </div>
            </div>

            {/* Accuracy Metrics Table (Part 7) */}
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Scanner Engine</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Duration</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>TP</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>FP</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>FN</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>TN</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Precision</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Recall</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>F1 Score</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>FPR</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(56, 189, 248, 0.05)' }}>
                    <td style={{ textAlign: 'left', padding: '0.6rem 0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      CYBER-19 Custom Engine
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)' }}>{formatShortDuration(customMetrics?.durationMs || cyber19DurationMs)}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#86efac', fontWeight: 700 }}>{cTp}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#fca5a5' }}>{cFp}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#fca5a5' }}>{cFn}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#86efac' }}>{cTn}</td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>
                      {(() => {
                        const den = cTp + cFp;
                        return den > 0 ? `${((cTp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>
                      {(() => {
                        const den = cTp + cFn;
                        return den > 0 ? `${((cTp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {(() => {
                        const den = (2 * cTp) + cFp + cFn;
                        return den > 0 ? `${((2 * cTp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      {(() => {
                        const den = cFp + cTn;
                        return den > 0 ? `${((cFp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#86efac' }}>
                      {(() => {
                        const den = cTp + cTn + cFp + cFn;
                        return den > 0 ? `${(((cTp + cTn) / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(168, 85, 247, 0.05)' }}>
                    <td style={{ textAlign: 'left', padding: '0.6rem 0.8rem', fontWeight: 700, color: '#c084fc' }}>
                      OWASP ZAP Baseline
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)' }}>
                      {zapNotExecuted ? 'Not executed' : (zapReused ? 'Reused' : (zapDurationMs ? formatShortDuration(zapDurationMs) : 'N/A'))}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#86efac', fontWeight: 700 }}>{zapNotExecuted ? 0 : zTp}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#fca5a5' }}>{zapNotExecuted ? 0 : zFp}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#fca5a5' }}>{zapNotExecuted ? 0 : zFn}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#86efac' }}>{zapNotExecuted ? 0 : zTn}</td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>
                      {(() => {
                        if (zapNotExecuted) return 'N/A';
                        const den = zTp + zFp;
                        return den > 0 ? `${((zTp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700 }}>
                      {(() => {
                        if (zapNotExecuted) return 'N/A';
                        const den = zTp + zFn;
                        return den > 0 ? `${((zTp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 800, color: '#c084fc' }}>
                      {(() => {
                        if (zapNotExecuted) return 'N/A';
                        const den = (2 * zTp) + zFp + zFn;
                        return den > 0 ? `${((2 * zTp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      {(() => {
                        if (zapNotExecuted) return 'N/A';
                        const den = zFp + zTn;
                        return den > 0 ? `${((zFp / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#86efac' }}>
                      {(() => {
                        if (zapNotExecuted) return 'N/A';
                        const den = zTp + zTn + zFp + zFn;
                        return den > 0 ? `${(((zTp + zTn) / den) * 100).toFixed(1)}%` : 'N/A';
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '0.45rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                * Metrics are calculated only from ground-truth cases with Expected = VULNERABLE or SAFE. NOT_EVALUATED / NOT_COVERED records are excluded.
              </div>
            </div>

            {/* Traceability Table Header & Filters (Part 8) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}>
              <div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  Ground-Truth Test Case Traceability Table ({filteredTraceability.length} Cases)
                </h4>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Evaluates each benchmark test case individually for CYBER-19 and OWASP ZAP.
                </div>
              </div>

              {/* Filtering Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Application Filter */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.15rem' }}>
                  <button
                    onClick={() => { setAppFilter('ALL'); setTraceabilityPage(1); }}
                    style={{
                      border: 'none',
                      background: appFilter === 'ALL' ? 'var(--accent-cyan)' : 'transparent',
                      color: appFilter === 'ALL' ? '#0f172a' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setAppFilter('JUICE_SHOP'); setTraceabilityPage(1); }}
                    style={{
                      border: 'none',
                      background: appFilter === 'JUICE_SHOP' ? 'var(--accent-cyan)' : 'transparent',
                      color: appFilter === 'JUICE_SHOP' ? '#0f172a' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Juice Shop
                  </button>
                  <button
                    onClick={() => { setAppFilter('WEBGOAT'); setTraceabilityPage(1); }}
                    style={{
                      border: 'none',
                      background: appFilter === 'WEBGOAT' ? 'var(--accent-cyan)' : 'transparent',
                      color: appFilter === 'WEBGOAT' ? '#0f172a' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    WebGoat
                  </button>
                  <button
                    onClick={() => { setAppFilter('DVWA'); setTraceabilityPage(1); }}
                    style={{
                      border: 'none',
                      background: appFilter === 'DVWA' ? 'var(--accent-cyan)' : 'transparent',
                      color: appFilter === 'DVWA' ? '#0f172a' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    DVWA
                  </button>
                </div>

                {/* Vulnerability Type Dropdown */}
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setTraceabilityPage(1); }}
                  style={{
                    background: '#090d16',
                    color: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.6rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Vulnerability Types</option>
                  <option value="SQL_INJECTION">SQL Injection</option>
                  <option value="XSS">XSS (Reflected / DOM)</option>
                  <option value="AUTHENTICATION">Authentication Bypass</option>
                  <option value="AUTHORIZATION">Broken Access Control</option>
                  <option value="PATH_TRAVERSAL">Path Traversal</option>
                  <option value="INFORMATION_DISCLOSURE">Information Disclosure</option>
                  <option value="SECURITY_HEADERS">Security Headers</option>
                  <option value="OTHER">Other Categories</option>
                </select>
              </div>
            </div>

            {/* Traceability Table (Part 5) */}
            {pagedTraceability.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.86rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                No ground-truth benchmark cases match the selected filters.
              </div>
            ) : (
              <div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Test Case</th>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Target</th>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Endpoint / Parameter</th>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem' }}>Vulnerability</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>Expected</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>CYBER-19</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>CYBER-19 Classification</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>OWASP ZAP</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem' }}>ZAP Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTraceability.map((item, idx) => {
                        const isVulnerable = item.expectedCondition === 'VULNERABLE';
                        const isSafe = item.expectedCondition === 'SAFE';

                        // CYBER-19 Detection & Classification
                        const customDetected = item.customResult === 'DETECTED' || item.customDetected === 'YES';
                        const cClass = item.customClassification || (isVulnerable ? (customDetected ? 'TRUE_POSITIVE' : 'FALSE_NEGATIVE') : (isSafe ? (customDetected ? 'FALSE_POSITIVE' : 'TRUE_NEGATIVE') : 'NOT_EVALUATED'));

                        // OWASP ZAP Detection & Classification
                        const zapExecuted = !zapNotExecuted && item.zapResult !== 'NOT_EVALUATED' && item.zapDetected !== 'N/A';
                        const zapDetected = zapExecuted && (item.zapResult === 'DETECTED' || item.zapDetected === 'YES');
                        const zClass = item.zapClassification || (zapExecuted ? (isVulnerable ? (zapDetected ? 'TRUE_POSITIVE' : 'FALSE_NEGATIVE') : (isSafe ? (zapDetected ? 'FALSE_POSITIVE' : 'TRUE_NEGATIVE') : 'NOT_EVALUATED')) : 'NOT_EVALUATED');

                        const renderClassificationBadge = (cls) => {
                          if (cls === 'TRUE_POSITIVE') {
                            return <span className="badge badge-success" style={{ fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={11} /> TRUE POSITIVE</span>;
                          }
                          if (cls === 'TRUE_NEGATIVE') {
                            return <span className="badge badge-success" style={{ fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={11} /> TRUE NEGATIVE</span>;
                          }
                          if (cls === 'FALSE_POSITIVE') {
                            return <span className="badge badge-danger" style={{ fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={11} /> FALSE POSITIVE</span>;
                          }
                          if (cls === 'FALSE_NEGATIVE') {
                            return <span className="badge badge-danger" style={{ fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={11} /> FALSE NEGATIVE</span>;
                          }
                          if (cls === 'NOT_COVERED_BY_GROUND_TRUTH' || cls === 'NOT_COVERED') {
                            return <span className="badge badge-secondary" style={{ fontSize: '0.68rem', border: '1px solid #94a3b8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Info size={11} /> NOT COVERED</span>;
                          }
                          return <span className="badge badge-secondary" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Info size={11} /> NOT EVALUATED</span>;
                        };

                        return (
                          <tr key={item.testCaseId || idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.01)' }}>
                            {/* 1. Test Case */}
                            <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                              {item.testCaseId}
                            </td>

                            {/* 2. Target */}
                            <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              {item.targetDisplay}
                            </td>

                            {/* 3. Endpoint / Parameter */}
                            <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', maxWidth: '240px', wordBreak: 'break-all' }}>
                              {item.endpoint} {item.parameter ? <span style={{ color: '#fde047' }}>[{item.parameter}]</span> : ''}
                            </td>

                            {/* 4. Vulnerability */}
                            <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              {item.vulnerabilityType}
                            </td>

                            {/* 5. Expected */}
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                              {isVulnerable ? (
                                <span className="badge badge-danger" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <AlertTriangle size={11} /> VULNERABLE
                                </span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <ShieldCheck size={11} /> SAFE
                                </span>
                              )}
                            </td>

                            {/* 6. CYBER-19 */}
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                              <span className={`badge ${customDetected ? 'badge-cyan' : 'badge-secondary'}`} style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                {customDetected ? <Check size={11} /> : <X size={11} />}
                                {customDetected ? 'DETECTED' : 'NOT_DETECTED'}
                              </span>
                            </td>

                            {/* 7. CYBER-19 Classification */}
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                              {renderClassificationBadge(cClass)}
                            </td>

                            {/* 8. OWASP ZAP */}
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                              {zapExecuted ? (
                                <span className={`badge ${zapDetected ? 'badge-purple' : 'badge-secondary'}`} style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  {zapDetected ? <Check size={11} /> : <X size={11} />}
                                  {zapDetected ? 'DETECTED' : 'NOT_DETECTED'}
                                </span>
                              ) : (
                                <span className="badge badge-secondary" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Info size={11} /> NOT EVALUATED
                                </span>
                              )}
                            </td>

                            {/* 9. ZAP Classification */}
                            <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                              {renderClassificationBadge(zClass)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Traceability Table Pagination */}
                {totalTraceabilityPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '6px' }}>
                    <button
                      disabled={traceabilityPage <= 1}
                      onClick={() => setTraceabilityPage(p => Math.max(1, p - 1))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      <ChevronLeft size={13} /> Previous
                    </button>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Page {traceabilityPage} of {totalTraceabilityPages} (Showing {Math.min(filteredTraceability.length, (traceabilityPage - 1) * PAGE_SIZE + 1)}–{Math.min(filteredTraceability.length, traceabilityPage * PAGE_SIZE)} of {filteredTraceability.length} benchmark test cases)
                    </span>
                    <button
                      disabled={traceabilityPage >= totalTraceabilityPages}
                      onClick={() => setTraceabilityPage(p => Math.min(totalTraceabilityPages, p + 1))}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Next <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Academic Signoff Disclaimer (Part 14) */}
            <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '0.65rem 0.85rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
              <strong>Evaluation Disclaimer:</strong> Accuracy metrics reflect empirical results measured against the configured ground-truth test suite for this target. The platform does not claim universal detection accuracy on arbitrary untested applications. Ground-truth evaluation measures performance only for predefined test cases. ZAP alerts without corresponding ground truth are reported separately and excluded from benchmark confusion-matrix metrics.
            </div>
          </div>
        </div>

        {/* SECTION I: PERFORMANCE & TIMING BREAKDOWN */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Clock size={19} /> I. Engine Performance & Timing Breakdown
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>CYBER-19 Core Duration</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {formatDuration(cyber19DurationMs)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Crawl, SQLi, XSS & Header probes</div>
            </div>

            <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '10px', padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Access Control Probes</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {accessControlDurationMs !== null ? formatDuration(accessControlDurationMs) : 'Included in core'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Authorization & IDOR testing</div>
            </div>

            <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '10px', padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>OWASP ZAP Duration</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: zapNotExecuted ? '#94a3b8' : (zapReused ? '#f59e0b' : '#c084fc'), fontFamily: 'var(--font-mono)' }}>
                {zapNotExecuted
                  ? 'Not executed'
                  : (zapReused
                      ? 'Reused from benchmark'
                      : (zapDurationMs ? formatDuration(zapDurationMs) : 'Not executed'))}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {zapNotExecuted ? 'ZAP was not run for this scan' : (zapReused ? 'Baseline linked from target benchmark' : 'Spider sweep & alert retrieval')}
              </div>
            </div>

            <div style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '10px', padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Benchmark Evaluation</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {benchmarkDurationMs ? formatDuration(benchmarkDurationMs) : 'Measured'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Ground-truth matrix computation</div>
            </div>

            <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '10px', padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Overall Workflow Duration</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#86efac', fontFamily: 'var(--font-mono)' }}>
                {formatDuration(totalWorkflowDurationMs)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Authoritative backend start to finish</div>
            </div>
          </div>
        </div>

        {/* SECTION J: EVIDENCE-BASED REMEDIATION RECOMMENDATIONS */}
        <div style={{ marginBottom: '2.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <CheckCircle size={19} /> J. Evidence-Based Remediation Recommendations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.92rem' }}>{rec.category}</span>
                  <span className={`badge ${rec.severity === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>{rec.severity}</span>
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {rec.recommendation}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Standard Reference: {rec.reference}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION K: METHODOLOGY & TECHNICAL LIMITATIONS */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Server size={19} /> K. Testing Methodology & Limitations
          </h2>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
            <li>Benchmarking metrics reflect comparative performance on standardized ground-truth vulnerable endpoints under controlled conditions.</li>
          </ul>
        </div>

        {/* Academic Signoff Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>CYBER-19 Capstone Project — Automated Web Vulnerability Assessment Platform</div>
          <div>All metrics empirically measured from local laboratory execution (Port 3000 / 8080)</div>
        </div>
      </div>
    </div>
  );
}
