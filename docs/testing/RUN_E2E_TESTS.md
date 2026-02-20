# 🎭 How to Run E2E Tests - Simple Guide

## 🚀 **Quick Start (2 Steps)**

### **Step 1: Start Dev Server**

Open a terminal and run:
```bash
npm run dev
```

**Wait for this message:**
```
➜  Local:   http://localhost:5173/
```

**✅ Keep this terminal open!**

---

### **Step 2: Run Tests**

Open a **NEW terminal** and run:

```bash
npm run test:e2e:manual:headed
```

**You should see:**
- Browser opens automatically
- Navigates to your app
- Performs actions (clicks, types, etc.)
- Tests pass/fail
- Browser closes

---

## 🎯 **Different Ways to Run Tests**

### **See Browser (Recommended for First Time)**
```bash
npm run test:e2e:manual:headed
```
Watch the browser perform actions in real-time.

### **Visual UI Mode (Best for Development)**
```bash
npm run test:e2e:manual:ui
```
Opens a visual interface to run and debug tests.

### **Headless Mode (Fastest)**
```bash
npm run test:e2e:manual
```
Runs tests without showing browser (like CI/CD).

---

## 📝 **Run Specific Tests**

### **Run One Test File**
```bash
# Trade flow tests only
npx playwright test e2e/trade-flow.spec.ts --config=playwright.config.manual.ts --headed

# Risk dashboard tests only
npx playwright test e2e/risk-dashboard.spec.ts --config=playwright.config.manual.ts --headed

# Kill switch tests only
npx playwright test e2e/kill-switch.spec.ts --config=playwright.config.manual.ts --headed

# Position management tests only
npx playwright test e2e/position-management.spec.ts --config=playwright.config.manual.ts --headed
```

### **Run One Specific Test**
```bash
npx playwright test -g "should open trade ticket" --config=playwright.config.manual.ts --headed
```

---

## ⚠️ **Troubleshooting**

### **Problem: "Connection Refused" Error**

**Solution:** Make sure dev server is running in another terminal.

```bash
# Terminal 1
npm run dev

# Terminal 2 (wait for dev server to start)
npm run test:e2e:manual:headed
```

---

### **Problem: Tests Timeout**

**Solution:** Wait longer for dev server to fully start (10-15 seconds).

---

### **Problem: Nothing Happens**

**Solution:** Check that `http://localhost:5173` opens in your browser.

---

## ✅ **Complete Example**

### **Terminal 1:**
```bash
cd enterprise-crypto
npm run dev
```

**Wait for:** `➜  Local:   http://localhost:5173/`

### **Terminal 2:**
```bash
cd enterprise-crypto
npm run test:e2e:manual:headed
```

**Watch the magic happen!** 🎭✨

---

## 📊 **What You'll See**

When tests run successfully:
1. ✅ Browser opens
2. ✅ Navigates to your app
3. ✅ Clicks buttons, fills forms
4. ✅ Verifies results
5. ✅ Shows pass/fail status
6. ✅ Browser closes

---

## 🎉 **That's It!**

You now have **27 E2E tests** ready to run!

**Remember:**
- Terminal 1: `npm run dev` (keep running)
- Terminal 2: `npm run test:e2e:manual:headed` (run tests)

Happy testing! 🚀

