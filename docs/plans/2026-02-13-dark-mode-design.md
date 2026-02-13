# Dark Mode — Design Document

**Date:** 2026-02-13
**Approach:** Tailwind CSS v4 `dark:` variants with class-based strategy

## Overview

Add a light/dark theme toggle to the Foot Du Lundi dashboard. The theme follows the OS preference by default (`prefers-color-scheme`) and allows manual override via a toggle button in the header.

## Architecture

### 1. Tailwind Configuration (index.css)

Override the default `dark:` variant to use class-based detection instead of the media query:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

This lets us control dark mode by toggling the `.dark` class on `<html>`.

### 2. ThemeProvider (new React context)

**File:** `frontend/src/hooks/use-theme.tsx`

Exposes:
- `theme`: `'light' | 'dark' | 'system'` (user preference)
- `resolvedTheme`: `'light' | 'dark'` (effective value)
- `setTheme(theme)`: setter

Behavior:
- On mount: read `localStorage('theme')`, fall back to `'system'`
- If `'system'`: listen to `matchMedia('(prefers-color-scheme: dark)')` changes
- Apply/remove `.dark` class on `document.documentElement`
- Persist user choice to `localStorage`
- Update `<meta name="theme-color">` dynamically

### 3. Toggle Button (Header)

A sun/moon icon button in `Header.tsx`, next to the existing "Parametres" button. Clicking cycles through: system -> light -> dark -> system.

### 4. Color Mapping

| Element | Light | Dark |
|---------|-------|------|
| Body background | `bg-slate-50` | `dark:bg-slate-900` |
| Cards/containers | `bg-white` | `dark:bg-slate-800` |
| Primary text | `text-slate-900` | `dark:text-slate-100` |
| Secondary text | `text-slate-500` | `dark:text-slate-400` |
| Borders | `border-slate-200` | `dark:border-slate-700` |
| Inputs | `bg-white border-slate-200` | `dark:bg-slate-800 dark:border-slate-600` |
| Status badges | Keep accent colors (emerald, red, amber) with adapted backgrounds |

### 5. Components to Modify

All files in `frontend/src/components/` plus `App.tsx` (~20 files total):
- `ui/Button.tsx` — button variants
- `ui/Badge.tsx` — status badges
- `ui/Toggle.tsx` — switch
- `ui/Spinner.tsx` — loading
- `ui/Toast.tsx` — notifications
- `ui/ConfirmDialog.tsx` — modal
- `layout/Header.tsx` — add toggle button
- `layout/StatsBar.tsx` — KPI cards
- `rules/RuleCard.tsx`, `RuleForm.tsx`, `PlaygroundPrefs.tsx`
- `bookings/BookingsList.tsx`, `Pagination.tsx`
- `manual/SlotSearch.tsx`, `SlotResults.tsx`
- `logs/LogsTable.tsx`
- `setup/SetupScreen.tsx`
- `App.tsx` — wrap with ThemeProvider, body background

### 6. PWA Considerations

Update `<meta name="theme-color">` dynamically based on resolved theme:
- Light: `#f8fafc` (slate-50)
- Dark: `#0f172a` (slate-900)
