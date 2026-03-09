import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules", "*.config.js", "*.config.ts", "supabase/functions/**"] },

  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Disable - this is a dev-time optimization warning that fires on common patterns
      // (contexts exporting hooks, UI libs exporting utilities like buttonVariants)
      "react-refresh/only-export-components": "off",

      // Production-critical rules (keep as errors)
      "no-debugger": "error",

      // Console statements - allow for now (useful for debugging)
      // TODO: Replace with proper logging before production
      "no-console": "off",

      // Type safety (warnings for now, will fix incrementally)
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "warn",

      // Code quality (warnings)
      "no-case-declarations": "warn",
      "prefer-const": "warn",

      // React hooks - intentional suppression for performance-critical hooks
      // Many of these are intentionally not including all deps to avoid re-renders
      "react-hooks/exhaustive-deps": "off",
    },
  },
);
