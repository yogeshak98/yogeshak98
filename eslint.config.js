// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],
  {
    ignores: [
      "dist/",
      ".astro/",
      "*.config.mjs",
      "package-lock.json",
      "public/"
    ],
  },
);
