{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }],
    "@typescript-eslint/no-explicit-any": "off"
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "env": {
    "browser": true,
    "es2020": true
  }
}
