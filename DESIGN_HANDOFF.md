# DESIGN_HANDOFF.md

> **Audience:** Claude Design (or any design-focused AI / designer) performing **visual
> refinement** of ComplexityLab.
> **Purpose:** A complete inventory of the implemented frontend — components, pages, layouts,
> routes, design tokens, data flow, responsive behavior, and the seams where placeholder styling
> intentionally awaits polish.
> **Companion doc:** `HANDOFF.md` (engineering/architecture history). This file is the **design**
> source of truth.

---

## 0. TL;DR for Designers

- **Stack:** Next.js 16 (App Router, RSC-first) · React 19 · TypeScript (strict) · Tailwind CSS
  **v3.4** · Clerk (auth) · Supabase (configured, unused) · Geist Sans + JetBrains Mono.
- **Identity:** "Dark Lab" — dark-first, neon-on-black, **Signal Green** accent, a **complexity
  gradient** (green→red) encoding cheap→costly Big-O. Instrument-panel density; mono for data.
- **Theme:** App is **dark by default**; a working light theme exists behind a toggle. Both themes
  are fully tokenized.
- **Re-skin contract:** **All color/radius values live in `frontend/app/globals.css`.** Change the
  HSL triplets there to restyle the whole app — components never hardcode colors.
- **What's real vs. mock:** Auth + theming + the signed-in user's name are real. **All dashboard
  data is mock** (`lib/mock-data.ts`). There is **no analyzer engine** — the analyzer is not built.
- **Build status:** `npm run build` and `npm run lint` both pass. No new runtime deps were added.

---

## 1. Design Tokens (current)

**Single source of truth:** `frontend/app/globals.css`. Mapped into Tailwind utilities in
`frontend/tailwind.config.ts`. All colors are **HSL triplets** consumed as
`hsl(var(--token) / <alpha-value>)`, so **opacity modifiers work everywhere** (`bg-primary/10`,
`ring-complexity-3/25`, etc.).

### 1.1 Color tokens

| Token | Light value (HSL) | Dark value (HSL) | Tailwind utility |
|---|---|---|---|
| `--background` | `160 30% 99%` | `200 24% 6%` | `bg-background` |
| `--foreground` | `200 22% 12%` | `160 12% 96%` | `text-foreground` |
| `--card` / `--card-foreground` | `0 0% 100%` / `200 22% 12%` | `200 22% 9%` / `160 12% 96%` | `bg-card`, `text-card-foreground` |
| `--popover` / `--popover-foreground` | `0 0% 100%` / `200 22% 12%` | `200 24% 8%` / `160 12% 96%` | `bg-popover` … |
| `--primary` (**Signal Green**) | `152 64% 36%` | `151 82% 47%` | `bg-primary`, `text-primary` |
| `--primary-foreground` | `0 0% 100%` | `200 40% 6%` | `text-primary-foreground` |
| `--secondary` / fg | `156 24% 95%` / `200 22% 14%` | `200 18% 15%` / `160 12% 96%` | `bg-secondary` … |
| `--muted` / fg | `200 20% 95%` / `200 12% 42%` | `200 16% 14%` / `195 12% 62%` | `bg-muted`, `text-muted-foreground` |
| `--accent` / fg | `156 30% 94%` / `200 22% 14%` | `200 18% 16%` / `160 12% 96%` | `bg-accent` … |
| `--destructive` / fg | `0 72% 48%` / `0 0% 100%` | `0 72% 52%` / `160 12% 96%` | `bg-destructive`, `text-destructive` |
| `--border` | `200 18% 90%` | `200 16% 17%` | `border-border` |
| `--input` | `200 18% 90%` | `200 16% 18%` | `border-input` |
| `--ring` | `152 64% 36%` | `151 82% 47%` | `ring-ring` |

### 1.2 Complexity gradient (signature visual)

A 5-stop scale, cheap→costly. Used by `Badge` (`complexity={1..5}`) and gradient bars.

| Token | Light | Dark | Meaning | Mapped Big-O |
|---|---|---|---|---|
| `--complexity-1` | `152 64% 38%` | `151 82% 48%` | cheap (green) | `O(1)`, `O(log n)` |
| `--complexity-2` | `96 55% 40%` | `95 64% 50%` | low | `O(n)` |
| `--complexity-3` | `42 92% 44%` | `45 95% 56%` | moderate (amber) | `O(n log n)` |
| `--complexity-4` | `24 92% 48%` | `25 95% 58%` | high (orange) | `O(n²)` |
| `--complexity-5` | `0 74% 50%` | `0 82% 62%` | costly (red) | `O(2ⁿ)` |

Tailwind utilities: `bg-complexity-1`…`bg-complexity-5`, `text-complexity-*`, `ring-complexity-*`,
and gradient stops like `from-complexity-1 via-complexity-3 to-complexity-5`.
**The Big-O → level mapping is centralized in `frontend/lib/complexity.ts` (`complexityLevel()`).**

### 1.3 Radius, typography, scale

- `--radius: 0.625rem`. Tailwind `borderRadius` is **token-derived**:
  `sm = radius-4px`, `md = radius-2px`, `lg = radius`, `xl = radius+4px`, `2xl = radius+8px`.
  → Changing `--radius` rescales every rounded corner consistently.
- **Fonts** (wired in `app/layout.tsx`, mapped in `tailwind.config.ts`):
  - `font-sans` → Geist Sans (`--font-geist-sans`) — UI/prose.
  - `font-mono` → JetBrains Mono (`--font-mono`) — **code, metrics, complexity values**.
- **`color-scheme`** is set per theme (`light` on `:root`, `dark` on `.dark`) for native form/scroll
  styling.

### 1.4 Custom utilities & motion (in `globals.css` `@layer utilities`)

| Class | Effect | Used by |
|---|---|---|
| `.bg-lab-grid` | dotted "lab grid" backdrop (driven by `--border`) | landing hero backdrop |
| `.text-glow-primary` | Signal-green text glow | landing hero word "complexity" |
| `.scene-3d` / `.tilt-3d` | perspective scene + tilted plane (`rotateX/rotateZ`) | landing 3D readout |
| `.animate-float` | gentle Z/Y float loop (`@keyframes float-card`) | landing 3D readout |
| `.animate-rise` | fade-up entrance (`@keyframes rise-in`) | landing hero/visual (staggered via `[animation-delay:120ms]`) |

**Accessibility:** a global `@media (prefers-reduced-motion: reduce)` rule neutralizes all
animation/transition durations — keep new motion CSS-class-based so it inherits this.

---

## 2. Route Inventory

| Route | File | Render | Auth | Notes |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Static | Public | **Landing page** (rebuilt: hero, 3D readout, features, gradient band, CTA, footer). |
| `/sign-in` | `app/sign-in/page.tsx` | Static | Public | Google-only via `GoogleAuthButton`. |
| `/sign-up` | `app/sign-up/page.tsx` | Static | Public | Google-only. (Mirror of sign-in — see §9.) |
| `/sso-callback` | `app/sso-callback/page.tsx` | Client | Public | Clerk OAuth handshake; minimal "Completing sign-in…" screen. |
| `/dashboard` | `app/dashboard/page.tsx` | Dynamic (`ƒ`) | **Protected** (proxy.ts) | Composes 5 readouts. Dynamic because it reads the Clerk user. |
| `/dashboard` (loading) | `app/dashboard/loading.tsx` | — | — | Route-level skeleton matching the dashboard grid. |

Route protection is enforced in **`frontend/proxy.ts`** (Next 16's renamed middleware), not in
layouts. No other routes exist yet (sidebar's Analyses/Snippets/Progress are `href="#"` "Soon"
placeholders).

---

## 3. Layout Inventory

| Layout | File | Role |
|---|---|---|
| **Root layout** | `app/layout.tsx` | `ClerkProvider`, font variables, `<head>` **pre-hydration theme script** (dark-first, reads `localStorage.theme`), `lang="en"`, `suppressHydrationWarning`. Sets `className="dark"` as the SSR default. |
| **Dashboard shell** | `app/dashboard/layout.tsx` | Persistent app chrome: `Sidebar` + `Topbar` + `<main id="main-content">`. Includes a **skip-to-content** link. Responsive padding `p-4 sm:p-6 lg:p-8`. |
| **Auth shell** | `components/layout/auth-shell.tsx` | Centered, branded card used by `/sign-in` and `/sign-up`. Radial Signal-Green glow backdrop; `max-w-sm`. |

---

## 4. Page Inventory

| Page | File | Key sections / state |
|---|---|---|
| **Home / Landing** | `app/page.tsx` | Header (Logo, ThemeToggle, Sign in, Get started) · Hero (eyebrow pill, balanced headline with glowing "complexity", subhead, dual CTA, trust line) · **3D analysis readout** (tilted glass card: mono code + complexity badges + gradient bar, with a layered depth card behind) · Feature trio (Gauge / GraduationCap / Sparkles) · Complexity-gradient band (Big-O chips + full gradient bar) · Closing CTA · Footer. Server component; only `ThemeToggle` is a client island. **No emojis; motion via `.animate-rise`/`.animate-float`.** |
| **Sign in** | `app/sign-in/page.tsx` | `AuthShell` + `GoogleAuthButton mode="sign-in"`. |
| **Sign up** | `app/sign-up/page.tsx` | `AuthShell` + `GoogleAuthButton mode="sign-up"`. |
| **SSO callback** | `app/sso-callback/page.tsx` | `AuthenticateWithRedirectCallback` + minimal status text. |
| **Dashboard** | `app/dashboard/page.tsx` | `max-w-6xl`; `WelcomeCard` in `<Suspense fallback={<WelcomeCardSkeleton/>}>`; 3-col grid: (Recent analyses + Saved snippets) | (Progress overview + Quick actions). |

---

## 5. Component Inventory

### 5.1 Reusable UI primitives — `components/ui/`

| Component | File | API surface | Notes for design |
|---|---|---|---|
| **Button** | `button.tsx` | `Button` (props: `variant`, `size`) + `buttonClassName({variant,size})` helper for `<Link>`/`<a>`. Variants: `default`, `secondary`, `outline`, `ghost`. Sizes: `default`, `sm`, `lg`, `icon`. | Default has Signal-Green fill + soft `shadow-primary/20` and `active:scale-[0.98]`. The `buttonClassName` helper is how anchors share button styling. |
| **Card** | `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. | `rounded-xl` (token-derived), `border`, `bg-card`, `shadow-sm`. The base surface across dashboard + landing. |
| **Badge** | `badge.tsx` | `Badge` (props: `variant` ∈ default/secondary/outline/destructive, **or** `complexity` ∈ 1–5). Exports `ComplexityLevel` type. | `complexity` prop renders a gradient-tinted, inset-ringed pill. Used for Big-O values (mono). |
| **EmptyState** | `empty-state.tsx` | `EmptyState({icon, title, description?, action?})`. | Dashed-border zero-data block. Used by readouts when arrays are empty. |
| **Skeleton** | `skeleton.tsx` | `Skeleton` (div, `animate-pulse`). | Loading placeholder primitive. |
| **ThemeToggle** | `theme-toggle.tsx` | `ThemeToggle({className?})`. **Client.** | Stateless: reads/flips `.dark` on `<html>` at click, persists to `localStorage`. Sun/Moon swapped purely by CSS (`dark:block`/`dark:hidden`) — SSR-stable, no hydration flash. |
| **GoogleAuthButton** | `google-auth-button.tsx` | `GoogleAuthButton({mode})`. **Client.** | Clerk signals API (`signIn.sso`/`signUp.sso`); has its own `loading` state ("Redirecting to Google…"). |
| **Icons** | `icons.tsx` | `GoogleIcon`. | Brand SVG not in lucide. All other icons come from **lucide-react**. |

### 5.2 Layout components — `components/layout/`

| Component | File | Client? | Notes |
|---|---|---|---|
| **Logo** | `logo.tsx` | No | FlaskConical mark in a Signal-Green tile + "Complexity**Lab**" wordmark (`showWordmark` toggle). |
| **Sidebar** | `sidebar.tsx` | No | Desktop only (`hidden lg:flex`, `w-64`). Renders shared `NavList`; footer "Free plan · mock data" pill. |
| **Topbar** | `topbar.tsx` | No | Sticky, `backdrop-blur`. Left: `MobileNav` (hamburger, `<lg`) + page title. Right: `ThemeToggle` + Clerk `UserButton`. **The old fake "Search…" affordance was removed** (it implied a non-existent feature). |
| **MobileNav** | `mobile-nav.tsx` | Yes | Hamburger → slide-over drawer reusing `NavList`. Closes on select/Escape/backdrop; locks body scroll; `role="dialog" aria-modal`. |
| **NavList** | `nav-list.tsx` | Yes | Shared nav rendering (active state via `usePathname`, `aria-current`). "Soon" items render disabled (`aria-disabled`, contrast-safe `text-muted-foreground/70`). |
| **nav config** | `nav.ts` | — | `NAV_ITEMS` array (label/href/icon/ready). **Single source** for sidebar + drawer. |
| **AuthShell** | `auth-shell.tsx` | No | See §3. |

### 5.3 Dashboard readouts — `components/readouts/`

| Component | File | Data source | Notes |
|---|---|---|---|
| **WelcomeCard** | `welcome-card.tsx` | **Live** Clerk `currentUser()` (async RSC) | Greets real user by first name. Exports `WelcomeCardSkeleton`. Gradient header surface. CTA buttons are **visual-only** (no handlers — see §9). |
| **RecentAnalyses** | `recent-analyses.tsx` | `mock-data` | Lists analyses; time complexity rendered with gradient `Badge complexity=…` via `complexityLevel()`; empty-state fallback. |
| **SavedSnippets** | `saved-snippets.tsx` | `mock-data` | Snippet rows + tag badges (tags hidden `<sm`); empty-state fallback. |
| **ProgressOverview** | `progress-overview.tsx` | `mock-data` | Stat tiles (mono numbers) + per-topic progress bars; empty-state guard. |
| **QuickActions** | `quick-actions.tsx` | static array | 2-col action grid; buttons are **visual-only** placeholders. |

---

## 6. Analyzer-Related Components

**There is no analyzer feature implemented.** Status for design awareness:

- **No `/analyze` or `/dashboard/analyze` route, no code-input UI, no results engine.** (`HANDOFF.md`
  Phase 3 item 3 / Phase 4 cover this future work.)
- The closest things that exist are **representations of analyzer output**, all mock/static:
  - **Landing "3D analysis readout"** (`app/page.tsx`) — a **decorative mockup** of what an analysis
    result could look like (mono code + Time/Space badges + gradient bar). Not interactive.
  - **RecentAnalyses readout** — displays prior "analysis" records from `mock-data.ts`.
- **Design opportunity:** the analyzer is the product's core surface and is **wide open** — input
  panel, live complexity readout, gradient-encoded results, and an empty/initial state all need to
  be designed. The `Badge complexity` primitive, the complexity gradient tokens, and `complexityLevel()`
  are the building blocks already in place to keep it consistent.

---

## 7. Data Flow

```
Clerk (auth)
  ├─ proxy.ts ............ protects /dashboard (redirects unauthenticated users)
  ├─ ClerkProvider ....... app/layout.tsx (URLs: /sign-in, /sign-up, afterSignOut "/")
  ├─ currentUser() ....... welcome-card.tsx (server) → real first name
  └─ useSignIn/useSignUp . google-auth-button.tsx (client) → .sso() → /sso-callback → /dashboard

Mock data (lib/mock-data.ts)  ──static import──►  readouts (server components, render-time)
   recentAnalyses, savedSnippets, progressMetrics, dashboardStats
   typed by types/index.ts (Analysis, Snippet, ProgressMetric, DashboardStat, Complexity)

Complexity mapping (lib/complexity.ts)  ──►  Badge complexity level  ──►  gradient tokens

Theme
   layout.tsx inline script (pre-paint) reads localStorage.theme (default dark) → sets .dark on <html>
   ThemeToggle (client) flips .dark + persists → CSS variables + dark: utilities re-resolve

Supabase (lib/supabase/{client,server}.ts) ... CONFIGURED BUT UNUSED (no queries, no tables, no RLS)
```

**Key point for design:** readouts are **server components** fed by synchronous mock arrays — there
is no client-side fetching/loading for them today (the only async is `currentUser()` in WelcomeCard,
covered by `Suspense` + skeleton, and the route-level `loading.tsx`).

---

## 8. Responsive Behavior

Tailwind default breakpoints; the meaningful one is **`lg` (1024px)** — the desktop/mobile divide.

| Area | `< lg` (mobile/tablet) | `≥ lg` (desktop) |
|---|---|---|
| **Dashboard nav** | Sidebar hidden; `MobileNav` hamburger in topbar → slide-over drawer (`w-72`, `max-w-[80%]`). | Persistent `w-64` sidebar; no hamburger. |
| **Dashboard grid** | Single column (readouts stack). | 3-col grid (`lg:grid-cols-3`), main content spans 2. |
| **Dashboard main padding** | `p-4` → `sm:p-6`. | `lg:p-8`. |
| **Landing hero** | Single column, visual below text. | `lg:grid-cols-2`, text + 3D visual side-by-side. |
| **Landing features** | 1 col → `sm:grid-cols-2`. | `lg:grid-cols-3`. |
| **Topbar padding** | `px-4`. | `sm:px-6`. |
| **Snippet tags** | Hidden (`hidden sm:flex`). | Shown. |
| **WelcomeCard padding** | `p-6`. | `sm:p-8`. |

Touch targets: nav/drawer/toggle controls are ≥ `h-9` (36px) with focus-visible rings.
Headings use fluid steps (`text-4xl sm:text-5xl lg:text-6xl` on the hero).

**Design note:** below `lg` the dashboard relies entirely on the drawer for navigation — verify the
drawer's polish (backdrop, motion, focus trapping is basic: Escape + backdrop close, but focus is
**not** trapped — see §9).

---

## 9. Assumptions, Placeholders & Missing Design Work

### Intentional placeholders (don't mistake for finished design)
- **All dashboard data is mock** (`lib/mock-data.ts`). Numbers/labels are illustrative.
- **Visual-only controls (no handlers):** WelcomeCard "New analysis"/"View snippets", all
  QuickActions buttons. Styled but inert pending features.
- **"Soon" nav items** (Analyses, Snippets, Progress) point at `href="#"` and render disabled.
- **`/sign-up` is a near-mirror of `/sign-in`** — same shell, different copy. No distinct sign-up
  visual treatment yet.
- **SSO callback** is a bare "Completing sign-in…" line — functional, unstyled beyond centering.
- **Free plan / mock data** pill in sidebar + drawer is a status stub.

### Assumptions baked in
- **Dark-first.** SSR renders `.dark`; light is the opt-in. New surfaces should be designed dark-first
  and verified in light.
- **Signal Green is the only brand accent**, constant across themes (lightness shifts per theme).
- **Mono = data** (Big-O values, metrics, code), **Sans = prose**. Snippet *titles* are descriptive
  names and intentionally stay sans; analysis *titles* are code-like and use mono.
- **No component hardcodes color** — restyling happens in `globals.css`/`tailwind.config.ts` only.
- **No new dependencies** were introduced (theme system is hand-rolled; icons are lucide-react).

### Missing / open design work (highest-value first)
1. **Analyzer surface** (§6) — the core product screen is undesigned: input, live readout, results.
2. **Auth pages polish** — differentiate sign-up, richer SSO callback, possibly the Dark-Lab grid on
   the auth backdrop for consistency with the landing.
3. **Empty/error/loading states beyond the basics** — error boundaries, toast/notification pattern,
   form validation styling (no `Input`/`Textarea`/`Tabs`/`Tooltip` primitives exist yet).
4. **Drawer focus management** — currently closes on Escape/backdrop but does **not** trap focus or
   return focus to the trigger; a designer/engineer pass should finish this for a11y.
5. **Iconography & illustration** — only lucide line icons + one brand SVG; no bespoke illustration,
   no favicon/OG imagery (`public/` is empty).
6. **Data-density / instrument-panel richness** — the "Nothing-inspired" density goal is only
   partially expressed; readouts could push further (gauges, sparklines, mono tabular numerals).
7. **Motion language** — only `rise`/`float` entrance/idle animations exist; no interaction-level
   motion system (hover/press/route transitions) is defined.

### Known-good seams to build on
- Add new primitives in `components/ui/` and reuse `cn()` (`lib/utils.ts`) + the token utilities.
- Add complexity-colored anything via `Badge complexity` or the `complexity-*` / `--complexity-*`
  tokens + `complexityLevel()`.
- Add nav destinations by flipping `ready`/`href` in `components/layout/nav.ts` (both sidebar and
  drawer update automatically).
- Keep components **Server Components** unless they need interactivity; client islands so far:
  `ThemeToggle`, `MobileNav`, `NavList`, `GoogleAuthButton`.

---

## 10. Vercel / Build Notes

- App lives in **`frontend/`** — Vercel **Root Directory must be `frontend`**.
- `npm run build` (Next 16 + Turbopack) and `npm run lint` (ESLint 9 flat config) both **pass** as of
  this handoff.
- RSC-first; the only dynamic route is `/dashboard` (reads the Clerk user). Everything else is static.
- No environment variables are required for **visual** work, but the app boots against Clerk — design
  iteration on `/dashboard` needs a signed-in session (or stub auth). Landing + auth pages render
  without a session.
- **No secrets in client components.** Supabase service-role / Clerk secret / Groq keys are server-only
  (none are needed for design work).

---

*End of design handoff. For engineering history and roadmap, see `HANDOFF.md`.*
