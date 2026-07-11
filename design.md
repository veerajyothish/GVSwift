# GVSwift — Design.md
### Stitch Design System · Agent Reference Document

> **Assumptions (skipped interview — brand guidelines were fully specified):**
> Theme: Light only (cream surfaces, no dark mode currently specified).
> Corners: Pill for buttons + inputs (brand signature). `radius-lg` (16px) for cards + modals. `radius-sm` (4px) for badges + alerts.
> Shadows: Subtle, warm-tinted. Elevation comes from shadow + surface shift combined — never colour alone.
> Density: Balanced — airy for editorial sections, tighter for product grids and UI chrome.
> Aesthetic adjacency: Aesop (warm, typographic restraint) meets Stripe (precision UI, clean components).
> Never: Gradients on any interactive element. Coloured left-border cards. Centred body copy. Purple/blue-purple in any UI role.

***

## Header

**Brand:** GVSwift
**Vibe:** A private members' wine cellar that happens to sell beautifully — warm stone walls, brass fittings, nothing out of place.
**Theme:** Light only

***

## Style Summary

GVSwift is a commerce platform dressed in editorial restraint. The page canvas is warm cream, not stark white — it reads as paper, not screen. Wine Red (`#6B1E2E`) appears only where it earns attention: primary CTAs, active links, and focused inputs. Every other surface is a gradient of warm neutrals that create depth through layering rather than shadow. EB Garamond sets all headings — unhurried, authoritative, slightly literary — while Inter handles every functional element with precision. Buttons and inputs are always pill-shaped; this is not a theme option, it is a brand signature. The overall effect should feel like a premium retail experience translated to software: nothing flashy, nothing generic, everything considered.

***

## Tokens — Colors

| Name | Hex | CSS Token | Role |
|------|-----|-----------|------|
| Wine Red | `#6B1E2E` | `--color-primary` | Primary CTAs, links, active states, focus rings |
| Wine Dark | `#4A1520` | `--color-accent-dark` | Hover + active on primary buttons only |
| Wine Light | `#7D2435` | `--color-primary-light` | Alternative hover (secondary button hover bg) |
| Cream | `#FDFAF5` | `--color-bg` | Page canvas background |
| Warm Surface | `#F5F0EB` | `--color-surface` | Cards, inputs, modals, secondary panels |
| Border | `#E8DDD9` | `--color-border` | All 1px dividers, input borders, card borders |
| Near Black | `#1A1A1A` | `--color-text-primary` | Body copy, all headings |
| Warm Muted | `#6B5B55` | `--color-text-secondary` | Labels, captions, placeholders, secondary info |
| Cream Inverse | `#FDFAF5` | `--color-text-on-dark` | Text rendered on Wine Red backgrounds |
| Success | `#1B8553` | `--color-success` | Positive status, confirmation only |
| Success BG | `rgba(27,133,83,0.1)` | `--color-success-bg` | Alert banner fill for success state |
| Warning | `#B3741B` | `--color-warning` | Caution messages only |
| Warning BG | `rgba(179,116,27,0.1)` | `--color-warning-bg` | Alert banner fill for warning state |
| Error | `#CC2424` | `--color-error` | Errors, destructive actions only |
| Error BG | `rgba(204,36,36,0.1)` | `--color-error-bg` | Alert banner fill for error state |
| Info | `#1B63B3` | `--color-info` | Informational messages only |
| Info BG | `rgba(27,99,179,0.1)` | `--color-info-bg` | Alert banner fill for info state |

> **Rule:** Semantic colours (Success, Warning, Error, Info) are strictly for feedback states. They never appear in decorative, layout, or brand roles. If a design calls for a coloured tag or badge in a non-feedback context, use Wine Red or Warm Muted — not a semantic colour.

***

## Tokens — Typography

### Font Families

| Role | Family | Fallback | Weights | Source |
|------|--------|----------|---------|--------|
| Display (headings) | EB Garamond | Georgia, serif | 400, 500, 600 | Google Fonts |
| Body (UI) | Inter | system-ui, sans-serif | 400, 500, 600, 700 | Google Fonts |

> **Free substitute for EB Garamond:** Lora (Google Fonts) — similar editorial warmth, open source.
> **Free substitute for Inter:** DM Sans (Google Fonts) — similar geometric clarity.

### Type Scale

| Role | Token | Size | Weight | Font | Line Height | Letter Spacing |
|------|-------|------|--------|------|-------------|----------------|
| Micro / metadata | `text-xs` | 12px | 400 | Inter | 1.4 | 0 |
| Caption / secondary | `text-sm` | 14px | 400 | Inter | 1.5 | 0 |
| Body (default) | `text-base` | 16px | 400 | Inter | 1.6 | 0 |
| Subheading / card title | `text-lg` | 18px | 500 | Inter | 1.4 | 0 |
| Section heading | `text-xl` | 24px | 500–600 | EB Garamond or Inter bold | 1.2 | 0 |
| Page title | `text-2xl` | 32px | 600 | EB Garamond | 1.2 | -0.01em |
| Hero heading | `text-3xl` | 40px | 600 | EB Garamond | 1.1 | -0.02em |
| Button label | — | 13px | 600 | Inter | 1 | 0.06em |
| Input label | — | 11px | 600 | Inter | 1 | 0.08em |

### Typography Rules for the Agent
- EB Garamond is used at `text-xl` (24px) and above **only**. Never use EB Garamond at 22px or below.
- Button and input labels are always `uppercase`. No other UI element is uppercased.
- Body copy `max-width: 72ch`. Never allow prose lines wider than 72 characters.
- Headings use `text-wrap: balance`. Paragraphs use `text-wrap: pretty`.
- Do not use EB Garamond for navigation, buttons, badges, form elements, or any interactive UI.

***

## Tokens — Spacing, Shapes, Shadows, Layout

### Spacing Scale (4px base grid)

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Icon-to-label gap, internal tight padding |
| `space-2` | 8px | Between sibling UI elements |
| `space-3` | 12px | Form field internal gap |
| `space-4` | 16px | Component padding, list item gap |
| `space-5` | 24px | Card padding, section separator |
| `space-6` | 32px | Between components in a section |
| `space-7` | 48px | Between major page sections |
| `space-8` | 64px | Top/bottom page-level padding |

### Border Radius by Element Type

| Element | Radius | Value |
|---------|--------|-------|
| Primary button | `radius-pill` | 9999px |
| Secondary button | `radius-pill` | 9999px |
| Outline button | `radius-pill` | 9999px |
| Text input | `radius-pill` | 9999px |
| Textarea | `radius-lg` | 16px |
| Select | `radius-pill` | 9999px |
| Card | `radius-lg` | 16px |
| Modal | `radius-lg` | 16px |
| Toast | `radius-md` | 8px |
| Badge / tag | `radius-sm` | 4px |
| Alert banner | `radius-md` | 8px |
| Avatar | `radius-pill` | 9999px |
| Danger button | `radius-sm` | 4px |
| Success button | `radius-sm` | 4px |

> **Nested radius rule:** When an inner element sits inside a rounded container, its radius = container radius − container padding. If padding ≥ container radius, inner element radius = 0.

### Shadows

| Token | CSS Value | Applied To |
|-------|-----------|------------|
| `shadow-sm` | `0 1px 2px rgba(107,30,46,0.05)` | Cards at rest, form inputs at rest |
| `shadow-md` | `0 4px 12px rgba(107,30,46,0.07), 0 2px 4px rgba(107,30,46,0.04)` | Card hover, dropdowns, tooltips |
| `shadow-lg` | `0 16px 40px rgba(107,30,46,0.08), 0 4px 12px rgba(107,30,46,0.05)` | Modals, sheet panels, floating menus |

> **Shadow tint rule:** All shadows use `rgba(107,30,46,…)` — the Wine Red RGB — at very low opacity. Never use pure black (`rgba(0,0,0,…)`) shadows. The warmth of the tint is intentional and must be preserved.

### Layout Constants

| Constant | Value |
|----------|-------|
| Page max-width | `1100px` |
| Narrow container (forms, articles) | `800px` |
| Page horizontal padding | `20px` (mobile), `40px` (desktop) |
| Section vertical gap | `48px` (`space-7`) |
| Card padding | `24px` (`space-5`) |
| Nav height | `64px` |
| Modal max-width (standard) | `520px` |
| Modal max-width (compact) | `480px` |

***

## Components

### Primary Button
- Background: `--color-primary` (`#6B1E2E`)
- Text: `--color-text-on-dark` (`#FDFAF5`)
- Border: 1px solid `--color-primary`
- Radius: `radius-pill` (9999px)
- Font: Inter, 13px, weight 600, uppercase, letter-spacing 0.06em
- Padding: 12px 32px
- Min-height: 44px
- Hover: background → `--color-accent-dark` (`#4A1520`), border → `#4A1520`
- Active: `transform: scale(0.97)`
- Disabled: `opacity: 0.4`, cursor `not-allowed`
- Loading: text transparent, animated spinner centred, 18px, border 2px, spin 0.65s linear
- **Never** use gradient fill. **Never** round less than pill on this button.

### Secondary Button
- Background: `transparent`
- Text: `--color-primary` (`#6B1E2E`)
- Border: 1px solid `--color-primary`
- Radius: `radius-pill`
- Font: same as primary
- Hover: background → `--color-primary`, text → `--color-text-on-dark`
- Active: `transform: scale(0.97)`

### Outline Button (alias of Secondary)
- Same spec as Secondary. Use this token name in code: `.btn-outline`

### Danger Button
- Background: `transparent`
- Text: `--color-error` (`#CC2424`)
- Border: 1px solid `--color-error`
- Radius: `radius-sm` (4px) — **not pill**
- Hover: background → `--color-error`, text → `#FDFAF5`

### Success Button
- Background: `--color-success` (`#1B8553`)
- Text: `#ffffff`
- Border: `--color-success`
- Radius: `radius-sm` (4px) — **not pill**
- Hover: background → `#166b43`

### Navigation Bar
- Height: 64px
- Background: `--color-bg` (`#FDFAF5`)
- Border-bottom: 1px solid `--color-border` (`#E8DDD9`)
- Logo: left-aligned, wordmark only
- Nav links: Inter, 14px, weight 500, color `--color-text-primary`, no underline
- Active/current link: color `--color-primary`, weight 600
- Hover link: color `--color-primary`
- CTA in nav: Primary Button, `btn-sm` size (padding 6px 16px, min-height 36px)
- Mobile: hamburger icon, full-screen overlay or slide-in panel. Never a fixed bottom tab bar for this brand.
- Position: sticky top, `z-index: 100`

### Card (Product)
- Background: `--color-bg` (`#FDFAF5`)
- Border: 1px solid `--color-border` (`#E8DDD9`)
- Radius: `radius-lg` (16px)
- Shadow at rest: `shadow-sm`
- Hover: `translateY(-3px)` + `shadow-md`, transition 150ms `cubic-bezier(0.16,1,0.3,1)`
- Content padding: `space-4` (16px) sides, `space-5` (24px) bottom
- Title: Inter, 18px, weight 500, `--color-text-primary`
- Body/description: Inter, 14px, weight 400, `--color-text-secondary`
- Price: Inter, 16px, weight 600, `--color-text-primary`, `font-variant-numeric: tabular-nums`
- **Never** use a coloured left border stripe on any card variant.
- **Never** put a coloured circle icon in the card header.

### Card (Info / Generic)
- Background: `--color-surface` (`#F5F0EB`)
- Border: 1px solid `--color-border`
- Radius: `radius-lg` (16px)
- Shadow: `shadow-sm`
- Padding: `space-5` (24px)

### Text Input
- Background: `--color-surface` (`#F5F0EB`)
- Border: 1px solid `--color-border` (`#E8DDD9`)
- Radius: `radius-pill` (9999px)
- Padding: 12px 18px
- Min-height: 48px
- Font: Inter, 15px, weight 400
- Placeholder: `--color-text-secondary` at 60% opacity
- Focus: border → `--color-primary`, `box-shadow: 0 0 0 3px rgba(107,30,46,0.12)`
- Error state: border → `--color-error`, focus ring → `rgba(204,36,36,0.12)`
- Label above input: Inter, 11px, weight 600, uppercase, letter-spacing 0.08em, color `--color-text-secondary`
- Required marker: `::after { content: "*"; color: --color-error; }`
- Textarea: same as input but radius `radius-lg` (16px), min-height 100px, resize vertical
- Select: same as input, custom chevron SVG in Wine Red, no native `appearance`

### Badge / Tag
- Radius: `radius-sm` (4px)
- Font: Inter, 12px, weight 500
- Padding: 3px 8px
- Default: background `--color-surface`, text `--color-text-secondary`, border `--color-border`
- Accent variant: background `rgba(107,30,46,0.08)`, text `--color-primary`
- **Never** use a semantic colour (green, red, amber) for a non-feedback badge.

### Section Header
- Heading: EB Garamond, `text-2xl` (32px), weight 600, `--color-text-primary`
- Subheading/description: Inter, `text-base` (16px), weight 400, `--color-text-secondary`
- Max-width on description: 60ch
- Alignment: **left-aligned** — never centred unless it is a single isolated hero callout
- Margin below before content: `space-6` (32px)

### Footer
- Background: `--color-surface` (`#F5F0EB`)
- Border-top: 1px solid `--color-border`
- Padding: `space-7` (48px) top/bottom, `space-5` (24px) sides
- Link colour: `--color-text-secondary`, hover → `--color-primary`
- Legal text: Inter, 12px, weight 400, `--color-text-secondary`
- Max-width container: `1100px`, centred

***

## Do's and Don'ts

### ✅ Do's

1. **Always use pill radius on buttons and text inputs.** `border-radius: 9999px` is non-negotiable for these elements — it is the GVSwift signature shape.
2. **Left-align all body text, card descriptions, and section headers by default.** Only hero headings and short single-line callouts may be centred, and only when they are visually isolated.
3. **Tint every shadow with Wine Red RGB `rgba(107,30,46,…)`.** Cold black shadows break the warm palette. Use the specified shadow tokens — never write a shadow with `rgba(0,0,0,…)`.
4. **Use EB Garamond only at 24px and above.** Below that, always switch to Inter. The font shift between 22px and 24px is a hard rule, not a suggestion.
5. **Give every interactive element an `:active` state with `scale(0.97)`.** Buttons, cards with links, icon buttons — all of them. The micro-compression confirms a tap.
6. **Use `font-variant-numeric: tabular-nums` on all prices, order numbers, counts, and data values.** Numbers that change width on update cause layout shift.
7. **Respect `prefers-reduced-motion`.** All transitions drop to `0.01ms` duration globally. Never hardcode durations inline — always reference the transition variable or class.
8. **Every form input must have a visible `<label>` element** — not a placeholder-as-label. Placeholder text may exist alongside the label but never replaces it.
9. **Use semantic HTML elements.** `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`. No `<div>` where a semantic element exists.
10. **When appending a correction to this file, be specific and non-vague.** Write "Buttons never use `border-radius` above `9999px` or below `9999px` (pill only)" — not "keep corners consistent."

### ❌ Don'ts

1. **Don't use gradient fills on any button, badge, or interactive element.** Solid fill only. `background: linear-gradient(…)` on a button is an immediate reject.
2. **Don't add a coloured left border stripe to any card.** No `border-left: 3px solid <color>`. Cards use surface elevation (shadow + background shift) to signal status — never a painted edge.
3. **Don't use purple, violet, indigo, or blue-purple in any UI role.** These colours do not exist in the GVSwift palette and must never be introduced — not for accents, not for "variety," not for hover states.
4. **Don't centre-align body copy, card text, or section descriptions.** If you find yourself adding `text-align: center` to a paragraph or card description, stop. Left-align is the default. Only hero headings in visually isolated hero sections may be centred.
5. **Don't apply the same `border-radius` to a container and its inner element.** Inner radius = outer radius − padding. If padding ≥ outer radius, inner radius = 0. Matching radii on nested elements creates a "lumpy" look.
6. **Don't use emoji as section icons, feature icons, or decorative elements.** Use Lucide or Phosphor icon components, or rely on typography and whitespace alone.
7. **Don't use more than one primary CTA per screen view.** If a page section has two equally weighted Wine Red buttons, one of them is wrong — demote it to secondary or ghost.
8. **Don't use semantic colours (success green, error red, warning amber) for decorative or categorical tags.** They are reserved exclusively for feedback states: confirmations, errors, warnings, and informational notices.
9. **Don't write vague error messages.** "Email is required", "Password must be at least 8 characters", "That coupon has expired" — always specific. Never "Error", "Invalid input", or raw error codes.
10. **Don't use `localStorage` or `sessionStorage`.** GVSwift pages may be served in sandboxed contexts. All transient UI state must live in memory variables, not browser storage.
11. **Don't use system fonts as the primary typeface.** Arial, Helvetica, Georgia, Times New Roman, and Calibri are fallbacks in the font stack only. EB Garamond and Inter must always be loaded from Google Fonts before any rendering.
12. **Don't use the 3-column symmetrical icon-card grid layout.** (icon in coloured circle + bold title + 2-line description, repeated 3×). This is the most recognisable AI-generated layout pattern. Use asymmetric grids, staggered layouts, or narrative flows instead.

***

## Surfaces and Elevation

GVSwift uses a three-layer surface system. Elevation is achieved by combining a surface colour shift with a warm shadow — never by colour alone.

| Layer | Token | Hex | Allowed Shadow | Elements |
|-------|-------|-----|----------------|----------|
| Canvas | `--color-bg` | `#FDFAF5` | None | Page background, nav background, footer |
| Raised | `--color-surface` | `#F5F0EB` | `shadow-sm` | Cards (info), inputs, modals (body), sidebar panels |
| Floating | `--color-bg` | `#FDFAF5` | `shadow-lg` | Modals (container), dropdown menus, sheet panels |
| Overlay | — | `rgba(26,26,26,0.45)` + `backdrop-filter: blur(4px)` | — | Modal backdrop, drawer backdrop |

### Elevation Rules
- **Canvas elements have no shadow.** The nav bar has only a bottom border, not a shadow.
- **Cards at rest use `shadow-sm`.** On hover they elevate to `shadow-md` with a `translateY(-3px)` lift.
- **Modals use `shadow-lg`** to separate clearly from the blurred overlay beneath them.
- **Dropdowns and tooltips use `shadow-md`.** They are floating but not as elevated as a modal.
- **Inputs do not have a shadow at rest.** Their resting state is the border only. Focus adds the Wine Red ring.
- A coloured fill never substitutes for elevation. Do not use Wine Red fills on sections to create depth.

***

## Layout

### Page Structure
- Single scrolling page with anchor-based section navigation where applicable.
- All content constrained to `max-width: 1100px`, centred with `margin-inline: auto`.
- Narrow contexts (checkout forms, article body, settings pages): `max-width: 800px`.
- Page horizontal padding: `20px` on mobile (≤767px), `40px` on desktop (≥768px).

### Section Rhythm
- Section vertical gap: `padding-block: 48px` (`space-7`) as the default.
- Hero sections may increase to `64px` top, `48px` bottom.
- Dense grid sections (product listings) may reduce to `32px` bottom.
- Consecutive sections of the same surface colour **must** be separated by at least `space-7` or a `1px` border — never a coloured divider.

### Column Patterns
- **Single column:** prose, forms, confirmation pages, 600px content max-width
- **2-column:** feature comparisons, hero with image, settings sidebar + content
- **3-column:** product grids, blog card grids. Collapse to 2 at 768px, 1 at 480px.
- **4-column:** dense product grids at desktop only. Collapse to 2 at 768px, 1 at 480px.
- Use CSS Grid. `gap` always references a `space-*` token — never arbitrary pixel gaps.

### Alignment
- Text: left-aligned by default. **Never** centre body copy.
- CTAs within a section: left-aligned with the section content.
- Section headers: left-aligned. Exception: hero sections with a centred single headline.
- Icon + text pairs: vertically centred (`align-items: center`).

### Mobile Rules
- Design at 375px first.
- Touch targets minimum 44×44px — buttons, nav links, icon buttons.
- Bottom-anchored sticky CTAs for checkout and key conversion flows.
- Navigation: hamburger at ≤767px, slide-in side panel or full overlay. No fixed bottom tab bar.
- Body font stays at 16px (prevents iOS auto-zoom on inputs).

***

## Agent Quick Reference

```
text-color:        #1A1A1A   (--color-text-primary)
text-muted:        #6B5B55   (--color-text-secondary)
background:        #FDFAF5   (--color-bg)
card-surface:      #F5F0EB   (--color-surface)
border:            #E8DDD9   (--color-border)
accent:            #6B1E2E   (--color-primary)
accent-hover:      #4A1520   (--color-accent-dark)
accent-text:       #FDFAF5   (--color-text-on-dark)
font-display:      'EB Garamond', Georgia, serif
font-body:         'Inter', system-ui, sans-serif
radius-button:     9999px
radius-card:       16px
radius-input:      9999px
radius-badge:      4px
shadow-card:       0 1px 2px rgba(107,30,46,0.05)
shadow-modal:      0 16px 40px rgba(107,30,46,0.08), 0 4px 12px rgba(107,30,46,0.05)
transition:        150ms cubic-bezier(0.16,1,0.3,1)
page-max-width:    1100px
section-gap:       48px
```

### Example Component Prompts for Claude Code

**Prompt 1 — Product Card:**
> "Build a product card component using the GVSwift Design.md. Background `#FDFAF5`, border `1px solid #E8DDD9`, `border-radius: 16px`, `box-shadow: 0 1px 2px rgba(107,30,46,0.05)`. On hover: `translateY(-3px)` and shadow-md. Product title in Inter 18px weight 500. Price in Inter 16px weight 600 with `font-variant-numeric: tabular-nums`. Add to Cart button is pill-shaped, background `#6B1E2E`, text `#FDFAF5`, Inter 13px uppercase weight 600 letter-spacing 0.06em."

**Prompt 2 — Primary Button:**
> "Create a primary button following GVSwift Design.md: background `#6B1E2E`, text `#FDFAF5`, `border-radius: 9999px`, padding `12px 32px`, min-height 44px, Inter 13px weight 600 uppercase letter-spacing 0.06em. Hover state background `#4A1520`. Active state `transform: scale(0.97)`. Disabled `opacity: 0.4`. Loading state: transparent text + centred spin animation."

**Prompt 3 — Section with heading and cards:**
> "Build a section following GVSwift Design.md. Section heading in EB Garamond 32px weight 600, left-aligned. Description in Inter 16px `#6B5B55`, max-width 60ch. Below: a 3-column product card grid (collapse to 2 at 768px, 1 at 480px), gap 24px. All spacing from the 4px token scale. No centred text, no coloured left-border cards, no gradient fills."

***

## Quick Start — CSS Custom Properties

Drop this block into your `:root {}` as the single source of truth for all design tokens.

```css
:root {
  /* Colors */
  --color-primary:        #6B1E2E;
  --color-primary-light:  #7D2435;
  --color-accent-dark:    #4A1520;
  --color-accent-text:    #FDFAF5;

  --color-bg:             #FDFAF5;
  --color-surface:        #F5F0EB;
  --color-border:         #E8DDD9;

  --color-text-primary:   #1A1A1A;
  --color-text-secondary: #6B5B55;
  --color-text-on-dark:   #FDFAF5;

  --color-success:        #1B8553;
  --color-success-bg:     rgba(27, 133, 83, 0.1);
  --color-warning:        #B3741B;
  --color-warning-bg:     rgba(179, 116, 27, 0.1);
  --color-error:          #CC2424;
  --color-error-bg:       rgba(204, 36, 36, 0.1);
  --color-info:           #1B63B3;
  --color-info-bg:        rgba(27, 99, 179, 0.1);

  /* Typography */
  --font-display:         'EB Garamond', Georgia, serif;
  --font-body:            'Inter', system-ui, -apple-system, sans-serif;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;

  /* Border Radius */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   16px;
  --radius-pill: 9999px;

  /* Shadows (warm-tinted with Wine Red RGB) */
  --shadow-sm: 0 1px 2px rgba(107, 30, 46, 0.05);
  --shadow-md: 0 4px 12px rgba(107, 30, 46, 0.07), 0 2px 4px rgba(107, 30, 46, 0.04);
  --shadow-lg: 0 16px 40px rgba(107, 30, 46, 0.08), 0 4px 12px rgba(107, 30, 46, 0.05);

  /* Transitions */
  --transition: 150ms cubic-bezier(0.16, 1, 0.3, 1);

  /* Layout */
  --content-default: 1100px;
  --content-narrow:  800px;
}
```

***

*GVSwift Design.md — Stitch Design System v1.0 · Commit to repo root and reference in every Claude Code session.*
