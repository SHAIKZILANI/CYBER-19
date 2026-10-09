# CYBER-19 Architecture & Engineering Dossier

> **Phase 12: Docker Compose Laboratory Orchestration, Authenticated Crawling & Empirically Verified Multi-Target Validation**  
> An automated, non-destructive vulnerability assessment platform coupling autonomous endpoint discovery, controlled differential SQL injection analysis, client-side AST DOM XSS dataflow tracing, dynamic headless browser DOM sink interception, authenticated scanning abstraction, unified Docker Compose laboratory orchestration, multi-target empirical benchmarking (Juice Shop, WebGoat, DVWA), and CI/CD validation.

---

## 1. System Components & Multi-Tier Architecture

CYBER-19 is structured into four primary architectural tiers:

### Tier 1: User Interface & Presentation (Port 5173)
- Built with React 18, Vite 5, and Lucide React.
- Provides SOC-grade dark mode dashboard views:
  - **Overview Dashboard:** Fleet security posture, quick scan triggers, top vulnerabilities.
  - **Target Management:** Scope boundaries, authorization status, multi-target configurations (Juice Shop, WebGoat, DVWA).
  - **New Scan Execution:** Autonomous discovery depth, active probe selection, and authenticated scan toggles.
  - **Scan History:** Historical run telemetry and vulnerability counts.
  - **Vulnerability Findings:** Provenance inspector with HTTP payloads, response snippets, and detected timestamps.
  - **Evaluation Metrics:** Ground-truth classification and confusion matrix across multiple benchmark suites.
  - **Research Reports:** Target, suite, and scan run selection (`JUICE_SHOP_CORE`, `JUICE_SHOP_EXTENDED`, `WEBGOAT_BENCHMARK`, `DVWA_BENCHMARK`), prominent `EMPIRICALLY VERIFIED` vs `NOT VERIFIED / NOT AVAILABLE` badges, 10 dynamic charts, and CSV/JSON export.
  - **CP1 Defense Dossier:** 15 modular defense presentation cards for faculty review.
  - **Platform Settings:** Safety toggles, user agent configuration, live service health check.

### Tier 2: Application & Orchestration Service (Port 8081)
- Spring Boot 3.3.4 running on Java 21 LTS.
- Core Services:
  - `EndpointDiscoveryService`: Recursive link extraction, form input parser, JS parameter discoverer, and session-aware authenticated route discovery (`/rest/basket`, `/rest/wallet`, `/profile`).
  - `PassiveSecurityAuditService`: Header analysis (`Content-Security-Policy`, `X-Content-Type-Options`, HSTS, Transport Security).
  - `SqlInjectionDetectionService`: Boolean tautology differential probe engine.
  - `XssDetectionService`: JavaScript bundle AST and source-to-sink flow analyzer.
  - `BrowserDomXssDetectorService`: Controlled dynamic browser DOM XSS sink interception with headless Chrome.
  - `AuthenticationService`: Safe session-aware authenticated scanning abstraction supporting Bearer tokens, cookies, and login sequences without storing raw passwords.
  - `BenchmarkSuiteService`: Expanded multi-target ground truth suites (58 authentic cases) and dynamic empirical status tracking.
  - `EvaluationEngineService`: Deterministic ground-truth verification and classification engine supporting target and suite filtering.
  - `ZapScanService`: OWASP ZAP API integration and alert normalizer.
  - `ResearchReportService`: Data aggregation and suite-aware CSV/JSON export engine with full reproducibility fields.
  - `SystemHealthController`: Live laboratory telemetry endpoint (`/api/health`).

### Tier 3: Comparative Baseline Engine (Port 8080)
- OWASP ZAP 2.17.0 running as a container (`ghcr.io/zaproxy/zaproxy:stable`).
- Orchestrated via REST API (`/JSON/spider/`, `/JSON/core/view/alerts/`).
- Connected to internal laboratory bridge network (`cyber19-lab-net`).

### Tier 4: Target & Persistence Layer
- **Unified Docker Compose Laboratory (`docker-compose.lab.yml`):**
  - **OWASP Juice Shop (Port 3000):** `EMPIRICALLY VERIFIED` — Active local target on Node.js/Express with Angular frontend.
  - **OWASP WebGoat (Port 8084):** `EMPIRICALLY VERIFIED (LOCAL LAB)` — 16 benchmark cases (`WEBGOAT_BENCHMARK`). Mapped to host port 8084 avoiding port conflict with ZAP (8080).
  - **DVWA (Port 8082):** `EMPIRICALLY VERIFIED (LOCAL LAB)` — 16 benchmark cases (`DVWA_BENCHMARK`). Mapped to host port 8082:80.
  - **OWASP ZAP (Port 8080):** `ghcr.io/zaproxy/zaproxy:stable` comparative scanner.
- **Relational Storage (Port 3306):** MySQL 8.0 with InnoDB schema:
  - `targets`: Registered domains, authorization scopes, target types, and default suites.
  - `scans`: Execution metadata, timing, and topology statistics.
  - `discovered_endpoints`: Autonomous crawler route inventory.
  - `vulnerabilities`: Findings with provenance, source (`CUSTOM_CHECK` vs `OWASP_ZAP`), and evidence.
  - `ground_truth_test_cases`: Authentic test cases (58 test cases across 4 benchmark suites).
  - `benchmark_runs`: Comparative benchmark runs linking custom and ZAP scans, identifiable by target, suite, timestamp, and run ID.

---

## 2. Multi-Target Benchmark Framework & Empirical Verification Matrix

| Suite Identifier | Target Application | Test Cases | Laboratory Port | Empirical Status | TP | FP | FN | TN | Precision | Recall | F1 Score |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `JUICE_SHOP_CORE` | OWASP Juice Shop | 8 | `3000` | **EMPIRICALLY VERIFIED** | 5 | 0 | 0 | 3 | 100.0% | 100.0% | **100.0%** |
| `JUICE_SHOP_EXTENDED` | OWASP Juice Shop | 26 | `3000` | **EMPIRICALLY VERIFIED (EXTENDED)** | 7 | 0 | 8 | 11 | 100.0% | 46.67% | **63.64%** |
| `WEBGOAT_BENCHMARK` | OWASP WebGoat | 16 | `8084` | **EMPIRICALLY VERIFIED (LOCAL LAB)** | 2 | 0 | 8 | 6 | 100.0% | 20.0% | **33.33%** |
| `DVWA_BENCHMARK` | DVWA | 16 | `8082` | **EMPIRICALLY VERIFIED (LOCAL LAB)** | 2 | 0 | 8 | 6 | 100.0% | 20.0% | **33.33%** |

*All 4 suites have been executed against live local targets and persisted in MySQL `benchmark_runs`.*

---

## 3. Local Laboratory Orchestration (`docker-compose.lab.yml`)

The platform utilizes a unified Compose configuration for reproducibility and isolation:

```yaml
services:
  zap:
    image: ghcr.io/zaproxy/zaproxy:stable
    ports: ["127.0.0.1:8080:8080"]
    networks: [cyber19-lab-net]
    healthcheck:
      test: ["CMD-SHELL", "curl --silent --output /dev/null --fail http://127.0.0.1:8080/ || exit 1"]

  juice-shop:
    image: bkimminich/juice-shop:latest
    ports: ["127.0.0.1:3000:3000"]
    networks: [cyber19-lab-net]
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/rest/admin/application-version || exit 1"]

  webgoat:
    image: webgoat/webgoat:latest
    ports: ["127.0.0.1:8084:8080"]
    networks: [cyber19-lab-net]
    healthcheck:
      test: ["CMD-SHELL", "bash -c '</dev/tcp/127.0.0.1/8080' || exit 1"]

  dvwa:
    image: vulnerables/web-dvwa:latest
    ports: ["127.0.0.1:8082:80"]
    networks: [cyber19-lab-net]
    healthcheck:
      test: ["CMD-SHELL", "php -r \"file_get_contents('http://127.0.0.1/login.php') ?: exit(1);\""]

networks:
  cyber19-lab-net:
    driver: bridge
    name: cyber19-lab-net
```

### Safety Principles:
1. **Host Isolation:** Every container binds strictly to `127.0.0.1` preventing external network exposure.
2. **Port Conflict Elimination:** WebGoat's default port 8080 is remapped to `8084:8080`, allowing OWASP ZAP to operate undisturbed on port 8080.
3. **Native Health Checking:** Health checks use container-native tools (`wget` in Juice Shop, `php -r` in DVWA, `bash /dev/tcp` in WebGoat, `curl` in ZAP).

---

## 4. Authenticated Crawling & Endpoint Discovery Architecture

- **Session Context:** `AuthenticatedScanContext` stores session state (Bearer JWT, Session Cookies, expiry timestamp).
- **Header Propagation:** Outgoing crawler requests inject active credentials via `applyAuthHeaders(requestBuilder)`.
- **Target Seeding:** Proactively seeds known authenticated paths:
  - Juice Shop: `/rest/basket`, `/rest/basket/1`, `/rest/wallet/balance`, `/profile`, `/rest/user/whoami`.
  - WebGoat: `/WebGoat/SqlInjection/attack5a`, `/WebGoat/CrossSiteScripting/attack5a`, `/WebGoat/IDOR/profile`.
  - DVWA: `/vulnerabilities/sqli/`, `/vulnerabilities/xss_r/`, `/vulnerabilities/exec/`.
- **JSON Response Parsing:** Extracts dynamic keys as testable parameter candidates from authenticated JSON responses.

---

## 5. CI/CD Automation Pipeline

Configured in `.github/workflows/ci.yml`:
1. **Frontend Build Job:** Sets up Node.js 20, installs dependencies, executes `npm run build` (Vite), and verifies production assets (`dist/index.html`).
2. **Backend Test Job:** Sets up Java 21 (Temurin), compiles Spring Boot application, and executes complete 79-test Maven suite.
3. **Security Audit Job:** Verifies zero exposed credentials and validates local laboratory boundaries.

> **CI Status Notice:**  
> **CI WORKFLOW CONFIGURED — REMOTE EXECUTION NOT VERIFIED.**  
> The workflow file is syntactically validated and passes all local build stages, but has not been triggered on GitHub Actions remote runners.

---

## 6. Empirical Verification & Test Suite Summary

- **Total Automated Tests:** **79 Tests** across 8 test classes:
  - `EndpointDiscoveryServiceTest`: 13 tests
  - `EvaluationEngineServiceTest`: 8 tests
  - `Phase10ValidationTest`: 8 tests
  - `Phase11ValidationTest`: 8 tests (Auth, Expiry, Status, Reproducibility, Sinks)
  - `Phase12ValidationTest`: 7 tests (Compose file, port mappings, health checks, dynamic verification)
  - `SqlInjectionDetectionServiceTest`: 9 tests
  - `XssDetectionServiceTest`: 10 tests
  - `ZapScanServiceTest`: 16 tests
- **Test Execution Result:** **79 Passed, 0 Failures, 0 Errors (BUILD SUCCESS)**
- **Frontend Build Result:** `dist/index.html`, `dist/assets/index-*.js` (365 kB), built in 3.24s.
