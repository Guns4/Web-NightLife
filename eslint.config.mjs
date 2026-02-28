import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Configure CSS at-rules for Tailwind CSS v4
  {
    files: ["**/*.css"],
    rules: {
      // Allow Tailwind CSS v4 @theme at-rule and other common CSS at-rules
      "unknown-at-rules": [
        "error",
        {
          ignore: [
            "theme",
            "import",
            "layer",
            "keyframes",
            "font-face",
            "supports",
            "media",
            "charset",
            "container",
            "property",
            "counter-style",
            "font-feature-values",
            "viewport",
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
