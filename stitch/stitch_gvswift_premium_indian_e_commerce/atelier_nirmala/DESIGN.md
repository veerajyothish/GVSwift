---
name: Atelier Nirmala
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444844'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747874'
  outline-variant: '#c4c7c2'
  surface-tint: '#5b5f5b'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#181d19'
  on-primary-container: '#818580'
  inverse-primary: '#c4c7c2'
  secondary: '#615e58'
  on-secondary: '#ffffff'
  secondary-container: '#e4dfd7'
  on-secondary-container: '#65625c'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1c16'
  on-tertiary-container: '#87847c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e3de'
  primary-fixed-dim: '#c4c7c2'
  on-primary-fixed: '#181d19'
  on-primary-fixed-variant: '#444844'
  secondary-fixed: '#e7e2da'
  secondary-fixed-dim: '#cac6be'
  on-secondary-fixed: '#1d1c17'
  on-secondary-fixed-variant: '#494741'
  tertiary-fixed: '#e7e2d9'
  tertiary-fixed-dim: '#cac6be'
  on-tertiary-fixed: '#1d1c16'
  on-tertiary-fixed-variant: '#494740'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-xl: 120px
  stack-md: 64px
  stack-sm: 32px
---

## Brand & Style

The brand personality is rooted in **Museum Minimalism**—a high-end, gallery-like aesthetic that celebrates Indian fashion through negative space and stark contrast. It moves away from the warmth of the forest into the clarity of an editorial archive. The target audience is the discerning luxury consumer who appreciates heritage through a contemporary, global lens.

The design style is **High-Contrast Minimalism**. It uses pure white expanses to create a "sanctuary" for product photography, allowing the intricate textures of the garments to provide the visual complexity. The emotional response should be one of curated prestige, quiet confidence, and architectural precision.

## Colors

The palette is strictly controlled to ensure a high-contrast, prestigious environment. 

- **Primary:** Deep Black (#101411) is used for all core communication, typography, and primary call-to-actions. It provides the "ink on paper" feel.
- **Secondary:** Bone (#E5E0D8) acts as a structural separator. Use this for subtle dividers, button borders, and secondary backgrounds where pure white might feel too stark.
- **Tertiary:** Cream (#F2EDE4) is reserved for soft highlighting, such as hover states or section backgrounds that require a hint of organic warmth.
- **Background:** Pure White (#FFFFFF) is the foundation of the entire system, providing the maximum possible canvas for high-fashion imagery.

## Typography

This design system utilizes a pairing of **Libre Caslon Text** (serving as a high-quality alternative to Cormorant Garamond for digital clarity) and **DM Sans**. 

- **Headlines:** Use Libre Caslon Text for all editorial headers. It should be treated with generous leading. Display sizes should utilize slight negative letter-spacing to feel more like traditional metal type.
- **Body:** DM Sans provides a neutral, functional contrast to the serif headings. It ensures readability for product descriptions and long-form content.
- **Labels:** Use uppercase DM Sans with increased letter-spacing for navigation, buttons, and overlines to create a modern, architectural feel.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid**. On desktop, the content is centered within a 1440px container with expansive 64px margins to simulate the white border of a matted photograph.

- **Vertical Rhythm:** Use exaggerated vertical spacing (`stack-xl`) between major sections to emphasize the "Gallery" feel. 
- **Grid:** A 12-column grid is used for desktop. For fashion lookbooks, asymmetrical layouts are encouraged (e.g., an image spanning 7 columns with text in a 3-column block offset by 1 column).
- **Mobile:** Transition to a 4-column grid with 20px margins. Reduce vertical stacks to `stack-md` to maintain momentum.

## Elevation & Depth

To maintain the high-fashion minimalist aesthetic, this design system avoids traditional shadows entirely. Depth is communicated through **Tonal Layering** and **Structural Framing**.

- **Level 0 (Base):** Pure White (#FFFFFF).
- **Level 1 (Surface):** Bone (#E5E0D8) used for tooltips or drawers.
- **Outlines:** Use 1px solid lines in Deep Black (#101411) for high-emphasis containers and Secondary Bone (#E5E0D8) for subtle borders. 
- **Overlays:** Full-page transitions or modals should use a 90% opacity White backdrop to keep the interface feeling light and airy.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Every element—from buttons and input fields to product cards and image containers—must use 90-degree corners. This evokes architectural precision and the structured lines of high-fashion tailoring. The only exception is the natural, organic forms found within the photography itself, which should be framed by these sharp edges to create a "window" effect.

## Components

- **Buttons:** Primary buttons are solid Deep Black with White text. Secondary buttons are transparent with a 1px Deep Black border. All buttons use uppercase labels with `label-md` typography.
- **Input Fields:** Bottom-border only (1px Deep Black) to maintain a clean, minimal look. Labels float above the line in `label-sm`.
- **Cards:** Product cards have no borders or backgrounds. The focus is entirely on the image. Price and title are centered underneath in `body-md` and `label-md` respectively.
- **Lists:** Separated by 1px horizontal lines in Secondary Bone. High-contrast hover states should shift the background to Tertiary Cream.
- **Chips/Filters:** Rectangular (sharp corners) with a 1px Bone border. Active states are filled Deep Black with White text.
- **Navigation:** Top-tier navigation uses `label-md` with no icons. A simple 1px underline appears on hover to indicate selection.