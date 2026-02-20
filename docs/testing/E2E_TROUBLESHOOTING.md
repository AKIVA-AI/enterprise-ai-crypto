# 🔧 E2E Testing Troubleshooting Guide

## Issue: Playwright Opens and Closes Immediately

This happens when the dev server takes too long to start or there's a configuration issue.

---

## ✅ **Solution: Manual Two-Step Process**

### **Step 1: Start Dev Server**

Open a terminal and run:
```bash
cd enterprise-crypto
npm run dev
```

**Wait for the server to start.** You should see:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal open!** The dev server must stay running.

---

### **Step 2: Run E2E Tests**

Open a **NEW terminal** (keep the first one running) and run:

#### **Option A: Run All Tests (Headless)**
```bash
cd enterprise-crypto
npx playwright test --config=playwright.config.manual.ts
```

#### **Option B: Run with UI Mode**
```bash
npx playwright test --config=playwright.config.manual.ts --ui
```

#### **Option C: Run One Test File (See Browser)**
```bash
npx playwright test e2e/trade-flow.spec.ts --config=playwright.config.manual.ts --headed
```

#### **Option D: Run Specific Test**
```bash
npx playwright test -g "should open trade ticket" --config=playwright.config.manual.ts --headed
```

---

## 🎯 **Quick Test to Verify Setup**

### **1. Start Dev Server**
```bash
npm run dev
```

### **2. In New Terminal, Run One Test**
```bash
npx playwright test e2e/trade-flow.spec.ts --config=playwright.config.manual.ts --headed --max-failures=1
```

This will:
- Run only the trade-flow tests
- Show the browser (`--headed`)
- Stop after first failure (`--max-failures=1`)

---

## 🐛 **Common Issues**

### **Issue 1: "Error: page.goto: net::ERR_CONNECTION_REFUSED"**

**Cause:** Dev server is not running.

**Solution:**
1. Make sure dev server is running in another terminal
2. Check that `http://localhost:5173` is accessible in your browser
3. Wait a few seconds after starting dev server before running tests

---

### **Issue 2: Tests Timeout**

**Cause:** Page takes too long to load.

**Solution:**
1. Increase timeout in test:
```typescript
test('my test', async ({ page }) => {
  await page.goto('/', { timeout: 30000 }); // 30 seconds
});
```

2. Or run with longer timeout:
```bash
npx playwright test --timeout=60000
```

---

### **Issue 3: "Cannot find module '@playwright/test'"**

**Cause:** Playwright not installed.

**Solution:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

---

### **Issue 4: Tests Pass But Nothing Visible**

**Cause:** Running in headless mode.

**Solution:** Add `--headed` flag:
```bash
npx playwright test --headed
```

---

## 📝 **Updated NPM Scripts**

Add these to `package.json` for easier manual testing:

```json
{
  "scripts": {
    "test:e2e:manual": "playwright test --config=playwright.config.manual.ts",
    "test:e2e:manual:ui": "playwright test --config=playwright.config.manual.ts --ui",
    "test:e2e:manual:headed": "playwright test --config=playwright.config.manual.ts --headed"
  }
}
```

Then run:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e:manual:headed
```

---

## 🎬 **Step-by-Step Demo**

### **Complete Workflow:**

1. **Open Terminal 1:**
```bash
cd enterprise-crypto
npm run dev
```
Wait for "ready in XXX ms"

2. **Open Terminal 2:**
```bash
cd enterprise-crypto
npx playwright test e2e/trade-flow.spec.ts --config=playwright.config.manual.ts --headed
```

3. **Watch the magic!** 🎭
   - Browser opens
   - Navigates to your app
   - Clicks buttons
   - Fills forms
   - Verifies results

---

## 🔍 **Debugging Tips**

### **See What's Happening:**
```bash
# Run with headed mode to see browser
npx playwright test --headed --config=playwright.config.manual.ts

# Run with debug mode to step through
npx playwright test --debug --config=playwright.config.manual.ts

# Run with UI mode for visual interface
npx playwright test --ui --config=playwright.config.manual.ts
```

### **Check Specific Test:**
```bash
# List all tests
npx playwright test --list

# Run specific test
npx playwright test -g "should open trade ticket" --headed --config=playwright.config.manual.ts
```

### **View Test Report:**
```bash
# After running tests
npx playwright show-report
```

---

## ✅ **Verification Checklist**

Before running tests, verify:

- [ ] Dev server is running (`npm run dev`)
- [ ] `http://localhost:5173` opens in browser
- [ ] Playwright is installed (`npx playwright --version`)
- [ ] Chromium is installed (`npx playwright install chromium`)
- [ ] You're in the correct directory

---

## 🎉 **Success Criteria**

You'll know it's working when:
1. Browser opens automatically
2. Navigates to your app
3. Performs actions (clicks, types)
4. Tests pass with green checkmarks
5. Browser closes automatically

---

## 📞 **Still Having Issues?**

Try this minimal test:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run minimal test
npx playwright test --config=playwright.config.manual.ts --headed --max-failures=1 --timeout=30000
```

If this works, your setup is correct! 🎉

If not, check:
1. Is dev server running? (Check Terminal 1)
2. Can you open `http://localhost:5173` in browser?
3. Are there any errors in Terminal 1?

---

## 🚀 **Next Steps**

Once tests are running:
1. Try different test files
2. Experiment with `--headed` vs headless
3. Use `--ui` mode for visual debugging
4. Add your own tests

Happy testing! 🎭✨

