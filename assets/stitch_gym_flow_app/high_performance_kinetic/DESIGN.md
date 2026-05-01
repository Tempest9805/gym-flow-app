---
name: High-Performance Kinetic
colors:
  surface: '#19101c'
  surface-dim: '#19101c'
  surface-bright: '#403643'
  surface-container-lowest: '#130b16'
  surface-container-low: '#211824'
  surface-container: '#251c28'
  surface-container-high: '#302733'
  surface-container-highest: '#3b313e'
  on-surface: '#eeddee'
  on-surface-variant: '#d4c0d7'
  inverse-surface: '#eeddee'
  inverse-on-surface: '#372d3a'
  outline: '#9d8ba0'
  outline-variant: '#504254'
  surface-tint: '#ebb2ff'
  primary: '#ebb2ff'
  on-primary: '#520072'
  primary-container: '#bc13fe'
  on-primary-container: '#ffffff'
  inverse-primary: '#9800d0'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#ffb960'
  on-tertiary: '#472a00'
  tertiary-container: '#a76900'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f8d8ff'
  primary-fixed-dim: '#ebb2ff'
  on-primary-fixed: '#320047'
  on-primary-fixed-variant: '#74009f'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb960'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#19101c'
  on-background: '#eeddee'
  surface-variant: '#3b313e'
typography:
  display-xl:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  touch-target-min: 48px
  gutter: 16px
  margin-mobile: 20px
  card-gap: 12px
---

## Brand & Style

The design system is engineered for elite athletic performance and focus. It adopts a **Kiosk-Minimalist** aesthetic, prioritizing maximum legibility and reduced cognitive load during high-intensity workouts. The personality is intense, premium, and focused.

The style merges **Minimalism** with **Vaporwave-inspired accents**, utilizing deep, light-absorbent backgrounds to allow neon interactive elements to "pop" with purpose. The interface should feel like a high-end piece of fitness equipment—utilitarian yet sophisticated. Every interaction is designed for "glanceability," ensuring users can digest critical biometric data or workout instructions in seconds.

## Colors

This design system utilizes a "Deep-Dark" hierarchy to minimize eye strain in gym environments and maximize the contrast of functional elements.

- **Background:** A near-black (#0A0A0A) base that grounds the experience.
- **Surface:** A slightly elevated charcoal (#1A1A1A) used for card containers and persistent navigation elements.
- **Primary Accent:** Neon Purple (#BC13FE) is reserved exclusively for primary actions, success states, and critical performance indicators.
- **Secondary Accent:** Soft Violet (#8B5CF6) provides a sophisticated transition for hover states, progress bars, and categorization.
- **Functional Neutrals:** Pure white for primary data and high-contrast grey for supporting metadata.

## Typography

The typography strategy leverages **Lexend** for headlines to tap into its athletic, highly readable character, and **Inter** for body text to maintain systematic clarity.

- **Numerical Data:** Weights and reps should use `display-xl` for immediate recognition from a distance (e.g., when the phone is on the floor).
- **Hierarchy:** Use `label-caps` in the soft violet secondary color to categorize sections without competing with primary headlines.
- **Weight:** Avoid light weights; maintain a minimum weight of 400 to ensure high contrast against the dark background.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model optimized for thumb-reachability. It uses an 8px base grid.

- **Safe Zones:** Generous 20px side margins ensure content does not bleed into screen edges.
- **Touch Targets:** All interactive elements must adhere to a minimum height of 48px, though primary workout triggers should aim for 64px to accommodate sweaty or shaky hands.
- **Rhythm:** Use large vertical gaps (32px+) between distinct workout blocks to maintain the "Kiosk" feel.

## Elevation & Depth

In this design system, depth is conveyed through **Tonal Layering** and **Luminescent Glows** rather than traditional shadows.

- **Surfaces:** Elements move closer to the user by becoming lighter. The background is #0A0A0A; cards are #1A1A1A; active states are #2A2A2A.
- **Inner Glows:** Primary buttons feature a subtle 8px blur neon purple outer glow (opacity 30%) to simulate a self-illuminating hardware interface.
- **Glassmorphism:** Use background blurs (20px+) only for global navigation overlays to maintain context of the workout underneath.

## Shapes

The shape language is **Modern-Rounded**, balancing the aggressiveness of the neon palette with approachable, ergonomic corners.

- **Primary Cards:** Use `rounded-lg` (16px) to create a soft, containerized feel for workout data.
- **Action Buttons:** Use `rounded-xl` (24px) or full pill-shapes for primary CTAs to make them feel "tactile" and distinct from layout containers.
- **Progress Bars:** Fully rounded (pill) ends to indicate fluid movement.

## Components

- **Primary CTA:** Solid neon purple (#BC13FE) background with black text for maximum contrast. Apply a subtle outer glow.
- **Workout Cards:** #1A1A1A background with 1px stroke of #2A2A2A. Use high-contrast white for the exercise name and soft violet for the set/rep count.
- **Progress Rings:** Use the neon purple for the active path and a 10% opacity version of the same color for the track.
- **Input Fields:** Large, touch-friendly fields with #1A1A1A fill. On focus, the border transitions to neon purple.
- **Metric Chips:** Small, pill-shaped labels with a secondary violet background at 15% opacity and solid violet text for categorization (e.g., "Strength," "Cardio").
- **Visual Hierarchy:** The "Start Workout" or "Finish Set" buttons should be the only elements using the solid neon purple fill to prevent visual clutter.