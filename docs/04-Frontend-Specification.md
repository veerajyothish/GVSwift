# GVSwift — Frontend Specification Document

**Document 4 of 10 | Version 1.0 | Status: Draft for Approval**

---

## 1. Brand Theme

**Personality:** Confident, trustworthy, slightly premium — "Shop with Confidence" should feel earned through clean design and clear information, not flashy effects.

### Color Palette (CSS custom properties — "Stitch" system)

```css
:root {
  /* Core brand */
  --color-primary: #0B0B0C;        /* near-black, not pure #000 — softer */
  --color-primary-light: #1F1F22;
  --color-accent: #D4A943;         /* gold */
  --color-accent-dark: #B8902F;    /* gold, hover/pressed state */
  --color-accent-text: #1F1500;    /* text ON gold backgrounds — AA compliant */

  /* Surfaces */
  --color-bg: #FAF8F3;             /* warm off-white page background */
  --color-surface: #FFFFFF;        /* cards */
  --color-border: #E4E0D6;

  /* Text */
  --color-text-primary: #0B0B0C;
  --color-text-secondary: #5C5C58;
  --color-text-on-dark: #FAF8F3;

  /* Semantic */
  --color-success: #1F6E4A;
  --color-success-bg: #EAF3DE;
  --color-warning: #854F0B;
  --color-warning-bg: #FAEEDA;
  --color-error: #A32D2D;
  --color-error-bg: #FCEBEB;
  --color-info: #185FA5;
  --color-info-bg: #E6F1FB;

  /* Spacing scale (4px base) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Radius */
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;

  /* Typography */
  --font-heading: 'Fraunces', 'Georgia', serif;   /* or similar premium serif from Fontshare/Google Fonts */
  --font-body: 'Inter', system-ui, sans-serif;
}
```

> Dark mode is not required for MVP (e-commerce storefronts conventionally stay light-mode for product photography clarity), but the variable structure above makes adding it later straightforward if desired.

### Typography Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-xs` | 12px | 400 | Captions, helper text |
| `--text-sm` | 14px | 400 | Body small, table cells |
| `--text-base` | 16px | 400 | Body default |
| `--text-lg` | 18px | 500 | Subheadings |
| `--text-xl` | 24px | 500 | Section headings |
| `--text-2xl` | 32px | 600 (heading font) | Page titles |
| `--text-3xl` | 40px | 600 (heading font) | Hero |

Heading font: a serif (e.g., Fraunces or Source Serif) for a premium feel against the gold accent. Body font: Inter for clean, highly legible UI text — important for an Indian audience with varying device quality and connection speed (Inter renders crisply at small sizes).

---

## 2. Core Components

### Buttons
- **Primary**: gold fill (`--color-accent`), `--color-accent-text` text, `--radius-md`, hover → `--color-accent-dark`
- **Secondary**: near-black outline, transparent fill, near-black text; hover → near-black fill, white text
- **Disabled**: 40% opacity, no hover state, `cursor: not-allowed`
- **Loading**: spinner replaces label, button stays same width (no layout shift), disabled during load
- **Danger** (e.g., "Cancel order"): error-red outline/fill variant

### Inputs
- Text fields: `--color-border` default, `--color-accent` focus ring, `--color-error` border + helper text on validation failure
- All inputs have visible `<label>` (not placeholder-only — accessibility requirement)
- Select, textarea: same border/focus treatment as text fields
- Required fields marked with a visible indicator, not color alone

### Cards
- Product card: image (1:1 or 4:5 ratio), name, price, stock badge if low/out, "Add to cart" on hover (desktop) / always visible (mobile)
- Info card: used for policy summaries at checkout (Returns/Shipping snippets)

### Layout
- **Navbar**: logo (left), search (center, desktop only), cart icon + account menu (right). Mobile: hamburger menu, search as separate icon
- **Footer**: 4-column on desktop (Shop / Support / Legal / Connect), collapses to accordion on mobile. All legal pages linked here.
- **Admin sidebar**: persistent left nav (Products, Orders, Complaints, Risk, Settings), collapsible on smaller screens

### Modals, Alerts, Toasts
- Modal: centered, dimmed backdrop, focus-trapped, closeable via Esc and backdrop click
- Toast: bottom-right (desktop) / bottom-center (mobile), auto-dismiss 4s, color-coded by type (success/error/info), never the sole indicator of a critical state change (also reflected in UI)
- Alert banners: used for COD limit warnings, pincode-not-serviceable messages — inline, not modal, so they don't block reading context

---

## 3. Spacing & Layout Rules

- Base spacing unit: 4px, scale as defined above
- Container max-width: 1280px desktop, full-bleed with 16px gutters on mobile
- Mobile breakpoint: < 768px is the primary design target (per your mobile-first priority); desktop enhances rather than redesigns
- Touch targets: minimum 44×44px on all interactive elements (mobile accessibility)
- Product grid: 2 columns mobile, 3 tablet, 4 desktop

---

## 4. Third-Party Frontend Integrations

| Integration | Purpose | Loading strategy |
|---|---|---|
| Google Fonts (Inter, Fraunces) | Typography | `next/font` for self-hosting/optimization, not runtime Google Fonts CDN |
| Tabler Icons or Lucide | Iconography | Tree-shaken icon imports, not full icon font |
| GA4 (`gtag.js`) | Analytics | Loaded only after cookie consent is granted; `next/script` with `strategy="afterInteractive"` |
| Sentry | Error tracking | Standard Next.js Sentry SDK init |

---

## 5. Accessibility Commitments (WCAG-Oriented)

- All interactive elements keyboard-navigable (tab order follows visual order)
- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`, proper heading hierarchy (one `<h1>` per page)
- Color contrast: gold-on-near-black and near-black-on-gold both verified at AA minimum (4.5:1 for body text)
- Alt text required field for all product images in admin upload form (not optional)
- Form errors announced via `aria-live` region, not color alone
- Focus states visible on all interactive elements (never `outline: none` without a replacement focus style)

---

## 6. Page-Specific Notes

- **Product detail page:** COD availability and shipping/return summary must appear above the fold on mobile, near the "Add to cart" button — not buried below a long description (legal/UX requirement from master spec).
- **Checkout page:** order summary remains visible/sticky on scroll (desktop); collapsible summary on mobile so the address form isn't pushed off-screen.
- **Admin order list:** filter controls (status, date range, search) persist in URL query params so filtered views are shareable/bookmarkable internally.

---

*End of Frontend Specification Document. Proceed to Document 5 — Database Design.*
