# GVSwift — Brand Guidelines (Stitch Design System)

**Document 12 of 12 | Version 1.0 | Status: Approved**

> The canonical, full-detail brand reference lives in `GVSwift_Brand_Guidelines.md` at the repo root. This document is the summary layer for developers working on UI code.

---

## 1. Brand Identity

GVSwift is a refined, commerce-focused platform built on understated luxury. The brand aesthetic is editorial fashion — restrained, confident, and warm. Every design decision prioritises clarity, elegance, and trustworthiness.

**Brand personality:** Sophisticated · Warm · Trustworthy · Clean · Premium

---

## 2. Colour Palette

### Primary

| Token | Hex | Role |
|---|---|---|
| Wine Red | `#6B1E2E` | Primary brand colour, CTAs, accents, links |
| Wine Dark | `#4A1520` | Hover/active states on primary buttons |
| Cream | `#FDFAF5` | Page background, text on dark surfaces |

### Surface

| Token | Hex | Role |
|---|---|---|
| Warm Surface | `#F5F0EB` | Cards, inputs, modals, secondary panels |
| Border | `#E8DDD9` | Dividers, input borders, card borders |

### Text

| Token | Hex | Role |
|---|---|---|
| Near Black | `#1A1A1A` | Primary body text, headings |
| Warm Muted | `#6B5B55` | Secondary text, captions, labels |

### Semantic

| Token | Hex | Role |
|---|---|---|
| Success | `#1B8553` | Confirmations, positive status |
| Warning | `#B3741B` | Caution messages |
| Error | `#CC2424` | Errors, destructive actions |
| Info | `#1B63B3` | Informational messages |

---

## 3. Typography

| Role | Font | Weights |
|---|---|---|
| Headings / Display | EB Garamond | 400, 500, 600 |
| Body / UI | Inter | 400, 500, 600, 700 |

**Rules:**
- EB Garamond only for h1–h4 and editorial display text, never below 22px.
- Inter for all body, labels, buttons, inputs, and navigation.
- Buttons: Inter 13px, weight 600, uppercase, letter-spacing 0.06em.

---

## 4. Spacing

All spacing derives from a **4px base unit**. No arbitrary pixel values.

| Token | Value |
|---|---|
| space-1 | 4px |
| space-2 | 8px |
| space-3 | 12px |
| space-4 | 16px |
| space-5 | 24px |
| space-6 | 32px |
| space-7 | 48px |
| space-8 | 64px |

---

## 5. Shape / Radius

| Token | Value | Used for |
|---|---|---|
| radius-sm | 4px | Badges, alerts |
| radius-md | 8px | Toasts, small cards |
| radius-lg | 16px | Product cards, modals |
| radius-pill | 9999px | Buttons, text inputs |

**Signature rule:** Buttons and text inputs are always pill-shaped. This is a defining GVSwift visual.

---

## 6. Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `#6B1E2E` | `#FDFAF5` | `#6B1E2E` |
| Secondary | Transparent | `#6B1E2E` | `#6B1E2E` |
| Outline | Transparent | `#6B1E2E` | `#6B1E2E` |
| Danger | Transparent | `#CC2424` | `#CC2424` |

- Min height: 44px (accessibility touch target).
- Only one primary CTA per screen view.
- Active press: `scale(0.97)` transform.
- Disabled: `opacity: 0.4`, `cursor: not-allowed`.
- No gradient fills on buttons — solid only.

---

## 7. Motion

- Standard duration: **150ms**.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Always respect `prefers-reduced-motion` — drop to `0.01ms` globally.
- Modal enter: slide up 16px + fade. Toast enter: slide up 20px + fade.

---

## 8. Accessibility Standards

| Standard | Requirement |
|---|---|
| Colour contrast (body text) | WCAG AA ≥ 4.5:1 |
| Colour contrast (large text ≥24px) | WCAG AA ≥ 3:1 |
| Touch targets | Minimum 44×44px |
| Focus indicators | 2px solid `#6B1E2E`, offset 2px |
| Motion | `prefers-reduced-motion` respected globally |
| Semantic HTML | `<header>`, `<nav>`, `<main>`, `<footer>` — no div-soup |
| Form inputs | Every input has an associated `<label>` |

---

## 9. Don'ts (Absolute Rules)

- ❌ No gradient fills on buttons or surfaces.
- ❌ No coloured left-border card decorations.
- ❌ No Tailwind, no CSS-in-JS, no component library (unless a ticket explicitly allows it).
- ❌ No `dangerouslySetInnerHTML` for user-generated content.
- ❌ No more than one primary CTA per screen view.
- ❌ No raw error codes shown to the user — always translate to human-readable messages.
- ❌ No centre-aligned body copy or card descriptions.
- ❌ No emoji as design elements or section icons.

---

*Full detail in `GVSwift_Brand_Guidelines.md`. This summary supersedes nothing — it is a quick-reference layer only.*
