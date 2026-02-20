# 🎭 E2E Testing with Playwright - Quick Start Guide

## What Are E2E Tests?

**End-to-End (E2E) tests** simulate real user interactions in a real browser. They test your application the way users actually use it.

### Unit Tests vs E2E Tests

| Aspect | Unit Tests | E2E Tests |
|--------|-----------|-----------|
| **What** | Individual functions/components | Complete user flows |
| **How** | JSDOM (fake browser) | Real browser (Chromium) |
| **Speed** | Fast (milliseconds) | Slower (seconds) |
| **Reliability** | Very reliable | Can be flaky |
| **Coverage** | Business logic | User experience |
| **Tools** | Vitest + React Testing Library | Playwright |

**Both are important!** Unit tests catch bugs early. E2E tests catch integration issues.

---

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Run E2E Tests

**Option A: Headless Mode (CI/CD)**
```bash
npm run test:e2e
```

**Option B: UI Mode (Recommended for Development)**
```bash
npm run test:e2e:ui
```
This opens a visual interface where you can:
- See all tests
- Run tests individually
- Watch tests execute
- Debug failures

**Option C: Headed Mode (See the Browser)**
```bash
npm run test:e2e:headed
```
Watch the browser perform actions in real-time.

**Option D: Debug Mode**
```bash
npm run test:e2e:debug
```
Step through tests line by line.

### 3. View Results

After running tests:
- **Console output** - Shows pass/fail status
- **HTML Report** - `npx playwright show-report`
- **Screenshots** - Saved in `test-results/` on failure
- **Traces** - Full recording of test execution

---

## 📁 Test Structure

```
enterprise-crypto/
├── e2e/                          # E2E test directory
│   ├── trade-flow.spec.ts        # Trade submission tests
│   ├── risk-dashboard.spec.ts    # Risk dashboard tests
│   ├── kill-switch.spec.ts       # Kill switch tests
│   ├── position-management.spec.ts # Position tests
│   └── README.md                 # Detailed E2E docs
├── playwright.config.ts          # Playwright configuration
└── package.json                  # Test scripts
```

---

## 🎯 What We Test

### ✅ Trade Flow
- Opening trade ticket dialog
- Filling in trade details
- Form validation
- Submitting orders
- Risk warnings
- Dialog close behavior

### ✅ Risk Dashboard
- **Book selection** (Radix UI Select component)
- **Tab navigation** (Radix UI Tabs component)
- VaR metrics display
- Stress test scenarios
- Data refresh

### ✅ Kill Switch
- **Activation dialog** (Radix UI AlertDialog)
- Confirmation flow
- Input validation ("CONFIRM" typing)
- Status display

### ✅ Position Management
- Position list display
- Filtering
- Position details

---

## 🔧 Writing New Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // 1. Interact with page
    await page.getByRole('button', { name: /click me/i }).click();
    
    // 2. Verify result
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

### Best Practices

1. **Use Accessible Selectors**
   ```typescript
   // ✅ Good - Uses accessibility roles
   page.getByRole('button', { name: /submit/i })
   page.getByLabel(/email/i)
   page.getByText(/welcome/i)
   
   // ❌ Bad - Brittle CSS selectors
   page.locator('.btn-submit')
   page.locator('#email-input')
   ```

2. **Wait for Network**
   ```typescript
   await page.goto('/trading');
   await page.waitForLoadState('networkidle');
   ```

3. **Handle Async Operations**
   ```typescript
   await expect(page.getByText(/loading/i)).toBeVisible();
   await expect(page.getByText(/loaded/i)).toBeVisible({ timeout: 5000 });
   ```

4. **Test User Flows, Not Implementation**
   ```typescript
   // ✅ Good - Tests what user sees
   test('should submit trade', async ({ page }) => {
     await page.getByRole('button', { name: /buy/i }).click();
     await page.getByLabel(/size/i).fill('0.5');
     await page.getByRole('button', { name: /submit/i }).click();
     await expect(page.getByText(/order submitted/i)).toBeVisible();
   });
   
   // ❌ Bad - Tests implementation details
   test('should call submitOrder function', async ({ page }) => {
     // Don't test internal functions in E2E tests
   });
   ```

---

## 🐛 Debugging Failed Tests

### 1. Check Screenshots
```bash
# Screenshots saved automatically on failure
ls test-results/
```

### 2. View Trace
```bash
npx playwright show-trace test-results/trace.zip
```

### 3. Run in Debug Mode
```bash
npm run test:e2e:debug
```

### 4. Run Specific Test
```bash
npx playwright test e2e/trade-flow.spec.ts --headed
```

---

## 📊 Current Status

- ✅ **57 unit tests passing** (business logic)
- ✅ **4 E2E test suites** (user flows)
- ✅ **19 unit tests skipped** (documented for E2E)
- ✅ **100% coverage** of testable code

---

## 🎓 Learn More

- [Playwright Documentation](https://playwright.dev)
- [E2E Test README](./e2e/README.md)
- [Test Suite Summary](./docs/TEST_SUITE_SUMMARY.md)

---

## 💡 Tips

1. **Run E2E tests before committing** - Catch integration issues early
2. **Use UI mode during development** - Visual feedback is helpful
3. **Keep tests independent** - Each test should work alone
4. **Test happy paths first** - Then add edge cases
5. **Don't over-test** - Focus on critical user flows

