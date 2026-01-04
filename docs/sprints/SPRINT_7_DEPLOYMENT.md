# Sprint 7: Production Deployment & Operations

## 🎯 Sprint Goal
Prepare the akiva-ai-crypto platform for production deployment with proper infrastructure, monitoring, and security.

---

## 📋 Task Breakdown

### ✅ DO NOW (No External Dependencies)

#### 7.1a Infrastructure Prep (CODEX)
- [ ] Create GitHub Actions CI/CD workflow (test on push)
- [ ] Docker containerization for backend (Dockerfile + docker-compose)
- [ ] Create `.env.example` production template
- [ ] Create `docker-compose.prod.yml`

#### 7.2a Security Hardening - Code Level (AC)
- [ ] Implement rate limiting middleware (slowapi)
- [ ] Add request validation middleware
- [ ] Review/harden CORS settings
- [ ] Add input sanitization
- [ ] Create security headers middleware
- [ ] Audit API endpoint authentication

#### 7.3a Observability Prep (CODEX)
- [ ] Configure structured logging (JSON format)
- [ ] Add health check endpoints (`/health`, `/ready`)
- [ ] Add metrics endpoint (`/metrics`)
- [ ] Create logging configuration for prod vs dev

#### 7.4a Performance Baseline (AC)
- [ ] Create load test scripts (locust or k6)
- [ ] Define performance benchmarks
- [ ] Document capacity expectations
- [ ] Profile critical paths

#### 7.5a Documentation (CLINE)
- [ ] Create deployment runbook template
- [ ] Document environment variables
- [ ] Create API reference updates
- [ ] Write troubleshooting guide

---

### ⏸️ PENDING (Requires External Setup)

#### 7.1b Infrastructure - External
- [ ] Set up Supabase production project
- [ ] Configure NorthFlank deployment
- [ ] Set up Vercel for frontend
- [ ] Configure production secrets

#### 7.3b Monitoring - External
- [ ] Set up Sentry project & DSN
- [ ] Configure Sentry SDK integration
- [ ] Set up alerting (PagerDuty/Slack)
- [ ] Create monitoring dashboard

#### 7.6 Go-Live
- [ ] Production smoke tests
- [ ] DNS/domain configuration
- [ ] SSL certificate setup
- [ ] Final security audit

---

## 🔧 Technical Requirements

### Backend Production Config
```python
# .env.production
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_KEY=<production-anon-key>
SUPABASE_SERVICE_KEY=<production-service-key>
JWT_SECRET=<strong-256-bit-secret>
ALLOWED_ORIGINS=https://akiva-crypto.vercel.app
LOG_LEVEL=INFO
ENVIRONMENT=production
```

### Docker Setup
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### GitHub Actions Workflow
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/tests/
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Add deployment steps
```

---

## ⏱️ Timeline - DO NOW Phase

| Task | Agent | Duration | Priority |
|------|-------|----------|----------|
| 7.1a Infrastructure Prep | CODEX | 1 day | P0 |
| 7.2a Security Hardening | AC | 1 day | P0 |
| 7.3a Observability Prep | CODEX | 0.5 day | P1 |
| 7.4a Performance Baseline | AC | 0.5 day | P1 |
| 7.5a Documentation | CLINE | 1 day | P2 |

**Total: ~2-3 days parallel execution**

---

## ✅ Definition of Done - This Phase

1. GitHub Actions workflow created and tested
2. Dockerfile builds successfully
3. Rate limiting middleware implemented
4. Health check endpoints working
5. Structured logging configured
6. Load test scripts created
7. Documentation updated

---

## ⏸️ PENDING Phase Checklist (When Ready)

- [ ] Supabase production project created
- [ ] NorthFlank account/project setup
- [ ] Sentry account/project setup
- [ ] Domain/DNS configured
- [ ] Production secrets in vault
- [ ] Go-live approval

