# CYBER-19 — Teammate Contribution & Git Workflow Guide

> **Welcome to the CYBER-19 team!**  
> To keep our codebase clean, stable, and reproducible across everyone's laptops, all team members follow the standard Git branching and pull request workflow outlined in this guide.

---

## Table of Contents
1. [Core Principles](#1-core-principles)
2. [Branching Strategy](#2-branching-strategy)
3. [Step-by-Step Development Workflow](#3-step-by-step-development-workflow)
4. [Testing Before Committing](#4-testing-before-committing)
5. [Commit Message Guidelines](#5-commit-message-guidelines)
6. [Opening a Pull Request (PR)](#6-opening-a-pull-request-pr)
7. [Syncing with Main & Resolving Conflicts](#7-syncing-with-main--resolving-conflicts)
8. [Security & Credentials Policy](#8-security--credentials-policy)

---

## 1. Core Principles

1. **Never commit directly to `main`:** The `main` branch is protected and reserved for stable, verified code. All new work belongs in feature branches.
2. **Every change must pass automated tests:** Before opening a Pull Request, run both backend tests and frontend builds locally.
3. **No destructive Git commands:** Never use `git push --force` or `git reset --hard` on shared branches.
4. **Zero secrets in source control:** Never commit passwords, tokens, API keys, or personal paths.

---

## 2. Branching Strategy

When starting a task, create a dedicated branch off `main` using descriptive naming:

| Branch Type | Format | Example |
| :--- | :--- | :--- |
| **New Features** | `feature/<short-description>` | `feature/blind-sqli-detector` |
| **Bug Fixes** | `bugfix/<issue-description>` | `bugfix/zap-timeout-handling` |
| **Documentation** | `docs/<topic>` | `docs/add-api-examples` |
| **Testing / CI** | `test/<test-suite>` | `test/add-webgoat-tests` |

---

## 3. Step-by-Step Development Workflow

### Step 1: Ensure Your `main` Branch is Up to Date
Before creating a new branch, pull the latest changes from GitHub:

```powershell
# Switch to main
git checkout main

# Pull the latest commits from origin
git pull origin main
```

### Step 2: Create and Switch to Your Feature Branch
```powershell
# Create and check out a new branch
git checkout -b feature/your-feature-name

# Verify you are on the new branch
git branch --show-current
```

### Step 3: Implement Your Changes
Make your code edits in VS Code or IntelliJ IDEA. Keep your changes focused on your specific assigned task.

### Step 4: Check Status and Review Diffs
Check what files were modified:
```powershell
# View modified, added, or deleted files
git status

# Inspect exact changes line-by-line
git diff
```

---

## 4. Testing Before Committing

You must verify that your changes did not break existing functionality. Run both verification commands:

### A. Run Backend Automated Tests (109 Tests)
Open PowerShell in the `backend` directory:
```powershell
cd C:\CYBER-19\backend

# Ensure JAVA_HOME points to Java 21
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "C:\Program Files\Java\jdk-21\bin;$env:Path"

# Run Maven test suite
.\mvnw.cmd test
```
**Required Result:** `BUILD SUCCESS` with `0 failures, 0 errors`.

### B. Run Frontend Production Build
Open PowerShell in the `frontend` directory:
```powershell
cd C:\CYBER-19\frontend

# Validate production build bundle
npm run build
```
**Required Result:** `✓ built in X.XXs` with `0 errors`.

---

## 5. Commit Message Guidelines

Stage your changes and write a clear, descriptive commit message explaining **what** and **why**:

```powershell
# Stage specific modified files
git add src/main/java/com/cyber/vulnerability/service/YourService.java
git add src/test/java/com/cyber/vulnerability/service/YourServiceTest.java

# Or stage all relevant changes
git add .

# Commit with a descriptive message
git commit -m "feat: implement time-delay differential analysis for blind SQLi"
```

### Commit Message Prefix Conventions:
- `feat:` A new feature or capability
- `fix:` A bug fix
- `docs:` Documentation updates or comments
- `test:` Adding or updating automated tests
- `refactor:` Code restructuring without functional changes
- `chore:` Dependency updates or build configuration tweaks

---

## 6. Opening a Pull Request (PR)

### Step 1: Push Your Branch to GitHub
```powershell
# Push your feature branch to the remote repository
git push -u origin feature/your-feature-name
```

### Step 2: Open the Pull Request on GitHub
1. Open the repository in your browser: [https://github.com/SHAIKZILANI/CYBER-19](https://github.com/SHAIKZILANI/CYBER-19)
2. You will see a banner: **"feature/your-feature-name had recent pushes — Compare & pull request"**.
3. Click **"Compare & pull request"**.
4. Fill in the PR description:
   - **Summary of changes:** What did you build or fix?
   - **How was it tested:** Mention `.\mvnw.cmd test` and `npm run build` results.
   - **Affected components:** List frontend views or backend services touched.
5. Click **"Create pull request"**.

### Step 3: Peer Review & Merge
- At least one teammate should review the pull request diff.
- Once approved and checks pass, merge the PR into `main` using **"Squash and merge"** or **"Rebase and merge"**.

---

## 7. Syncing with Main & Resolving Conflicts

If another teammate merges changes to `main` while you are working on your branch, sync your branch to stay up to date:

```powershell
# 1. Fetch latest changes from GitHub
git fetch origin

# 2. Merge latest main into your feature branch
git merge origin/main
```

### If Git Reports a Merge Conflict:
1. Git will list conflicted files in the terminal:
   ```
   CONFLICT (content): Merge conflict in backend/src/main/resources/application.properties
   ```
2. Open the conflicted file in VS Code.
3. VS Code highlights conflict markers:
   ```
   <<<<<<< HEAD (Current Change)
   your changes
   =======
   incoming changes from main
   >>>>>>> origin/main
   ```
4. Choose **"Accept Incoming Change"**, **"Accept Current Change"**, or manually edit to combine both.
5. Save the file.
6. Re-run tests to confirm everything compiles:
   ```powershell
   cd backend; .\mvnw.cmd test
   ```
7. Stage and commit the resolved files:
   ```powershell
   git add .
   git commit -m "chore: resolve merge conflicts with main"
   git push origin feature/your-feature-name
   ```

---

## 8. Security & Credentials Policy

> [!CAUTION]
> **This repository is public.**  
> Never commit real passwords, Personal Access Tokens (PAT), API keys, or private SSH keys.

- Local secrets belong strictly in your local `.env` file (which is ignored by `.gitignore`).
- Use placeholders in documentation and templates (e.g. `your_secure_password_here`).
- If you accidentally commit a credential, notify the team immediately so the credential can be revoked and the Git history cleaned before pushing.
