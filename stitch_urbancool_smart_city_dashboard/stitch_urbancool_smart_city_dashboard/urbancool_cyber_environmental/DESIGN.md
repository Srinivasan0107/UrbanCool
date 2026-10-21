---
name: UrbanCool Cyber-Environmental
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#4fdbc8'
  on-tertiary: '#003731'
  tertiary-container: '#0db6a4'
  on-tertiary-container: '#004139'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: 4rem
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  metric-display:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.08em
  label-mono-stat:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system targets urban planners, municipal resilience officers, environmental researchers, and city emergency operators managing critical urban heat dynamics. The emotional resonance blends the urgency of telemetry command centers with high-clarity environmental stewardship. The interface should feel authoritative, atmospheric, and mission-critical—reminiscent of aerospace control consoles overlaid with ecological telemetry.

The visual direction combines **Deep Cyber-Minimalism** with targeted **Glassmorphism**. High-contrast data visualization glows against obsidian and slate substrates, while translucent panels prevent visual congestion across density-heavy heat maps and real-time sensor streams. Structural lines remain precise and hairline-thin to anchor high-frequency streaming information with zero visual bloat.

## Colors

The palette establishes an immediate thermal narrative: obsidian foundations provide non-distracting depth, thermal gradients signal ambient danger, and electric cool tones represent relief zones and active mitigation systems.

### Core Canvas & Surfaces
- **Obsidian Core (Canvas)**: `#0B0F17`
- **Slate Matrix (Panels & Elevated Surfaces)**: `#111827`
- **Sub-surface Elevation (Glass base)**: `rgba(17, 24, 39, 0.72)`

### Thermal Heat Index (Risk Spectrum)
- **Caution / Ambient Warmth**: `#F59E0B` (Neon Amber)
- **High Advisory / Thermal Stress**: `#EA580C` (Thermal Orange)
- **Severe Hazard / Infrared Crimson**: `#EF4444` (Infrared Crimson)
- **Critical Failure / Core Red**: `#991B1B` (Core Red)

### Cooling Interventions & Safe Corridors
- **Primary Action & Safe Status (Cooling Active)**: `#10B981` (Vibrant Emerald)
- **Secondary Telemetry & Sensor Flow**: `#14B8A6` (Cyber Teal)

### Structural & Atmospheric Borders
- **Hairline Boundary**: `rgba(255, 255, 255, 0.08)`
- **Interactive Border**: `rgba(255, 255, 255, 0.18)`
- **Thermal Border Focus**: `rgba(245, 158, 11, 0.4)`
- **Cooling Border Focus**: `rgba(16, 185, 129, 0.4)`

## Typography

The typographic hierarchy pairs **Plus Jakarta Sans** for structural headers with **Inter** for dense UI, body text, and live metrics.

- **Tabular Figures & Metrics**: Inter must always render using `font-variant-numeric: tabular-nums lining-nums` for all telemetry readouts, degrees Celsius / Fahrenheit displays, wet-bulb measurements, and microclimate timestamps. This eliminates digit jitter during live WebSocket updates.
- **Labels & Overline Headers**: Sensor tags, district codes, and threshold alerts use `label-caps` styled with uppercase transformation to produce a clean military-grade dashboard structure without increasing visual weight.

## Layout & Spacing

The platform operates on a responsive 12-column fluid grid system pinned to a base 4px/8px modular rhythm:

- **Desktop (1280px+)**: 12-column layout with 24px (`gutter-desktop`) columns and 40px outer canvas margins. GIS spatial views can break grid constraints into a full-bleed viewport flanked by persistent 380px telemetry rails.
- **Tablet (768px - 1279px)**: 8-column layout with 16px gutters and 24px margins. Docked auxiliary sidebars collapse into overlay slide-overs or tabbed dock bars.
- **Mobile (Below 768px)**: 4-column layout with 16px margins and gutters. Sensor arrays switch from horizontal grids to vertical stacked cards with touch-friendly scrubbing.

Padding within analytical cards follows tight containment (`space-md` internally, `space-sm` between nested metric chips) to retain rapid scanability during emergency advisory scenarios.

## Elevation & Depth

Spatial separation is conveyed using **Backdrop Blur Glassmorphism** layered directly over the dark spatial canvas:

1. **Substrate (Z-0)**: Pure `#0B0F17` base carrying vector GIS mapping tiles, satellite contours, or heat index isobars.
2. **Surface Layer (Z-10)**: Ambient cards and standard widgets with `background: rgba(17, 24, 39, 0.75)`, `backdrop-filter: blur(24px)`, and a structural perimeter of `border: 1px solid rgba(255, 255, 255, 0.08)`.
3. **Elevated Advisory / Flyout (Z-20)**: Floating control panels, tooltips, and flyovers use `background: rgba(17, 24, 39, 0.92)`, `backdrop-filter: blur(32px)`, `border: 1px solid rgba(255, 255, 255, 0.16)`, and a diffuse drop shadow: `box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.6)`.
4. **Thermal Warning Elevation**: Triggered warnings project an inner and outer subtle luminescence rather than heavy black shadows (e.g., `box-shadow: 0 0 24px rgba(239, 68, 68, 0.25)`).

## Shapes

The platform adopts a **Soft (Level 1)** geometric standard. Precision data instruments require compact, low-radius curvature to project rigor and technical efficiency:

- Standard controls, inputs, and chips: `rounded` (`0.25rem` / `4px`).
- Analytics cards, map panels, and flyouts: `rounded-lg` (`0.5rem` / `8px`).
- Floating utility controls and modals: `rounded-xl` (`0.75rem` / `12px`).
- Strictly reserved for state pill indicators and micro status lights: full circular borders (`rounded-full`).

## Components

### Buttons
- **Primary Mitigation Action**: Background `bg-emerald-500` (#10B981) text obsidian `#0B0F17`, font-weight 600, with a glowing hover state `hover:bg-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.4)]`.
- **Secondary Ghost Controls**: Background `bg-white/[0.04]`, `border border-white/10`, `text-slate-200`, with `hover:bg-white/[0.08] hover:border-white/20`.
- **Alert / Directive Buttons**: Background `bg-red-500/10`, `border border-red-500/40`, `text-red-400`, transitioning to solid `bg-red-600` on active intervention modes.

### Chips & Sensor Badges
- Built with `rounded` corners, uppercase `label-caps` typography, and tabular metric numerals.
- **Cooling Zone**: `bg-teal-500/10 text-teal-300 border border-teal-500/20` with a 6px pulsing dot indicator.
- **Heat Anomaly**: `bg-amber-500/10 text-amber-300 border border-amber-500/20` transitioning to `bg-red-500/10 text-red-300 border border-red-500/30` at critical thresholds.

### Cards & Spatial Overlays
- Cards feature `backdrop-blur-xl`, `bg-slate-900/70`, and hairline borders `border-white/10`.
- Headers integrate tabular micro-status badges aligned right, separated from content by a 1px divider `border-white/[0.06]`.

### Data Inputs & Filter Bars
- Inputs use recessed fields: `bg-black/40 border border-white/10 text-slate-100 placeholder:text-slate-500`.
- Focus states invoke an electric teal glow: `border-teal-400 shadow-[0_0_0_1px_rgba(20,184,166,0.6)]`.

### Selection Controls (Checkboxes & Radios)
- Checkboxes: 16x16px boxes with `rounded-[2px]`, `border-white/20`, filling with `bg-teal-500` and an obsidian checkmark when selected.
- Radios: Circular concentric rings utilizing `#10B981` indicators when targeting active urban thermal layers.

### Domain-Specific Components
- **Microclimate Sparkline Rail**: Embedded miniature graphs inside list items tracking surface vs. canopy temperatures over rolling 24-hour cycles.
- **Cooling Corridor Vector Dial**: Directional compass indicating breeze velocity, canopy shade index, and misting station proximities with tabular distance labels.