---
name: Kinetic Noir
colors:
  surface: '#1e100b'
  surface-dim: '#1e100b'
  surface-bright: '#47352f'
  surface-container-lowest: '#180b07'
  surface-container-low: '#271813'
  surface-container: '#2b1c17'
  surface-container-high: '#372621'
  surface-container-highest: '#42312b'
  on-surface: '#f9dcd4'
  on-surface-variant: '#e3bfb3'
  inverse-surface: '#f9dcd4'
  inverse-on-surface: '#3d2c27'
  outline: '#aa897f'
  outline-variant: '#5b4138'
  surface-tint: '#ffb59c'
  primary: '#ffb59c'
  on-primary: '#5c1900'
  primary-container: '#ff5f1f'
  on-primary-container: '#561700'
  inverse-primary: '#ab3600'
  secondary: '#ffb68e'
  on-secondary: '#532200'
  secondary-container: '#ab4c00'
  on-secondary-container: '#ffe2d5'
  tertiary: '#8dcdff'
  on-tertiary: '#00344f'
  tertiary-container: '#009de4'
  on-tertiary-container: '#00304a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832700'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb68e'
  on-secondary-fixed: '#331200'
  on-secondary-fixed-variant: '#763300'
  tertiary-fixed: '#cae6ff'
  tertiary-fixed-dim: '#8dcdff'
  on-tertiary-fixed: '#001e30'
  on-tertiary-fixed-variant: '#004b70'
  background: '#1e100b'
  on-background: '#f9dcd4'
  surface-variant: '#42312b'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title-sm:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base_unit: 8px
  touch_target_min: 48px
  container_padding: 24px
  card_gutter: 16px
  section_margin: 40px
---

## Brand & Style

This design system is engineered for the high-intensity environment of a modern fitness facility. It leverages a **High-Contrast / Bold** aesthetic paired with **Minimalist** functionalism to ensure maximum readability under stadium lighting or during peak physical exertion. The brand personality is aggressive, disciplined, and premium. 

The visual language evokes the feeling of a high-end automotive dashboard or a professional athlete’s telemetry monitor. By utilizing a "kiosk-style" philosophy, the UI prioritizes massive touch targets and reduces cognitive load, allowing users to focus entirely on their performance. The atmosphere is nocturnal and focused, using neon accents to guide the eye toward primary actions without overwhelming the user.

## Colors

The palette is anchored in a deep, near-black graphite to minimize glare and create a sophisticated "dark mode" foundation. 

- **Primary Accent (Neon Orange):** Reserved for critical calls to action, active states, and progress indicators. It serves as the "energy" of the system.
- **Secondary Accent (Warm Amber):** Used for secondary interactive elements, warning states, or to differentiate workout categories. It provides a grounded, industrial contrast to the neon.
- **Neutral Hierarchy:** Pure White is strictly used for headlines to ensure maximum legibility. Cool Gray (#94A3B8) is utilized for body copy and metadata to reduce visual vibration against the dark background.

## Typography

The typography strategy utilizes **Lexend** for all structural and data-heavy elements. Chosen for its athletic and highly readable character, it provides a sense of momentum and clarity. **Inter** is used for longer-form body text where functional, neutral clarity is required.

All headlines should be rendered in Pure White. To reinforce the kiosk-style simplicity, avoid mid-range font sizes; use large Display styles for primary data (like reps or timers) and distinct Labels for metadata. Uppercase styling is encouraged for labels and navigation items to evoke a technical, high-performance feel.

## Layout & Spacing

The system follows a **Fluid Grid** with generous safe-area margins to accommodate handheld use or mounted kiosks. 

- **Touch Logic:** Every interactive element must adhere to a minimum 48px height/width. 
- **Rhythm:** A strictly linear vertical flow is preferred. Elements are separated by large 40px margins to prevent accidental taps and to create a "breathable" high-end feel.
- **Grids:** Use a 4-column grid for mobile/kiosk views. Cards should typically span the full width of the container minus the 24px side margins to maximize information density within the touch zones.

## Elevation & Depth

This design system eschews traditional soft shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. 

Depth is communicated through brightness: 
- **Level 0 (Base):** #121212.
- **Level 1 (Cards/Surfaces):** #1E1E1E.
- **Level 2 (Active/Hover):** A subtle 1px border using the Secondary Amber (#B45309) at 20% opacity.

The "Kiosk" feel is reinforced by keeping the UI relatively flat, ensuring that the vibrancy of the Neon Orange provides the primary sense of "lift" and importance rather than artificial drop shadows.

## Shapes

The shape language is **Soft (0.25rem)**. This slight rounding provides a professional, engineered look that feels more precise than "bubbly" pill shapes, yet more modern than sharp, brutalist corners. 

Buttons and input fields should use the base `rounded` (4px), while large card containers may use `rounded-lg` (8px) to subtly frame the content. This geometric precision aligns with the high-performance gym theme.

## Components

### TopAppBar
A fixed header containing a centered brand logo and a right-aligned **Language Toggle**. The toggle should be a text-only button in Lexend Bold, using the Secondary Amber color.

### BottomNavBar
A high-visibility bar with 5 items (Home, Exercises, Agenda, Routines, Profile). Use active-state tinting where the selected icon and label glow in Neon Orange, while inactive items remain in Cool Gray. Height must be at least 64px for easy thumb access.

### Cards
Standardized charcoal blocks (#1E1E1E). All cards feature a 24px internal padding. Title text is Pure White Lexend; supporting data (e.g., "3 Sets • 12 Reps") is Cool Gray Inter.

### Buttons
- **Primary:** Solid Neon Orange background with Black text for maximum contrast.
- **Secondary:** Transparent background with a 2px Neon Orange border and Neon Orange text.

### Inputs & Toggles
Large-scale input fields with #1E1E1E backgrounds and a bottom-border focus state in Neon Orange. Checkboxes and radios should be oversized (24px x 24px) to accommodate gym-ready interactions.

### Performance Tracker (Specialty Component)
A large-format data display component using Display-LG typography for numbers, specifically designed for high-visibility during active sets.