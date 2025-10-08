# Tailwind v4 migration (minimal setup)

Converted to Tailwind CSS v4.

- `tailwindcss` -> `^4.x`
- PostCSS uses `@tailwindcss/postcss`
- `src/index.css` now contains:
  ```css
  @import "tailwindcss";
  @source "../index.html";
  @source "./**/*.{js,jsx,ts,tsx}";
  ```
- Old Tailwind config is backed up as `tailwind.config.*.bak_v3_preserved`

## Run locally
```bash
# Windows PowerShell/cmd
npx rimraf node_modules package-lock.json
npm install
npm run dev
```

## Porting theme tokens to v4
If you had custom theme in `tailwind.config.js`, define them with `@theme` in `src/index.css`:
```css
@theme {
  --color-brand: #0ea5e9;
  --radius-card: 12px;
}
```
And use e.g. `bg-[--color-brand]` or `rounded-[--radius-card]`.
