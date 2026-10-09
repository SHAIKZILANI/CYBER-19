import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import DashboardView from './components/DashboardView';
import TargetApplicationsView from './components/TargetApplicationsView';
import NewScanView from './components/NewScanView';
import LiveScanModal from './components/LiveScanModal';
import VulnerabilityFindingsView from './components/VulnerabilityFindingsView';
import ScanHistoryView from './components/ScanHistoryView';
import EvaluationMetricsView from './components/EvaluationMetricsView';
import ResearchReportsView from './components/ResearchReportsView';
import SecurityAssessmentReportView from './components/SecurityAssessmentReportView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ScanAnyUrlView from './components/ScanAnyUrlView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLiveScan, setActiveLiveScan] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  // Targets state
  const [targets, setTargets] = useState([
    { id: 1, name: 'OWASP Juice Shop', url: 'http://localhost:3000', environment: 'LOCAL_NODE', status: 'AUTHORIZED' },
    { id: 2, name: 'Google Gruyere Lab', url: 'https://google-gruyere.appspot.com', environment: 'AUTHORIZED_LAB', status: 'AUTHORIZED' },
    { id: 3, name: 'Staging Auth API', url: 'http://localhost:8080/auth', environment: 'LOCAL_NODE', status: 'AUTHORIZED' }
  ]);

  // Research metrics state
  const [metrics, setMetrics] = useState({
    totalTestCases: 6,
    truePositives: 2,
    falsePositives: 1,
    falseNegatives: 1,
    trueNegatives: 2,
    detectionCoveragePercentage: 66.7,
    falsePositiveRatePercentage: 33.3,
    falseNegativeRatePercentage: 33.3
  });

  // Test cases ground truth state
  const [testCases, setTestCases] = useState([
    { testCaseId: 'TC-001', targetName: 'OWASP Juice Shop', vulnerabilityType: 'SQL_INJECTION', expectedCondition: 'VULNERABLE', actualResult: 'DETECTED', verificationStatus: 'CONFIRMED', classification: 'TRUE_POSITIVE' },
    { testCaseId: 'TC-002', targetName: 'OWASP Juice Shop', vulnerabilityType: 'SQL_INJECTION', expectedCondition: 'VULNERABLE', actualResult: 'DETECTED', verificationStatus: 'CONFIRMED', classification: 'TRUE_POSITIVE' },
    { testCaseId: 'TC-003', targetName: 'OWASP Juice Shop', vulnerabilityType: 'SQL_INJECTION', expectedCondition: 'SAFE', actualResult: 'NOT_DETECTED', verificationStatus: 'CONFIRMED', classification: 'TRUE_NEGATIVE' },
    { testCaseId: 'TC-004', targetName: 'OWASP Juice Shop', vulnerabilityType: 'SQL_INJECTION', expectedCondition: 'SAFE', actualResult: 'NOT_DETECTED', verificationStatus: 'CONFIRMED', classification: 'TRUE_NEGATIVE' },
    { testCaseId: 'TC-005', targetName: 'OWASP Juice Shop', vulnerabilityType: 'XSS', expectedCondition: 'VULNERABLE', actualResult: 'NOT_DETECTED', verificationStatus: 'CONFIRMED', classification: 'FALSE_NEGATIVE' },
    { testCaseId: 'TC-006', targetName: 'OWASP Juice Shop', vulnerabilityType: 'SQL_INJECTION', expectedCondition: 'SAFE', actualResult: 'DETECTED', verificationStatus: 'CONFIRMED', classification: 'FALSE_POSITIVE' }
  ]);

  // Scans history state
  const [scans, setScans] = useState([
    { id: 1, scanName: 'OWASPJuiceShop-Baseline-01', targetId: 1, status: 'COMPLETED', executionTimeMs: 4250, totalVulnerabilitiesFound: 4 }
  ]);

  // Vulnerabilities telemetry state
  const [vulnerabilities, setVulnerabilities] = useState([
    { id: 1, scanId: 1, vulnerabilityType: 'SQL_INJECTION', endpointUrl: 'http://localhost:3000/rest/user/login', parameter: 'email', severity: 'HIGH', evidence: "POST /rest/user/login with ' OR 1=1-- returns HTTP 200 OK authentication bypass" },
    { id: 2, scanId: 1, vulnerabilityType: 'XSS', endpointUrl: 'http://localhost:3000/rest/products/search', parameter: 'q', severity: 'HIGH', evidence: 'Reflected script injection marker in search query response context' },
    { id: 3, scanId: 1, vulnerabilityType: 'MISSING_CSP', endpointUrl: 'http://localhost:3000', parameter: 'Content-Security-Policy', severity: 'MEDIUM', evidence: 'Content-Security-Policy header absent in HTTP server response' },
    { id: 4, scanId: 1, vulnerabilityType: 'MISSING_HSTS', endpointUrl: 'http://localhost:3000', parameter: 'Strict-Transport-Security', severity: 'LOW', evidence: 'HSTS header missing on web server port' }
  ]);

  const refreshAllData = () => {
    fetch('/api/targets')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setTargets(data);
          setBackendOnline(true);
        }
      })
      .catch(() => setBackendOnline(false));

    fetch('/api/evaluation/metrics')
      .then(res => res.json())
      .then(data => {
        if (data && data.totalTestCases > 0) setMetrics(data);
      })
      .catch(() => {});

    fetch('/api/evaluation/test-cases')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setTestCases(data);
      })
      .catch(() => {});

    fetch('/api/scans')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setScans(data);
      })
      .catch(() => {});

    fetch('/api/scans/vulnerabilities')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setVulnerabilities(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleAddTarget = (newTarget) => {
    fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTarget)
    })
      .then(res => res.json())
      .then(saved => {
        setTargets(prev => [...prev, saved]);
        refreshAllData();
      })
      .catch(() => {
        setTargets(prev => [...prev, { ...newTarget, id: prev.length + 1 }]);
      });
  };

  const handleTriggerScan = (targetId, callback) => {
    const foundTarget = targets.find(t => t.id === targetId) || targets[0];
    // Open Live Scan Screen modal which executes the authoritative scan pipeline
    setActiveLiveScan({
      targetId: foundTarget?.id || targetId,
      targetName: foundTarget?.name || 'Authorized Lab',
      targetUrl: foundTarget?.url || 'http://localhost:3000'
    });
    if (callback) callback();
  };

  const handleVerifyLive = (callback) => {
    fetch('/api/evaluation/verify-live?url=http://localhost:3000&targetName=OWASP%20Juice%20Shop', { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        refreshAllData();
        if (callback) callback();
      })
      .catch(() => {
        refreshAllData();
        if (callback) callback();
      });
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-container">
      {/* Fixed Collapsible Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        backendOnline={backendOnline}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Main Layout Area */}
      <div className="app-main">
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          backendOnline={backendOnline}
          onNavigateTab={setActiveTab}
        />

        {/* View Routing */}
        <main>
          {activeTab === 'dashboard' && (
            <DashboardView
              targets={targets}
              scans={scans}
              vulnerabilities={vulnerabilities}
              metrics={metrics}
              onNavigateTab={setActiveTab}
              onTriggerScan={handleTriggerScan}
            />
          )}

          {activeTab === 'targets' && (
            <TargetApplicationsView
              targets={targets}
              scans={scans}
              vulnerabilities={vulnerabilities}
              testCases={testCases}
              onAddTarget={handleAddTarget}
              onTriggerScan={handleTriggerScan}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'scan-url' && (
            <ScanAnyUrlView
              onViewReport={(newScanId) => {
                refreshAllData();
                setSelectedScanId(newScanId);
                setActiveTab('assessment-report');
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'new-scan' && (
            <NewScanView
              targets={targets}
              scans={scans}
              onStartLiveScan={(config) => setActiveLiveScan(config)}
              onNavigateTab={setActiveTab}
              onSelectScanId={setSelectedScanId}
            />
          )}

          {activeTab === 'history' && (
            <ScanHistoryView
              scans={scans}
              targets={targets}
              vulnerabilities={vulnerabilities}
              onTriggerScan={handleTriggerScan}
              onNavigateTab={setActiveTab}
              onSelectScanId={setSelectedScanId}
            />
          )}

          {activeTab === 'findings' && (
            <VulnerabilityFindingsView
              vulnerabilities={vulnerabilities}
              targets={targets}
              scans={scans}
            />
          )}

          {activeTab === 'metrics' && (
            <EvaluationMetricsView
              metrics={metrics}
              testCases={testCases}
              targets={targets}
              scans={scans}
              onVerifyLive={handleVerifyLive}
            />
          )}

          {activeTab === 'reports' && (
            <ResearchReportsView
              targets={targets}
              metrics={metrics}
              vulnerabilities={vulnerabilities}
              scans={scans}
              testCases={testCases}
              defaultSubTab="report"
            />
          )}

          {activeTab === 'assessment-report' && (
            <SecurityAssessmentReportView
              scanId={selectedScanId}
              scans={scans}
              onSelectScanId={setSelectedScanId}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView backendOnline={backendOnline} />
          )}
        </main>
      </div>

      {/* Live Scan Screen Modal */}
      {activeLiveScan && (
        <LiveScanModal
          scanConfig={activeLiveScan}
          onCancelScan={() => setActiveLiveScan(null)}
          onFinishScan={() => {
            refreshAllData();
            setActiveLiveScan(null);
          }}
          onViewReport={(newScanId) => {
            refreshAllData();
            setSelectedScanId(newScanId);
            setActiveLiveScan(null);
            setActiveTab('assessment-report');
          }}
          onViewFindings={(newScanId) => {
            refreshAllData();
            setActiveLiveScan(null);
            setActiveTab('findings');
          }}
        />
      )}
    </div>
  );
}
