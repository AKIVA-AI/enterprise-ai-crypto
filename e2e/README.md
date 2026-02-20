# E2E Tests with Playwright

This directory contains end-to-end (E2E) tests for the Enterprise Crypto Trading Platform using Playwright.

## Why E2E Tests?

E2E tests complement our unit tests by testing **real user interactions** in a **real browser**. They are particularly valuable for:

1. **Complex UI Components** - Radix UI components (Select, AlertDialog, Tabs) that are difficult to test with unit tests
2. **Multi-Step Flows** - Complete user journeys like trade submission, kill switch activation
3. **Real Browser Behavior** - Actual DOM rendering, event handling, and state management
4. **Integration Testing** - Testing how components work together in the full application

## Test Coverage

### ✅ Trade Flow (`trade-flow.spec.ts`)
- Opening trade ticket
- Filling trade form
- Form validation
- Trade submission
- Risk warnings
- Dialog interactions

### ✅ Risk Dashboard (`risk-dashboard.spec.ts`)
- Book selection (Radix UI Select)
- Tab navigation (Radix UI Tabs)
- VaR metrics display
- Stress test scenarios
- Data refresh

### ✅ Kill Switch (`kill-switch.spec.ts`)
- Activation dialog (Radix UI AlertDialog)
- Confirmation flow
- Input validation
- Status display

### ✅ Position Management (`position-management.spec.ts`)
- Position list display
- Filtering
- Position details

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/trade-flow.spec.ts
```

### Run all tests (unit + E2E)
```bash
npm run test:all
```

## Test Structure

Each test file follows this pattern:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page
    await page.goto('/path');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.getByRole('button', { name: /click me/i }).click();
    
    // Assert
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

## Best Practices

1. **Use Accessible Selectors** - Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for Network** - Use `waitForLoadState('networkidle')` after navigation
3. **Explicit Waits** - Use `waitFor` with timeouts for async operations
4. **Descriptive Names** - Test names should clearly describe what they test
5. **Independent Tests** - Each test should be able to run independently

## CI/CD Integration

E2E tests are configured to run in CI with:
- Automatic retries (2 retries on failure)
- Screenshot on failure
- Trace collection for debugging
- HTML report generation

## Debugging Failed Tests

When a test fails:

1. **Check Screenshots** - Located in `test-results/`
2. **View Trace** - Run `npx playwright show-trace trace.zip`
3. **Run in Debug Mode** - `npm run test:e2e:debug`
4. **Run in Headed Mode** - `npm run test:e2e:headed` to see browser

## Relationship to Unit Tests

| Test Type | Purpose | Tools | Coverage |
|-----------|---------|-------|----------|
| **Unit Tests** | Test business logic, utilities, isolated components | Vitest + React Testing Library | 57 tests passing |
| **E2E Tests** | Test user flows, complex UI, integration | Playwright | 4 test suites |

**Unit tests** verify that individual pieces work correctly.
**E2E tests** verify that the whole application works for users.

## Adding New Tests

1. Create a new `.spec.ts` file in `e2e/`
2. Follow the existing test structure
3. Use accessible selectors
4. Add descriptive test names
5. Run locally before committing

## Notes

- E2E tests require the dev server to be running (handled automatically)
- Tests run in Chromium by default (can be configured for Firefox/Safari)
- Some tests may show "no data" states if backend is not running - this is expected
- Tests use timeouts to handle async operations gracefully

