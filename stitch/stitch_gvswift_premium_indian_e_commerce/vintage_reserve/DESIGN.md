---
name: Vintage Reserve
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#534343'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#867273'
  outline-variant: '#d8c1c2'
  surface-tint: '#92484f'
  primary: '#561922'
  on-primary: '#ffffff'
  primary-container: '#722f37'
  on-primary-container: '#f499a0'
  inverse-primary: '#ffb2b8'
  secondary: '#605e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2dd'
  on-secondary-container: '#666460'
  tertiary: '#452805'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f3e19'
  on-tertiary-container: '#d9aa7c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdadb'
  primary-fixed-dim: '#ffb2b8'
  on-primary-fixed: '#3c0610'
  on-primary-fixed-variant: '#753139'
  secondary-fixed: '#e6e2dd'
  secondary-fixed-dim: '#c9c6c1'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#484743'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#eebd8e'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#61401b'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 64px
    fontWeight: '500'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system is anchored in a narrative of heritage, craftsmanship, and timeless elegance. Targeted at a discerning audience that values quality over quantity, it evokes an emotional response of quiet confidence and established luxury. 

The aesthetic identity is a refined blend of **Minimalism** and **Modern Heritage**. It utilizes expansive whitespace (or "cream-space") to allow high-end imagery and typography to breathe. While the brand remains rooted in tradition, it embraces organic, softened forms to provide a more approachable and contemporary feel to the luxury experience, moving away from rigid architectural lines toward fluid, curated comfort.

## Colors

The palette is built upon a high-contrast foundation that balances warmth with authority. 

- **Primary (Deep Wine Red):** Used exclusively for high-priority actions, active states, and structural accents. It represents the "heart" of the brand.
- **Secondary (Warm Cream):** The primary canvas color. It replaces pure white to reduce eye strain and provide a sophisticated, editorial backdrop.
- **Neutral (Dark Charcoal):** Reserved for primary text and iconography to ensure maximum legibility and a grounded feel.
- **Tertiary (Gold Dust):** A muted metallic used for decorative elements, subtle dividers, and secondary highlights to reinforce the premium positioning.

## Typography

The typographic strategy pairs the classical grace of **EB Garamond** (as a high-end alternative to Cormorant Garamond) with the modern precision of **Manrope**.

- **Serif Display:** Used for headlines and storytelling elements. Tight letter-spacing in larger sizes mimics luxury editorial layouts.
- **Sans-Serif Functional:** Used for body copy, UI controls, and labels. Manrope provides a contemporary balance to the serif, ensuring the interface feels modern and accessible despite its traditional roots.
- **Labels:** Always utilize increased letter-spacing and uppercase styling to denote hierarchy without relying on heavy weights.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy for desktop to maintain a curated, boutique feel, while transitioning to a **Fluid Grid** for mobile devices.

- **Rhythm:** A strict 8px baseline grid governs all vertical spacing.
- **Desktop:** 12-column grid with generous 64px outer margins to create a "frame" effect around content.
- **Mobile:** 4-column grid with 20px margins.
- **Composition:** Elements should prioritize asymmetrical balance and large "negative space" blocks to emphasize the premium nature of the content.

## Elevation & Depth

To maintain a sense of classic luxury, the design system avoids heavy drop shadows in favor of **Tonal Layers** and **Refined Outlines**.

- **Surfaces:** Depth is created by layering subtle variations of Cream and pure white.
- **Borders:** Instead of shadows, use 1px solid borders in Wine Red (#722F37) or a lightened Cream-Stroke (#E5E0DA) to define containers.
- **Active Elevation:** When an element is interacted with, it does not "lift" (shadow), but rather changes its border weight or background intensity, mimicking the feel of a premium, embossed texture.

## Shapes

The shape language is **Pill-shaped (High Rounding)**. 

Extensive rounding communicates softness, premium comfort, and a contemporary editorial aesthetic. This "pill" policy applies to buttons, chips, and small UI controls. Containers and cards utilize large radii (e.g., 3rem for `rounded-xl`) to create a "soft-luxury" feel that contrasts beautifully with the sharp, classical serif typography. This visual tension between historical type and modern, rounded shapes is a signature of the system.

## Components

- **Buttons:** Primary buttons use a solid Wine Red background with Cream text. They are fully pill-shaped (rounded-full). Secondary buttons use a Wine Red 1px border with a pill shape.
- **Input Fields:** Fully rounded containers with subtle charcoal borders. The focus state shifts the border to Wine Red with a 2px weight.
- **Cards:** Defined by high corner radii (32px+) and thin, low-contrast borders. Avoid shadows; use generous internal padding (32px+) to signify importance.
- **Lists:** Separated by thin Gold or Cream dividers. Hover states should utilize a subtle background tint change within rounded selection areas.
- **Navigation:** Top-tier navigation uses uppercase Manrope labels. Active states are indicated by a small, pill-shaped Wine Red dot or a subtle background pill-shape around the text.
- **Featured Quotes:** Use EB Garamond Italic. Instead of a hard left border, quotes are often contained in highly rounded, soft-cream containers to highlight editorial testimonials.