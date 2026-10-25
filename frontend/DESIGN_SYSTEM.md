# DESIGN SYSTEM
## Area Specific Shelter Design for Thermal Environment

> **Scope**: This document is the single source of truth for every UI decision in this project.
> Every developer, AI assistant, or contributor **must** read and follow this document before touching any UI code.

---

## 1. Product Overview

**Product Name**: Area Specific Shelter Design for Thermal Environment
**Tagline**: *Climate-aware architecture — designed for where you live.*

A web application that:
1. Detects or accepts the user''s location.
2. Fetches live weather data and determines the **climate zone**.
3. Re-themes the entire UI to match that zone (the *living climate* concept).
4. Recommends and visualises climate-appropriate shelter designs.
5. Always shows the disclaimer: *"This tool provides design guidance only. Consult a qualified architect and refer to local building codes before construction."*

---

## 2. The Living Climate Concept

The root `<html>` (or top-level wrapper) element carries a `data-zone` attribute that drives all theming via CSS custom properties.

```html
<!-- Example: user is in a hot-dry region -->
<html data-zone="HOT_DRY">
```

When the zone changes (e.g., user searches a new location), update `data-zone` and the entire UI cross-fades to the new palette in **800 ms** via CSS transitions on every token.

---

## 3. Climate Zones & Colour Palettes

### 3.1 Zone Definitions

| Zone ID | Description | Typical Regions |
|---|---|---|
| `HOT_DRY` | Arid, desert climates | Middle East, Rajasthan, Sahara, Arizona |
| `WARM_HUMID` | Tropical, coastal humid | Kerala, Southeast Asia, Caribbean |
| `COMPOSITE` | Mixed seasonal extremes | Central India, Central China, Midwest US |
| `TEMPERATE` | Mild four-season | Western Europe, Pacific Northwest, New Zealand |
| `COLD` | Sub-arctic, alpine, continental | Canada, Scandinavia, Siberia, Himalayas |
| *(none / loading)* | Default before zone is known | — |

### 3.2 CSS Custom Properties per Zone

Define all tokens on `:root[data-zone="ZONE_ID"]`. Every token transitions smoothly.

```css
/* --- Transition on every property --- */
:root {
  transition:
    --bg           800ms ease,
    --surface      800ms ease,
    --surface-alt  800ms ease,
    --primary      800ms ease,
    --accent       800ms ease,
    --text         800ms ease,
    --muted        800ms ease,
    --border       800ms ease,
    --shadow-color 800ms ease;
}
```

> **Note**: CSS custom property transitions require `@property` declarations (Houdini) for smooth interpolation.
> Register each property as `<color>` type. Provide a JS fallback that swaps a class and relies on
> `transition: background-color, color 800ms ease` on elements for broader browser support.

#### Default (no zone / loading)
```css
:root {
  --bg:           #F2F4F3;
  --surface:      #FFFFFF;
  --surface-alt:  #E8EDEC;
  --primary:      #0F766E;   /* neutral teal */
  --accent:       #38BDF8;
  --text:         #1A2E2B;
  --muted:        #6B7C79;
  --border:       rgba(15, 118, 110, 0.15);
  --shadow-color: 15, 118, 110;
}
```

#### HOT_DRY — Sand, Terracotta, Deep Brown
```css
:root[data-zone="HOT_DRY"] {
  --bg:           #F4D9A8;   /* sand */
  --surface:      #FDF3E3;
  --surface-alt:  #EBC98A;
  --primary:      #C8553D;   /* terracotta */
  --accent:       #8B3A25;
  --text:         #3B1F14;   /* deep brown */
  --muted:        #7A5540;
  --border:       rgba(200, 85, 61, 0.20);
  --shadow-color: 59, 31, 20;
}
```

#### WARM_HUMID — Teal, Lagoon, Deep Green
```css
:root[data-zone="WARM_HUMID"] {
  --bg:           #062C2B;   /* deep green */
  --surface:      #0D3D3B;
  --surface-alt:  #0F4F4D;
  --primary:      #0F766E;   /* teal */
  --accent:       #38BDF8;   /* lagoon */
  --text:         #E0F7F6;
  --muted:        #7ECCC7;
  --border:       rgba(56, 189, 248, 0.20);
  --shadow-color: 6, 44, 43;
}
```

#### COMPOSITE — Amber, Slate, Sage
```css
:root[data-zone="COMPOSITE"] {
  --bg:           #334155;   /* slate */
  --surface:      #3E5068;
  --surface-alt:  #293547;
  --primary:      #F59E0B;   /* sunset amber */
  --accent:       #84A98C;   /* sage */
  --text:         #F8FAFC;
  --muted:        #94A3B8;
  --border:       rgba(245, 158, 11, 0.20);
  --shadow-color: 51, 65, 85;
}
```

#### TEMPERATE — Fresh Green, Sky, Cream
```css
:root[data-zone="TEMPERATE"] {
  --bg:           #F7F5EC;   /* cream */
  --surface:      #FFFFFF;
  --surface-alt:  #ECF9EE;
  --primary:      #22C55E;   /* fresh green */
  --accent:       #7DD3FC;   /* sky */
  --text:         #1A2E1C;
  --muted:        #5A7A5D;
  --border:       rgba(34, 197, 94, 0.20);
  --shadow-color: 34, 197, 94;
}
```

#### COLD — Ice Blue, Indigo, Snow, Navy
```css
:root[data-zone="COLD"] {
  --bg:           #0B1B33;   /* navy */
  --surface:      #132240;
  --surface-alt:  #1C2E50;
  --primary:      #3B5B92;   /* indigo */
  --accent:       #BFE3F5;   /* ice blue */
  --text:         #F4FAFD;   /* snow */
  --muted:        #8AAAC8;
  --border:       rgba(191, 227, 245, 0.15);
  --shadow-color: 11, 27, 51;
}
```

---

## 4. Typography

### 4.1 Font Choices

| Role | Font | Usage |
|---|---|---|
| **Heading** | **Sora** (Google Fonts) | All `h1`–`h3`, hero text, card titles |
| **Body** | **Inter** (Google Fonts) | Body copy, labels, inputs, metadata |

Import both in the app''s root HTML or CSS:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
```

### 4.2 Type Scale

```css
:root {
  --text-xs:   0.75rem;   /*  12px */
  --text-sm:   0.875rem;  /*  14px */
  --text-base: 1rem;      /*  16px */
  --text-lg:   1.125rem;  /*  18px */
  --text-xl:   1.25rem;   /*  20px */
  --text-2xl:  1.5rem;    /*  24px */
  --text-3xl:  1.875rem;  /*  30px */
  --text-4xl:  2.25rem;   /*  36px */
  --text-5xl:  3rem;      /*  48px */

  --weight-normal:    400;
  --weight-medium:    500;
  --weight-semibold:  600;
  --weight-bold:      700;
  --weight-extrabold: 800;

  --leading-tight:   1.2;
  --leading-normal:  1.5;
  --leading-relaxed: 1.75;
}

body {
  font-family: ''Inter'', system-ui, sans-serif;
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text);
}

h1, h2, h3 {
  font-family: ''Sora'', system-ui, sans-serif;
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
}

h1 { font-size: var(--text-5xl); }
h2 { font-size: var(--text-3xl); }
h3 { font-size: var(--text-xl);  }
```

---

## 5. Spacing & Layout

```css
:root {
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.25rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
}
```

- **Mobile-first**: design for 375 px viewport, then expand with `min-width` media queries.
- **Max content width**: `1200px`, centred with `margin-inline: auto`.
- **Page padding**: `--space-4` mobile ? `--space-8` tablet ? `--space-16` desktop.
- **Grid**: 4-column mobile, 8-column tablet, 12-column desktop (CSS Grid).

---

## 6. Border Radius & Shadows

```css
:root {
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;      /* default card radius */
  --radius-xl:   20px;
  --radius-2xl:  24px;      /* large panels */
  --radius-full: 9999px;    /* pills / avatars */

  --shadow-sm: 0 1px  4px rgba(var(--shadow-color), 0.08);
  --shadow-md: 0 4px 16px rgba(var(--shadow-color), 0.12);
  --shadow-lg: 0 8px 32px rgba(var(--shadow-color), 0.18);
  --shadow-xl: 0 16px 48px rgba(var(--shadow-color), 0.24);
}
```

---

## 7. Frosted-Glass Cards

The primary surface pattern throughout the app.

```css
.card {
  background: rgba(var(--surface-rgb), 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}
```

> **Note**: Define `--surface-rgb` alongside every zone palette as the RGB-separated equivalent
> of `--surface`, for use in `rgba()`. E.g., `--surface-rgb: 255, 255, 255;`.

---

## 8. Icons

Use **Lucide React** (`lucide-react`) exclusively.

```bash
npm install lucide-react
```

- Default sizes: `20px` inline, `24px` standalone, `32px` feature icons.
- Stroke width: `1.75` for elegance.
- Decorative icons: `aria-hidden="true"`. Meaningful icons: `aria-label` + `role="img"`.

```tsx
import { Thermometer } from ''lucide-react'';

// Decorative:
<Thermometer size={24} strokeWidth={1.75} aria-hidden="true" />

// Meaningful:
<Thermometer size={24} strokeWidth={1.75} aria-label="Temperature" role="img" />
```

---

## 9. Motion — Framer Motion

### 9.1 Core Rules

| Rule | Value |
|---|---|
| Entrance duration | 400–600 ms |
| Easing (entrance) | `easeOut` |
| List stagger delay | 60–80 ms between items |
| Hover / tap feedback | = 200 ms |
| Max interaction animation | 1.2 s |
| Animate | `transform` and `opacity` **only** |
| Never animate | `width`, `height`, `top`, `left` (layout properties) |

### 9.2 Reusable Variants — `src/motion/variants.ts`

```ts
import { Variants } from ''framer-motion'';

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0,
    transition: { duration: 0.5, ease: ''easeOut'' } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1,
    transition: { duration: 0.4, ease: ''easeOut'' } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1,
    transition: { duration: 0.45, ease: ''easeOut'' } },
};

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export const hoverTap = {
  whileHover: { scale: 1.03, transition: { duration: 0.15 } },
  whileTap:   { scale: 0.97, transition: { duration: 0.1  } },
};
```

### 9.3 Reduced Motion

```ts
// src/hooks/useReducedMotion.ts
import { useReducedMotion as useFramerReducedMotion } from ''framer-motion'';

export function useReducedMotion() {
  return useFramerReducedMotion() ?? false;
}
```

When `prefers-reduced-motion: reduce`:
- No translate / scale / rotate. Use `fadeIn` only.
- Stagger removed — all items appear simultaneously.
- Simple 200 ms opacity fades are still allowed.

---

## 10. Component Catalogue

| Component | Description |
|---|---|
| `ZoneThemeProvider` | Sets `data-zone` on `document.documentElement`; triggers 800 ms cross-fade |
| `WeatherPanel` | Frosted card with location, temp, humidity, wind; skeleton + error states |
| `ClimateZoneBadge` | Pill badge with zone name; `scaleIn` entrance |
| `ShelterDesignCard` | Large card with design name, suitability tag, features, illustration, CTA |
| `ShelterDetailModal` | Full modal with rationale, materials, cross-section, performance graph |
| `LocationSearch` | Rounded search bar; frosted autocomplete dropdown; keyboard navigable |
| `Skeleton` | Shimmer placeholder matching the shape of the loading component |
| `ErrorState` | Centred card: icon + heading + friendly message + retry button |
| `DisclaimerBanner` | Sticky footer — always visible, never dismissable |

---

## 11. Accessibility Rules

| Requirement | Implementation |
|---|---|
| Colour contrast | Minimum 4.5 : 1 (WCAG AA) for all zone palettes |
| Focus rings | `outline: 2px solid var(--primary); outline-offset: 3px` on all interactive elements |
| Alt text | All images and illustrations must have descriptive `alt` attributes |
| Keyboard nav | All interactive elements reachable and operable via keyboard |
| ARIA | Modals: `role="dialog"` + `aria-modal` + focus trap; weather updates: `aria-live="polite"` |
| Headings | Single `<h1>` per page; logical `h2` ? `h3` hierarchy |
| Motion | Respect `prefers-reduced-motion` (see §9.3) |
| Semantic HTML | `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` — no `div` soup |

---

## 12. Mock Data

Until the backend is ready, all data is sourced from **`src/mock/`**.

```
src/mock/
  weather.ts        ? mock weather API response
  zones.ts          ? mock zone detection result
  shelterDesigns.ts ? array of shelter design objects
  index.ts          ? re-exports all mocks
```

Rules:
- Mock shapes must exactly match the real API contract.
- `VITE_USE_MOCK=true` env var (or equivalent) switches between mock and live.
- **No API keys or secrets in source code.** Use `.env.local` (gitignored).

---

## 13. File & Folder Conventions

```
src/
  components/    ? reusable UI components (one file per component)
  pages/         ? top-level route pages
  hooks/         ? custom React hooks
  mock/          ? mock data (see §12)
  motion/        ? Framer Motion variants
  styles/        ? global CSS, zone palettes, design tokens
    global.css
    zones.css
    tokens.css
  utils/         ? pure utility functions (zone detection, weather formatting)
  types/         ? shared TypeScript interfaces
```

---

## 14. Development Conventions

1. **Mobile-first CSS** — base styles at 375 px, scale up with `min-width` queries.
2. **No inline styles** (except Framer Motion `style` prop for dynamic values).
3. **CSS custom properties** for all tokens — never hard-code a colour or radius.
4. **Zone switching** is done exclusively via the `data-zone` attribute on `:root`.
5. **Loading + error states** required on every component that fetches data.
6. **Disclaimer** visible on every page view at all times.
7. **Commit prefixes**: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`.

---

## 15. Post-Task Testing Checklist

After every UI task, verify:

- [ ] All five zone palettes render correctly (change `data-zone` in DevTools).
- [ ] Zone transition animates in ˜ 800 ms.
- [ ] Loading skeleton appears (simulate network delay).
- [ ] Error state renders; "retry" works.
- [ ] Keyboard navigation works end-to-end.
- [ ] Animations are suppressed with `prefers-reduced-motion` (DevTools ? Rendering ? Emulate).
- [ ] Disclaimer is visible.
- [ ] No API keys in source or Network tab.
- [ ] Contrast passes WCAG AA (DevTools or axe extension).

---

## 16. Quick Reference — Design Token Cheat-Sheet

| Token | Role |
|---|---|
| `--bg` | Page / outermost background |
| `--surface` | Card and panel fill |
| `--surface-alt` | Secondary surface (nested cards) |
| `--primary` | Brand colour, primary buttons, active states |
| `--accent` | Highlights, badges, links, icon tints |
| `--text` | Primary body text |
| `--muted` | Secondary / placeholder text, captions |
| `--border` | Card borders and dividers |
| `--shadow-color` | RGB triplet for `box-shadow` |
| `--radius-lg` | Default card radius (16 px) |
| `--radius-2xl` | Large panel radius (24 px) |
| `--shadow-md` | Default card shadow |
| `--shadow-xl` | Hover / elevated shadow |

---

*Last updated: 2026-10-03 · Version 1.0*
