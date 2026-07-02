# FactoryShield — Design System
**Inspired by GenieERP Visual Language | Author: Asif | Date: 2026-07-01**

> Every screen in FactoryShield must comply with this document. If a token, spacing value, or component style is not listed here, it does not exist. Do not invent new values.

---

## 1. Philosophy

FactoryShield is an **enterprise safety platform** where operators make high-stakes decisions under time pressure. The design language pairs a **dark hero/sidebar** (deep navy, charcoal) with a **clean white work surface** to create psychological separation between *context* and *action*. A single accent red commands all critical affordances — submit buttons, incident alerts, status badges — ensuring users always know where to act next.

**Three rules that override everything else:**
1. One accent color. `#D4183D` only. No secondary red, no orange, no additional accent.
2. Every interactive element must have a visible focus state.
3. Status is never communicated by color alone — always pair with icon or text label.

---

## 2. Color Tokens

### Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand` | `#D4183D` | Primary CTA, error states, critical alerts, incident flags, links |
| `--color-brand-hover` | `#A01428` | Hover state for brand-colored elements |
| `--color-brand-active` | `#8B0F23` | Active/pressed state |
| `--color-brand-subtle` | `rgba(212,24,61,0.10)` | Error badge backgrounds, danger tints |
| `--color-navy` | `#030213` | Sidebar, nav bar, hero sections, page-level dark surfaces |

### Neutral Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-white` | `#FFFFFF` | Primary surface, cards, inputs, text-on-dark |
| `--color-off-white` | `#F3F3F5` | Page background, secondary button fill, subtle surfaces |
| `--color-light-gray` | `#ECECF0` | Gentle borders, disabled input backgrounds |
| `--color-soft-gray` | `#E9EBEF` | Section dividers, spacing fills |
| `--color-mid-gray` | `#CBCED4` | Form borders, placeholder text, disabled text |
| `--color-muted` | `#717182` | Secondary text, helper text, metadata, breadcrumbs |
| `--color-text` | `#030213` | Body text, headings on white surfaces — never pure `#000000` |

### Semantic / Status

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-danger` | `#D4183D` | Error, rejection, SLA breached (same as brand) |
| `--color-warning` | `#D97706` | SLA critical (80%+) |
| `--color-warning-bg` | `#FFFBEB` | Warning badge background |
| `--color-success` | `#16a34a` | Resolved status, completed checklist |
| `--color-success-bg` | `#F0FDF4` | Success badge background |
| `--color-info` | `#2563eb` | Informational states |
| `--color-info-bg` | `#EFF6FF` | Info badge background |

### SLA Badge Colors (FS-14)

| State | Background | Text |
|-------|-----------|------|
| ok (< 50%) | `#F0FDF4` | `#16a34a` |
| warning (50–80%) | `#FFFBEB` | `#D97706` |
| critical (80–100%) | `#FEF2F2` | `#DC2626` |
| breached (≥ 100%) | `#DC2626` | `#FFFFFF` |
| none | `#F3F4F6` | `#9CA3AF` |

---

## 3. Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
```

Import in `styles.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

### Scale

| Role | Size | Weight | Line Height | Letter Spacing | CSS Class |
|------|------|--------|-------------|----------------|-----------|
| Display | 31.5px | 700 | 39.4px | normal | `.fs-display` |
| Heading 1 | 21px | 700 | 28px | normal | `.fs-h1` |
| Heading 3 / Card title | 12.25px | 600 | 17.5px | normal | `.fs-h3` |
| Body | 12.25px | 400 | 17.5px | normal | `.fs-body` |
| Link / Medium | 12.25px | 500 | 17.5px | normal | `.fs-link` |
| Button text | 14px | 500 | 21px | normal | `.fs-btn` |
| Caption / Helper | 10.5px | 500 | 14px | normal | `.fs-caption` |

### Rules

- **Only three weights:** 400 (body), 500 (medium/button/link), 600 (card headers), 700 (headings/CTAs).
- **No responsive font scaling.** Sizes are fixed in px across all breakpoints. Only spacing and layout adjust.
- **Minimum size: 10.5px** (caption). Never go below this.
- Underlines only for hyperlinks and error states. Never decorative.

---

## 4. Spacing System

Base unit: **4px**. Every margin, padding, and gap must be a multiple of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight: icon-to-text, checkbox margin, badge internals |
| `--space-2` | 8px | Standard: button groups, form gaps, icon-to-label |
| `--space-3` | 12px | Form field vertical gap, card internals |
| `--space-4` | 16px | Card padding, section dividers, gutter |
| `--space-5` | 20px | Between adjacent content blocks |
| `--space-7` | 28px | Hero vertical rhythm |
| `--space-9` | 36px | Page section separation |
| `--space-11` | 44px | Hero / immersive section padding |

**Never use an arbitrary px value not in this table.**

---

## 5. Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0px | Structural dividers |
| `--radius-sm` | 4px | Secondary buttons, badges, checkboxes, tags |
| `--radius-md` | 8.75px | **Primary radius** — inputs, primary buttons, cards, containers |
| `--radius-pill` | 24px | Status pills, accent badges |
| `--radius-circle` | 50% | Avatars, icon badges |

---

## 6. Elevation (Shadows)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | none | Flat backgrounds, primary surfaces |
| `--shadow-sm` | `rgba(0,0,0,0.05) 0px 1px 2px 0px` | Buttons, subtle interactive |
| `--shadow-md` | `rgba(0,0,0,0.1) 0px 10px 15px -3px, rgba(0,0,0,0.1) 0px 4px 6px -4px` | Cards, modals, elevated panels |
| `--shadow-lg` | `rgba(0,0,0,0.15) 0px 20px 25px -5px, rgba(0,0,0,0.1) 0px 10px 10px -5px` | Dropdowns, tooltips, popovers |
| `--shadow-xl` | `rgba(0,0,0,0.20) 0px 25px 50px -12px` | Modal overlays, critical alerts |

Dark backgrounds (navy sections) **never** use shadows.

---

## 7. Components

### 7.1 Buttons

#### Primary Button
```css
.btn-primary {
  background-color: #D4183D;
  color: #FFFFFF;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  padding: 7px 14px;
  border-radius: 8.75px;
  border: none;
  height: 38.5px;
  box-shadow: rgba(0,0,0,0.05) 0px 1px 2px 0px;
  cursor: pointer;
  transition: background-color 150ms ease-in-out;
}
.btn-primary:hover  { background-color: #A01428; }
.btn-primary:active { background-color: #8B0F23; }
.btn-primary:focus-visible { outline: 2px solid #D4183D; outline-offset: 4px; }
.btn-primary:disabled { background-color: #CBCED4; color: #717182; cursor: not-allowed; }
```

#### Secondary Button
```css
.btn-secondary {
  background-color: #F3F3F5;
  color: #030213;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  padding: 7px 14px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.10);
  height: 38.5px;
  box-shadow: rgba(0,0,0,0.05) 0px 1px 2px 0px;
  cursor: pointer;
}
.btn-secondary:hover  { background-color: #ECECF0; border-color: rgba(0,0,0,0.20); }
.btn-secondary:active { background-color: #E9EBEF; }
.btn-secondary:focus-visible { outline: 2px solid #D4183D; outline-offset: 2px; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
```

#### Small Button Modifier
```css
.btn-sm { padding: 4px 10px; height: 30px; font-size: 12.25px; }
```

#### Icon Button
```css
.btn-icon {
  background: transparent;
  border: none;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #717182;
}
.btn-icon:hover { background-color: #F3F3F5; }
.btn-icon:focus-visible { outline: 2px solid #D4183D; outline-offset: 2px; }
```

**Angular template pattern:**
```html
<button class="btn-primary">Submit Report</button>
<button class="btn-secondary btn-sm">Cancel</button>
<button class="btn-primary" [disabled]="submitting()">
  {{ submitting() ? 'Submitting…' : 'Submit Report' }}
</button>
```

---

### 7.2 Form Inputs

#### Text Input
```css
.form-control {
  background-color: #FFFFFF;
  color: #030213;
  font-family: Inter, sans-serif;
  font-size: 12.25px;
  font-weight: 400;
  line-height: 17.5px;
  padding: 7px 10.5px;
  border-radius: 8.75px;
  border: 1px solid #CBCED4;
  height: 38.5px;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 150ms ease-in-out;
}
.form-control::placeholder { color: #CBCED4; }
.form-control:focus {
  outline: none;
  border-color: #D4183D;
  box-shadow: 0 0 0 2px rgba(212,24,61,0.15);
}
.form-control:disabled {
  background-color: #F3F3F5;
  color: #717182;
  cursor: not-allowed;
}
.form-control.is-invalid {
  border-color: #D4183D;
}
```

#### Input with Icon (left-padded)
```css
.form-control--icon { padding-left: 35px; }
.form-input-wrap { position: relative; }
.form-input-icon {
  position: absolute;
  left: 10.5px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #717182;
  pointer-events: none;
}
```

#### Select / Textarea
Same styles as `.form-control`. Textarea: `resize: vertical; height: auto; min-height: 80px`.

#### Form Label
```css
.form-label {
  display: block;
  font-size: 12.25px;
  font-weight: 600;
  color: #030213;
  margin-bottom: 8px;
  line-height: 17.5px;
}
.form-label .req { color: #D4183D; margin-left: 2px; }
```

#### Helper / Error Text
```css
.form-helper {
  font-size: 10.5px;
  font-weight: 500;
  color: #717182;
  margin-top: 4px;
  line-height: 14px;
}
.form-error {
  font-size: 10.5px;
  font-weight: 500;
  color: #D4183D;
  margin-top: 4px;
  line-height: 14px;
}
```

#### Checkbox
```css
.form-check { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.form-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border: 1px solid #CBCED4;
  border-radius: 4px;
  background-color: #FFFFFF;
  accent-color: #D4183D;
  cursor: pointer;
}
.form-check input[type="checkbox"]:focus-visible {
  outline: 2px solid #D4183D;
  outline-offset: 2px;
}
```

#### Form Grid
```css
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}
.form-group { display: flex; flex-direction: column; }
```

---

### 7.3 Cards & Containers

#### Standard Card
```css
.card {
  background-color: #FFFFFF;
  border: 1px solid #CBCED4;
  border-radius: 8.75px;
  padding: 16px;
  box-shadow: rgba(0,0,0,0.1) 0px 10px 15px -3px, rgba(0,0,0,0.1) 0px 4px 6px -4px;
}
```

#### Warning / Info Card (left-accented)
```css
.card-info {
  background-color: #FFFFF9;
  border: 1px solid #ECECF0;
  border-left: 3px solid #D4183D;
  border-radius: 8.75px;
  padding: 16px;
}
.card-info-title { color: #D4183D; font-size: 12.25px; font-weight: 600; margin-bottom: 4px; }
.card-info-body  { color: #030213; font-size: 12.25px; font-weight: 400; line-height: 17.5px; }
```

#### Metric / Stat Card (on dark background)
```css
.card-metric {
  background-color: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 8.75px;
  padding: 20px;
  color: #FFFFFF;
}
.card-metric-value { font-size: 21px; font-weight: 700; line-height: 28px; }
.card-metric-label { font-size: 10.5px; font-weight: 500; color: rgba(255,255,255,0.70); margin-top: 4px; }
```

---

### 7.4 Navigation

#### Top Navigation Bar
```css
.nav-bar {
  background-color: #030213;
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.10);
  gap: 8px;
}
.nav-brand {
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-right: 24px;
}
.nav-link {
  color: #FFFFFF;
  font-size: 12.25px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 200ms ease-in-out;
}
.nav-link:hover   { background-color: rgba(255,255,255,0.10); }
.nav-link.active  { color: #D4183D; background-color: rgba(212,24,61,0.10); }
.nav-link:focus-visible { outline: 2px solid #D4183D; outline-offset: 2px; }
```

#### Sidebar (Left Panel)
```css
.sidebar {
  background-color: #030213;
  width: 220px;
  min-height: 100vh;
  padding: 20px 0;
  flex-shrink: 0;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  color: rgba(255,255,255,0.75);
  font-size: 12.25px;
  font-weight: 500;
  text-decoration: none;
  border-radius: 0;
  transition: all 150ms;
}
.sidebar-link:hover  { background-color: rgba(255,255,255,0.08); color: #FFFFFF; }
.sidebar-link.active { background-color: rgba(212,24,61,0.15); color: #D4183D; border-right: 3px solid #D4183D; }
```

#### Breadcrumbs
```css
.breadcrumb { display: flex; align-items: center; gap: 4px; }
.breadcrumb-item { font-size: 10.5px; font-weight: 500; color: #717182; }
.breadcrumb-sep   { color: #CBCED4; }
.breadcrumb-item.active { color: #030213; font-weight: 600; }
.breadcrumb-item a { color: #D4183D; text-decoration: none; }
.breadcrumb-item a:hover { text-decoration: underline; }
```

---

### 7.5 Badges & Pills

#### Status Pill (Incident Status)
```css
.stat-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 24px;
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
}
.stat-pill--open       { background: #FEF2F2; color: #DC2626; }   /* Submitted */
.stat-pill--inprogress { background: #EFF6FF; color: #2563EB; }   /* In Progress */
.stat-pill--closed     { background: #F0FDF4; color: #16A34A; }   /* Resolved */
.stat-pill--capa       { background: #F3F4F6; color: #374151; }   /* Rejected */
```

#### Severity Pill
```css
.sev-pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 24px; font-size: 10.5px; font-weight: 600; }
.sev-pill--critical { background: #FEF2F2; color: #DC2626; }
.sev-pill--high     { background: #FFF7ED; color: #C2410C; }
.sev-pill--medium   { background: #FFFBEB; color: #D97706; }
.sev-pill--low      { background: #F0FDF4; color: #16A34A; }
```

#### Category Tag
```css
.cat-tag {
  display: inline-block;
  background-color: #F3F3F5;
  color: #030213;
  font-size: 10.5px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #ECECF0;
}
```

#### Alert / Banner
```css
.alert {
  padding: 12px 16px;
  border-radius: 8.75px;
  font-size: 12.25px;
  font-weight: 500;
  line-height: 17.5px;
  margin-bottom: 12px;
}
.alert-error   { background: rgba(212,24,61,0.10); border: 1px solid #D4183D; color: #D4183D; }
.alert-success { background: #F0FDF4; border: 1px solid #16A34A; color: #15803D; }
.alert-warning { background: #FFFBEB; border: 1px solid #D97706; color: #92400E; }
.alert-info    { background: #EFF6FF; border: 1px solid #2563EB; color: #1D4ED8; }
```

---

### 7.6 Tables (Incident Lists)

```css
.inc-table-wrap { overflow-x: auto; }
.inc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.25px;
}
.inc-table thead th {
  font-size: 10.5px;
  font-weight: 600;
  color: #717182;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 10px 14px;
  border-bottom: 1px solid #E9EBEF;
  background-color: #F3F3F5;
  text-align: left;
  white-space: nowrap;
}
.inc-table tbody td {
  padding: 12px 14px;
  color: #030213;
  border-bottom: 1px solid #E9EBEF;
  vertical-align: middle;
}
.inc-row { cursor: pointer; transition: background-color 120ms; }
.inc-row:hover { background-color: #F3F3F5; }
.inc-row--critical { background-color: #FFF5F5; }
.inc-row--critical:hover { background-color: #FEE2E2; }
.inc-no-cell { font-weight: 600; color: #D4183D; font-size: 12.25px; }
.no-data-cell { text-align: center; padding: 2.5rem; color: #717182; font-size: 12.25px; }
```

---

### 7.7 Page Shell

#### Full-Page Layout
```css
.app-shell {
  display: flex;
  min-height: 100vh;
  background-color: #F3F3F5;
  font-family: 'Inter', sans-serif;
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-content {
  flex: 1;
  padding: 28px 36px;
  overflow-y: auto;
}
```

#### Page Header Block
```css
.page-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title {
  font-size: 21px;
  font-weight: 700;
  color: #030213;
  line-height: 28px;
}
.page-sub {
  font-size: 12.25px;
  color: #717182;
  margin-top: 4px;
}
```

#### Hero Split Layout (Login / Auth pages)
```css
.hero-split { display: flex; min-height: 100vh; }
.hero-left {
  flex: 0 0 45%;
  background-color: #030213;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px;
  color: #FFFFFF;
}
.hero-right {
  flex: 1;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px;
  max-width: 600px;
  margin: 0 auto;
}
```

---

### 7.8 Investigation Workspace Layout

```css
.ws-page {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(340px, 1fr);
  gap: 20px;
  padding: 20px;
  background-color: #F3F3F5;
  min-height: 100vh;
}
.ws-header {
  grid-column: 1 / -1;
  background-color: #FFFFFF;
  border: 1px solid #E9EBEF;
  border-radius: 8.75px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: rgba(0,0,0,0.05) 0px 1px 2px 0px;
}
.ws-panel {
  background-color: #FFFFFF;
  border: 1px solid #E9EBEF;
  border-radius: 8.75px;
  padding: 16px;
  box-shadow: rgba(0,0,0,0.05) 0px 1px 2px 0px;
}
.ws-panel-title {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #717182;
  margin-bottom: 12px;
}
```

---

### 7.9 Modal / Dialog

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(3,2,19,0.60);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #FFFFFF;
  border-radius: 8.75px;
  padding: 24px;
  width: 480px;
  max-width: 90vw;
  box-shadow: rgba(0,0,0,0.20) 0px 25px 50px -12px;
}
.modal-title {
  font-size: 14px;
  font-weight: 700;
  color: #030213;
  margin-bottom: 16px;
}
.modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}
```

---

### 7.10 Wizard / Multi-Step Form

```css
.wiz-page { display: flex; flex-direction: column; min-height: 100vh; background: #F3F3F5; }
.wiz-top-bar {
  background: #FFFFFF;
  border-bottom: 1px solid #E9EBEF;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.wiz-main-title { font-size: 14px; font-weight: 700; color: #030213; }
.wiz-draft-line  { font-size: 10.5px; color: #717182; margin-top: 2px; }

.wiz-steps-bar {
  background: #FFFFFF;
  border-bottom: 1px solid #E9EBEF;
  padding: 12px 24px;
  display: flex;
  align-items: center;
}
.wiz-step-icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid #CBCED4;
  background: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 10.5px; font-weight: 600; color: #717182;
  flex-shrink: 0;
}
.wiz-step-icon--active { border-color: #D4183D; color: #D4183D; }
.wiz-step-icon--done   { border-color: #16A34A; background: #16A34A; color: #FFFFFF; }
.wiz-step-label { font-size: 10.5px; font-weight: 500; color: #717182; margin-top: 4px; text-align: center; }
.wiz-step-label--active { color: #D4183D; font-weight: 600; }
.wiz-step-label--done   { color: #16A34A; }
.wiz-connector { flex: 1; height: 2px; background: #E9EBEF; margin: 0 4px; }
.wiz-connector--done { background: #16A34A; }

.wiz-content { flex: 1; padding: 24px; max-width: 720px; margin: 0 auto; width: 100%; }
.wiz-footer {
  background: #FFFFFF;
  border-top: 1px solid #E9EBEF;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.wiz-step-indicator { font-size: 12.25px; color: #717182; }
.wiz-next-btn { background: #D4183D; color: #FFFFFF; }
```

---

### 7.11 SLA Countdown Badge

```css
.sla-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 12px;
  white-space: nowrap;
}
.sla-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.sla-badge--ok       { background: #F0FDF4; color: #16A34A; }
.sla-badge--warning  { background: #FFFBEB; color: #D97706; }
.sla-badge--critical { background: #FEF2F2; color: #DC2626; }
.sla-badge--breached { background: #DC2626; color: #FFFFFF; }
.sla-badge--none     { background: #F3F4F6; color: #9CA3AF; }
```

---

## 8. Layout Grid

| Context | Value |
|---------|-------|
| Max container width | 1200px |
| Form column width | 392px (max) |
| Grid columns | 12-column |
| Gutter | 16px |
| Hero left pane | 45–50% viewport |
| Hero right pane | 50–55% viewport, max 600px |
| Investigation Workspace | `1.7fr 1fr` grid |

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout change |
|------------|-------|---------------|
| Mobile | ≤ 767px | Single column; full-width containers; padding 16px; nav → hamburger |
| Tablet | 768–1023px | Two-column optional; 90% width; padding 20px |
| Desktop | 1024–1439px | Full layout; max-width 1200px; padding 44px |
| Large | ≥ 1440px | Max-width 1400px; gutter 24–32px |

**Touch targets:** Minimum 44 × 44px for all interactive elements. Minimum 8px spacing between adjacent elements.

**Mobile stacking:** Hero above form (full width each). Metric cards stack 1-column. Font sizes **do not change**.

---

## 10. Section Headers

All section title labels inside panels/cards follow this pattern:

```css
.section-title {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #717182;
  margin-bottom: 12px;
}
```

---

## 11. Dark Surface Rules

When placing content on `#030213` (navy):
- **Text color:** `#FFFFFF`
- **Secondary text:** `rgba(255,255,255,0.70)`
- **Borders:** `rgba(255,255,255,0.10)` or `rgba(255,255,255,0.20)`
- **No shadows** — dark backgrounds are already visually elevated
- **Never** place brand red text directly on navy (too low contrast)
- **Never** use off-white or gray text as the primary heading on dark — use pure white

---

## 12. Do's and Don'ts

### ✅ Do
- Use `#D4183D` as the **sole** accent for CTAs, alerts, and urgent actions
- Apply 16px padding inside every card/container
- Use `8.75px` border-radius for all primary components (inputs, buttons, cards)
- Use `4px` border-radius for secondary elements (tags, badges, checkboxes)
- Pair every color-based status with an icon or text label
- Apply `2px solid #D4183D` focus outline on all keyboard-accessible elements
- Maintain minimum 12px vertical gap between form fields
- Use `#030213` for body text — never pure `#000000`
- Keep font sizes fixed across breakpoints; only adjust spacing and layout
- Reserve `font-weight: 700` for headings and CTAs only

### ❌ Don't
- Introduce a second accent color alongside brand red
- Use arbitrary spacing values not in the 4px-base system
- Add decorative shadows where content is already visually differentiated
- Place brand red text on `#030213` navy backgrounds
- Use underlines for non-hyperlink text
- Scale font sizes responsively
- Mix multiple border styles — solid 1px only
- Omit `<label>` associations on form inputs
- Use `font-weight: 700` for body text or metadata
- Add border-radius values outside the defined scale (0 / 4 / 8.75 / 24 / 50%)
- Use `#000000` pure black anywhere in the UI

---

## 13. CSS Variables Reference

Add to `src/styles.css` global `:root`:

```css
:root {
  /* Brand */
  --color-brand:         #D4183D;
  --color-brand-hover:   #A01428;
  --color-brand-active:  #8B0F23;
  --color-brand-subtle:  rgba(212,24,61,0.10);
  --color-navy:          #030213;

  /* Neutral */
  --color-white:         #FFFFFF;
  --color-off-white:     #F3F3F5;
  --color-light-gray:    #ECECF0;
  --color-soft-gray:     #E9EBEF;
  --color-mid-gray:      #CBCED4;
  --color-muted:         #717182;
  --color-text:          #030213;

  /* Semantic */
  --color-success:       #16A34A;
  --color-success-bg:    #F0FDF4;
  --color-warning:       #D97706;
  --color-warning-bg:    #FFFBEB;
  --color-danger:        #D4183D;
  --color-danger-bg:     rgba(212,24,61,0.10);
  --color-info:          #2563EB;
  --color-info-bg:       #EFF6FF;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-7: 28px;
  --space-9: 36px;
  --space-11: 44px;

  /* Radius */
  --radius-sm:     4px;
  --radius-md:     8.75px;
  --radius-pill:   24px;
  --radius-circle: 50%;

  /* Shadows */
  --shadow-sm: rgba(0,0,0,0.05) 0px 1px 2px 0px;
  --shadow-md: rgba(0,0,0,0.1) 0px 10px 15px -3px, rgba(0,0,0,0.1) 0px 4px 6px -4px;
  --shadow-lg: rgba(0,0,0,0.15) 0px 20px 25px -5px, rgba(0,0,0,0.1) 0px 10px 10px -5px;
  --shadow-xl: rgba(0,0,0,0.20) 0px 25px 50px -12px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## 14. Checklist Before Every PR

- [ ] All colors from token list only — no hex values written inline that aren't in this doc
- [ ] All spacing values multiples of 4px
- [ ] Font sizes from the scale: 10.5 / 12.25 / 14 / 21 / 31.5px only
- [ ] Font weights: 400 / 500 / 600 / 700 only
- [ ] Every `<button>`, `<input>`, `<a>` has a `:focus-visible` style
- [ ] Status communicated with text or icon, not color alone
- [ ] Dark (navy) surfaces use white text; no brand red text on navy
- [ ] Cards use 16px padding + `--radius-md` + `--shadow-md`
- [ ] Primary buttons red, secondary buttons off-white — no exceptions
- [ ] All form inputs 38.5px tall, `--radius-md`, `1px solid #CBCED4` border
