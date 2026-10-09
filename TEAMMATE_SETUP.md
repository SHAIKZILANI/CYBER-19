# CYBER-19 — Teammate Setup & Local Deployment Guide

> **Welcome to CYBER-19!**  
> This guide provides step-by-step, copy-and-paste instructions for teammates setting up the **CYBER-19 Automated Web-Application Vulnerability Assessment Platform** on a fresh Windows laptop.  
> Following this guide ensures you can clone the repository, install all dependencies, start all services, run the security testing laboratories, and execute scans without depending on anyone else's computer.

---

## Table of Contents
1. [Software Installation Checklist](#1-software-installation-checklist)
2. [Prerequisites Verification (PowerShell)](#2-prerequisites-verification-powershell)
3. [Step 1: Clone the Repository](#3-step-1-clone-the-repository)
4. [Step 2: Configure Environment Variables](#4-step-2-configure-environment-variables)
5. [Step 3: Start the MySQL Database](#5-step-3-start-the-mysql-database)
6. [Step 4: Start the Security Testing Laboratory (Docker)](#6-step-4-start-the-security-testing-laboratory-docker)
7. [Step 5: Start the Spring Boot Backend](#7-step-5-start-the-spring-boot-backend)
8. [Step 6: Start the React Frontend Dashboard](#8-step-6-start-the-react-frontend-dashboard)
9. [Verification & Health Checklist](#9-verification--health-checklist)
10. [Running Your First Vulnerability Scan](#10-running-your-first-vulnerability-scan)
11. [Troubleshooting Guide (14 Common Issues)](#11-troubleshooting-guide-14-common-issues)
12. [Graceful Shutdown & Restart Procedures](#12-graceful-shutdown--restart-procedures)

---

## 1. Software Installation Checklist

Review the following table before starting. You only need to install tools that are marked **Mandatory**.

| Software / Tool | Purpose | Required Version | Official Download Link | Verification Command | Mandatory? |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Git for Windows** | Source control & repository cloning | `2.40.0+` (or latest) | [git-scm.com/download/win](https://git-scm.com/download/win) | `git --version` | **Mandatory** |
| **Java JDK 21 LTS** | Backend runtime & compiler | Java 21 LTS (`21.0.x`) | [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/#java21) or [Eclipse Temurin 21](https://adoptium.net/temurin/releases/?version=21) | `java -version` | **Mandatory** |
| **Node.js & npm** | Frontend build tools & Vite server | Node `v18.0.0+` (LTS recommended) | [nodejs.org](https://nodejs.org/) | `node -v` & `npm -v` | **Mandatory** |
| **Docker Desktop** | Hosts OWASP ZAP, Juice Shop, WebGoat, DVWA | Latest Windows version (WSL2 backend) | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | `docker --version` & `docker compose version` | **Mandatory** |
| **MySQL 8.0** | Relational data store for scans & findings | MySQL Server `8.0.x` | [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) *(or run via Docker container)* | `Test-NetConnection -Port 3306 -ComputerName localhost` | **Mandatory** *(either native or Docker)* |
| **Apache Maven** | Backend dependency manager & test runner | `3.9.x` | **Bundled in repo via Maven Wrapper (`mvnw.cmd`)** | `.\mvnw.cmd -version` *(inside `backend/`)* | **Included in repo** *(no manual install needed)* |
| **VS Code or IntelliJ** | Code editor & debugger | Latest | [code.visualstudio.com](https://code.visualstudio.com/) or [jetbrains.com/idea](https://www.jetbrains.com/idea/) | `code --version` | *Recommended* |
| **Modern Browser** | Dashboard access & web testing | Chrome, Edge, Firefox | [google.com/chrome](https://www.google.com/chrome/) | N/A | **Mandatory** |

> [!NOTE]
> **Maven is already included in the repository!**  
> You do **not** need to install Apache Maven separately or add it to Windows PATH. The project includes `backend/mvnw.cmd` (Maven Wrapper), which automatically handles Maven execution.

---

## 2. Prerequisites Verification (PowerShell)

Open Windows PowerShell (Run as Administrator or regular user) and execute the following commands to confirm your installed software:

```powershell
# 1. Check Git
git --version
# Expected: git version 2.x.x.windows.x

# 2. Check Java JDK (Must be Java 21)
java -version
# Expected: openjdk version "21.x.x" or java version "21.x.x"

# 3. Check Node.js and npm
node -v
npm -v
# Expected: v18.x.x, v20.x.x, or v22.x.x / npm 9.x.x or 10.x.x

# 4. Check Docker Engine and Docker Compose
docker --version
docker compose version
# Expected: Docker version 24.x+ / Docker Compose version v2.x+
```

### Critical Note on `JAVA_HOME`
CYBER-19 requires **Java 21**. If your system has multiple Java versions installed (e.g., Java 17 alongside Java 21), you must ensure `JAVA_HOME` points to Java 21:
```powershell
# Verify current JAVA_HOME
$env:JAVA_HOME

# If it does not point to JDK 21, set it in your current terminal:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "C:\Program Files\Java\jdk-21\bin;$env:Path"

# Check version again:
java -version
```

---

## 3. Step 1: Clone the Repository

Clone the repository directly from GitHub into your preferred development directory (for example, `C:\Projects` or `C:\dev`):

```powershell
# Navigate to your workspace directory
cd C:\

# Clone the repository
git clone https://github.com/SHAIKZILANI/CYBER-19.git

# Enter the project directory
cd CYBER-19
```

> [!IMPORTANT]
> **Always clone via Git** rather than downloading a ZIP file. Downloading a ZIP strips the `.git` folder, preventing you from checking Git status, pulling updates, and creating feature branches.

---

## 4. Step 2: Configure Environment Variables

The repository includes a template file `.env.example` with safe defaults that work out-of-the-box for standard local development.

In your PowerShell terminal at the root of `CYBER-19`:

```powershell
# Copy the example environment file to .env
Copy-Item .env.example .env
```

### Understanding the Variables

Open `.env` in your text editor (e.g. `code .env` or `notepad .env`):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | Host where MySQL 8 is running |
| `DB_PORT` | `3306` | Port where MySQL 8 listens |
| `DB_NAME` | `cyber_vulnerability_db` | Database name (auto-created on startup) |
| `DB_USERNAME` | `root` | MySQL user name |
| `DB_PASSWORD` | `root` | MySQL root password (change if your local MySQL password differs) |
| `SERVER_PORT` | `8081` | Spring Boot REST API listening port |
| `ZAP_BASE_URL` | `http://localhost:8080` | OWASP ZAP API daemon URL (managed by Docker) |
| `ZAP_API_KEY` | *(blank)* | ZAP API key (disabled by default in laboratory container) |
| `VITE_PORT` | `5173` | React frontend Vite development server port |

> [!TIP]
> **Zero-Configuration Defaults:** If your local MySQL `root` password is `root`, you do **not** need to change anything! Spring Boot's `application.properties` includes automatic fallback defaults:
> ```properties
> spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:cyber_vulnerability_db}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
> spring.datasource.username=${DB_USERNAME:root}
> spring.datasource.password=${DB_PASSWORD:root}
> ```
> If your MySQL password is different (e.g. `password123`), simply edit `DB_PASSWORD=password123` in `.env`.

---

## 5. Step 3: Start the MySQL Database

CYBER-19 requires MySQL 8 listening on port 3306 with database `cyber_vulnerability_db`.

### ⚠️ Pre-Flight Check (Run this first!)
Before starting any database service, check whether MySQL or another service is already listening on port 3306:

```powershell
Test-NetConnection -ComputerName localhost -Port 3306
```

- **If `TcpTestSucceeded : True`:** MySQL is **already running** on your system (either as a native Windows service or existing container)! **Do not start a duplicate container.** Verify your password in `.env` and proceed to **Step 4**.
- **If `TcpTestSucceeded : False`:** Port 3306 is free. Choose **Option A** or **Option B** below:

---

### Option A: Use Native Windows MySQL Server (If installed)
If you installed MySQL Community Server 8.0 natively on Windows:
```powershell
# Start the Windows MySQL service
net start MySQL80

# Verify port 3306 is now active
Test-NetConnection -ComputerName localhost -Port 3306
```

---

### Option B: Run MySQL via Docker (If MySQL is not installed on Windows)
If you do not have MySQL installed natively, run MySQL 8 in a lightweight Docker container.

#### 1. Check if the container already exists:
```powershell
docker ps -a --filter "name=cyber19-mysql"
```

- **If it already exists (Status: Exited):** Simply start the existing container (prevents container-name conflict):
  ```powershell
  docker start cyber19-mysql
  ```
- **If it does NOT exist:** Create and start a new container:
  ```powershell
  docker run -d `
    --name cyber19-mysql `
    -p 3306:3306 `
    -e MYSQL_ROOT_PASSWORD=root `
    -e MYSQL_DATABASE=cyber_vulnerability_db `
    mysql:8.0
  ```

#### 2. Verify Startup Readiness
On first startup, MySQL initializes internal database files, which takes 10–15 seconds:
```powershell
# Inspect container logs for readiness
docker logs cyber19-mysql --tail 10
```
Wait until you see: `mysqld: ready for connections. Version: '8.0.x'`.

---

> [!NOTE]
> When the Spring Boot backend starts up, Hibernate automatically creates all tables (`ddl-auto=update`) and seeds default targets and the 58 ground-truth test cases via `DatabaseSeeder.java` and `BenchmarkSuiteService.java`. You do not need to execute manual SQL schema scripts.

---

## 6. Step 4: Start the Security Testing Laboratory (Docker)

CYBER-19 uses `docker-compose.lab.yml` to orchestrate an isolated local multi-target laboratory.

### Start the Lab Services

Open a PowerShell terminal at the project root (`CYBER-19`):

```powershell
# Start all laboratory containers in the background
docker compose -f docker-compose.lab.yml up -d
```

### What this starts:
1. **OWASP ZAP 2.17.0** on `http://localhost:8080` (Comparative benchmark scanner daemon)
2. **OWASP Juice Shop** on `http://localhost:3000` (Modern Angular/Node vulnerable target)
3. **OWASP WebGoat** on `http://localhost:8084` (Enterprise Java target, remapped from 8080 to prevent ZAP collision)
4. **DVWA** on `http://localhost:8082` (Classic PHP/MySQL vulnerable application)

### Verify Container Status and Health
```powershell
docker compose -f docker-compose.lab.yml ps
```
All containers should display status `Up` or `Up (healthy)`.

---

## 7. Step 5: Start the Spring Boot Backend

Open **Terminal 2** (Keep this terminal running):

```powershell
# Navigate into the backend directory
cd C:\CYBER-19\backend

# Ensure JAVA_HOME points to Java 21 (if needed)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "C:\Program Files\Java\jdk-21\bin;$env:Path"

# Run all 109 automated backend tests first (Optional but recommended)
.\mvnw.cmd test

# Start the Spring Boot Application
.\mvnw.cmd spring-boot:run
```

### Expected Startup Output
You will see Spring Boot ASCII art followed by:
```
INFO ... Tomcat started on port 8081 (http) with context path '/'
INFO ... Started AssessmentPlatformApplication in 4.5 seconds
```

### Verify Backend Telemetry
Open another terminal or browser and query the built-in health endpoint:
```powershell
curl.exe -s http://localhost:8081/api/health
```
**Expected JSON response:**
```json
{
  "status": "UP",
  "backend": { "status": "UP", "version": "1.0.0" },
  "database": { "status": "UP", "database": "cyber_vulnerability_db" },
  "zap": { "status": "UP", "url": "http://localhost:8080" },
  "juiceShop": { "status": "UP", "url": "http://localhost:3000" }
}
```

---

## 8. Step 6: Start the React Frontend Dashboard

Open **Terminal 3** (Keep this terminal running):

```powershell
# Navigate into the frontend directory
cd C:\CYBER-19\frontend

# Install dependencies (First time only)
npm install

# Start Vite development server
npm run dev
```

### Expected Output
```
  VITE v5.4.21  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 9. Verification & Health Checklist

Once all three terminals are active, verify the complete stack using this checklist:

| Service | Expected URL | How to Verify | Status Indicator |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:5173` | Open in Chrome / Edge | Dark mode SOC Dashboard loads |
| **Backend Health** | `http://localhost:8081/api/health` | Run `curl http://localhost:8081/api/health` | Returns `"status": "UP"` |
| **Target Endpoints API**| `http://localhost:8081/api/targets`| Run `curl http://localhost:8081/api/targets` | Lists Juice Shop, WebGoat, DVWA |
| **MySQL Connectivity** | `localhost:3306` | `Test-NetConnection -Port 3306 -ComputerName localhost` | `TcpTestSucceeded: True` |
| **OWASP Juice Shop** | `http://localhost:3000` | Open in browser | Displays Juice Shop storefront |
| **OWASP ZAP API** | `http://localhost:8080` | Open `http://localhost:8080` in browser | Displays ZAP Welcome / API screen |
| **OWASP WebGoat** | `http://localhost:8084/WebGoat`| Open in browser | WebGoat login / lesson portal |
| **DVWA** | `http://localhost:8082` | Open in browser | DVWA login screen |

---

## 10. Running Your First Vulnerability Scan

To verify the end-to-end detection pipeline:

1. Open your web browser to `http://localhost:5173`.
2. Navigate to the **New Scan** or **Scan Target** view.
3. Select **OWASP Juice Shop (`http://localhost:3000`)** from the target presets.
4. Verify the **Scope Validation Badge** shows green (`AUTHORIZED: LOCAL LAB TARGET`).
5. Choose your active probe settings (SQL Injection, XSS, Passive Security Audit, Access Control).
6. Click **"Start Security Scan"**.
7. Observe the **Live Scan Modal**:
   - Stage progression: `INITIALIZING` -> `DISCOVERING` -> `ANALYZING` -> `RUNNING_ZAP` -> `COMPLETED`.
   - Real-time telemetry counters update (endpoints discovered, parameters tested, vulnerabilities detected, elapsed milliseconds).
8. Once complete, click **"View Assessment Report"**:
   - Review the 10-section academic Security Assessment Report.
   - Inspect empirical findings with HTTP payloads and response evidence.
   - Compare side-by-side metrics against OWASP ZAP (TP, FP, FN, TN, Precision, Recall, F1).
   - Test the **"Export JSON"** or **"Export CSV"** buttons.

---

## 11. Troubleshooting Guide (14 Common Issues)

### 1. `git: command not found`
- **Cause:** Git for Windows is not installed or not added to your system PATH.
- **Solution:** Download and install Git from [git-scm.com/download/win](https://git-scm.com/download/win). In the installer, ensure **"Add Git to PATH"** is selected. Restart your PowerShell terminal.

### 2. `error during connect: This error may indicate that the docker daemon is not running`
- **Cause:** Docker Desktop is not started.
- **Solution:** Search for "Docker Desktop" in the Windows Start menu and launch it. Wait until the whale icon in the Windows notification tray displays "Docker Desktop is running" (green).

### 3. Docker Containers Failing Health Checks (`unhealthy`)
- **Diagnostic Command:**
  ```powershell
  docker compose -f docker-compose.lab.yml ps
  docker logs <container-name>
  ```
- **Cause:** Slow initialization on first image download, or temporary resource contention.
- **Solution:** Give WebGoat and ZAP 30–60 seconds to complete their initial start periods. If a container hangs, restart it:
  ```powershell
  docker compose -f docker-compose.lab.yml restart <container-name>
  ```

### 4. Ports Already in Use (Port 8081, 5173, 8080, or 3306)
- **Diagnostic Command:**
  ```powershell
  # Find which process ID (PID) is listening on port 8081:
  Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess
  ```
- **Solution:** Terminate the conflicting process:
  ```powershell
  Stop-Process -Id <PID> -Force
  ```
- **Alternative:** If port 8081 is occupied by another required tool, edit `SERVER_PORT=8085` in `.env` and update the proxy target in `frontend/vite.config.js`.

### 5. Java Version Mismatch (`class file version 65.0, this version only recognizes up to 61.0`)
- **Cause:** Your system is attempting to run Maven tests or compile with Java 17 (class version 61) instead of Java 21 (class version 65).
- **Solution:** Explicitly set `JAVA_HOME` to your JDK 21 installation in your PowerShell session:
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
  $env:Path = "C:\Program Files\Java\jdk-21\bin;$env:Path"
  java -version
  ```
  To make this permanent on Windows:
  ```powershell
  [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")
  ```

### 6. Node.js or npm Version Mismatch
- **Diagnostic Command:**
  ```powershell
  node -v
  ```
- **Solution:** CYBER-19 requires Node.js `18.0.0+`. If you are running Node 14 or 16, install the latest LTS release from [nodejs.org](https://nodejs.org/).

### 7. Maven Build Failures or Dependency Download Errors
- **Cause:** Corrupted local Maven cache or network interruption during dependency download.
- **Solution:** Force Maven to re-download missing dependencies:
  ```powershell
  cd backend
  .\mvnw.cmd clean compile -U
  ```

### 8. MySQL Connection Refused (`Communications link failure`)
- **Diagnostic Command:**
  ```powershell
  Test-NetConnection -ComputerName localhost -Port 3306
  ```
- **Cause:** MySQL server is stopped or running on a different port.
- **Solution:**
  - If using Windows Native MySQL: run `net start MySQL80`.
  - If using Docker MySQL: run `docker start cyber19-mysql` (or create one using the command in Step 3).

### 9. Database Authentication Error (`Access denied for user 'root'@'localhost'`)
- **Cause:** Your local MySQL `root` user password does not match the default `root`.
- **Solution:** Open `.env` and set `DB_PASSWORD=your_actual_password`. Or pass it directly to Maven:
  ```powershell
  .\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.password=your_actual_password"
  ```

### 10. CORS Errors in Browser Console
- **Cause:** Accessing backend APIs directly from the browser without going through the Vite development proxy.
- **Solution:** Never call `http://localhost:8081/api/...` directly from frontend fetch requests. The Vite server configured in `frontend/vite.config.js` automatically proxies all `/api/*` calls from `http://localhost:5173/api/*` to `http://localhost:8081/api/*`. Make frontend calls to relative paths (`/api/...`).

### 11. Frontend API Base URL Errors (`404 Not Found` on API Calls)
- **Cause:** Spring Boot backend is not running or crashed.
- **Solution:** Check Terminal 2 (Backend). Verify that `Tomcat started on port 8081` is displayed. Test `curl http://localhost:8081/api/health` directly.

### 12. OWASP ZAP Unavailable / Health Check Warnings
- **Diagnostic Command:**
  ```powershell
  curl.exe -s http://localhost:8080/
  ```
- **Cause:** The ZAP container hasn't finished loading or port 8080 was blocked.
- **Solution:** Wait 20 seconds after running `docker compose up -d`. If ZAP failed to start, check `docker logs zap`. If you have a local web proxy or IIS running on port 8080, stop that service.

### 13. Scan Timeouts or Slow Responses
- **Cause:** Target container is experiencing high memory usage or throttling.
- **Solution:** Check Docker memory allocation in Docker Desktop Settings -> Resources. We recommend allocating at least **4 GB RAM** and **2 CPU cores** to Docker Desktop for smooth multi-container execution.

### 14. Windows PowerShell Script Execution Policy (`Execution of scripts is disabled on this system`)
- **Cause:** Windows default PowerShell execution policy restricts running `.ps1` or custom scripts.
- **Solution:** Open PowerShell as Administrator and run:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

---

## 12. Graceful Shutdown & Restart Procedures

### Stopping the Services
1. **Frontend:** In Terminal 3, press `Ctrl + C` and type `y`.
2. **Backend:** In Terminal 2, press `Ctrl + C`.
3. **Docker Security Labs:** In Terminal 1, run:
   ```powershell
   docker compose -f docker-compose.lab.yml down
   ```
4. **Docker MySQL (if used):**
   ```powershell
   docker stop cyber19-mysql
   ```

### Restarting the Services
To restart later, simply follow the steps in reverse:
1. Start Docker lab: `docker compose -f docker-compose.lab.yml up -d`
2. Start MySQL: `docker start cyber19-mysql` (or ensure native MySQL service is running)
3. Start Backend: `cd backend; .\mvnw.cmd spring-boot:run`
4. Start Frontend: `cd frontend; npm run dev`
