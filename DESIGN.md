---
name: HackScout
description: Pakistan's unified developer and tech event discovery radar
colors:
  primary: "#10b981"
  primary-hover: "#34d399"
  primary-muted: "#064e3b"
  secondary: "#38bdf8"
  amber-alert: "#f59e0b"
  neutral-bg: "#09090b"
  neutral-card: "#12141c"
  neutral-border: "rgba(255, 255, 255, 0.08)"
  neutral-fg: "#f4f4f5"
  neutral-muted: "#a1a1aa"
typography:
  display:
    fontFamily: "var(--font-outfit), Outfit, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 5.25rem)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "var(--font-outfit), Outfit, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "var(--font-outfit), Outfit, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-geist-sans), Geist, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-geist-mono), Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#022c22"
    rounded: "{rounded.lg}"
    padding: "8px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.lg}"
    padding: "8px 20px"
  card-glass:
    backgroundColor: "{colors.neutral-card}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: HackScout

## Overview

**Creative North Star: "The Obsidian Radar"**

HackScout's design system treats Pakistan's fragmented tech ecosystem as an active radar grid: dense, tactical, and uncompromisingly deadline-oriented. The interface operates within a rich Obsidian dark mode with subtle slate undertones, illuminated by luminous emerald beacons, celestial cyan telemetry tags, and urgent amber countdown warnings.

Every element is tuned for rapid triage. Builders, students, and founders can scan dozens of upcoming hackathons, campus meetups, and grant deadlines across cities like Lahore, Karachi, and Islamabad in seconds without navigating decorative fluff.

**Key Characteristics:**
- **Tactical Luminous Dark Mode:** Grounded in `#09090b` / deep obsidian canvas with luminous emerald (`#10b981`) telemetry accents.
- **Micro-Matrix Geometry:** Delicate 32px background dot grids and 1px translucent borders (`rgba(255,255,255,0.08)`) that evoke high-precision instruments.
- **Deadline-First Hierarchy:** Time-sensitive badges and countdown tickers always command immediate visual priority.
- **Monospace Data Telemetry:** Monospace typography used selectively for cities, sources, dates, counts, and status indicators.

## Colors

A high-contrast dark palette anchored by deep obsidian neutral tones with sharp chromatic accents for data statuses.

### Primary
- **Emerald Pulse** (`#10b981` / `oklch(0.74 0.20 155)`): Used for primary action buttons, live radar badges, active registration indicators, and primary visual anchors.
- **Emerald Pulse Hover** (`#34d399` / `oklch(0.80 0.20 155)`): Interactive hover state for primary triggers.
- **Emerald Deep Muted** (`#064e3b` / `oklch(0.86 0.10 155)`): Subtle translucent pill backgrounds and ambient glow cones.

### Secondary
- **Celestial Cyan** (`#38bdf8` / `oklch(0.78 0.14 210)`): Used for live data pipelines, secondary tags, verified sources, and gradient transitions.

### Tertiary
- **Amber Alert** (`#f59e0b` / `oklch(0.78 0.16 70)`): Strictly reserved for deadline urgency (<48 hours left, closing registrations, and critical alerts).

### Neutral
- **Obsidian Canvas** (`#09090b` / `oklch(0.13 0.015 250)`): Global background canvas.
- **Glass Panel Surface** (`#12141c` / `rgba(14, 18, 27, 0.65)`): Container and card backgrounds with backdrop blur.
- **Hairline Border** (`rgba(255, 255, 255, 0.08)`): Grid divider and card border line.
- **Primary Text** (`#f4f4f5` / `oklch(0.985 0 0)`): High-legibility foreground.
- **Muted Text** (`#a1a1aa` / `oklch(0.70 0.01 250)`): Secondary descriptions, metadata, and labels.

### Named Rules
**The Telemetry Rarity Rule.** Neon emerald and amber accents are never used for generic decoration; their presence strictly signifies active state, verified status, or urgent time-decay.

## Typography

**Display Font:** Outfit (`var(--font-outfit)`, sans-serif)
**Body Font:** Geist Sans (`var(--font-geist-sans)`, sans-serif)
**Label/Mono Font:** Geist Mono (`var(--font-geist-mono)`, monospace)

**Character:** Modern geometric headlines with rhythmic tracking paired with clean, ultra-legible body text and technical monospace telemetry labels.

### Hierarchy
- **Display** (Outfit, Medium 500, `clamp(2.5rem, 6vw, 5.25rem)`, `1.08` line-height, `-0.03em` tracking): Hero titles and landmark city headings.
- **Headline** (Outfit, Medium 500, `clamp(1.75rem, 3.5vw, 2.75rem)`, `1.15` line-height, `-0.02em` tracking): Section headers and major category groupings.
- **Title** (Outfit, Medium 500, `1.25rem`, `1.3` line-height, `-0.01em` tracking): Event card titles and modular container headers.
- **Body** (Geist Sans, Regular 400, `0.9375rem`, `1.6` line-height): Descriptions, summaries, and long-form copy (optimal reading width 60–70ch).
- **Label** (Geist Mono, Medium 500, `0.75rem`, `1.2` line-height, `0.05em` letter-spacing, Uppercase): City tags, countdown tickers, sources, and metadata badges.

### Named Rules
**The Monospace Attribution Rule.** Every non-prose metadata attribute (timestamp, city code, prize purse, countdown, ticket status) is formatted in Geist Mono with uppercase tracking.

## Layout

- **Container Bounds:** Standard content maximum width is `1400px` with `px-5 sm:px-8 lg:px-10` responsive guttering.
- **Spatial Grid:** 8px base rhythm (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Dense Grid Architecture:** High-density responsive grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) for event card listings to maximize scan rate.
- **Floating Header:** Sticky top navigation bar at `h-16` with frosted glass backdrop filter (`backdrop-blur-md`).

## Elevation & Depth

HackScout rejects heavy drop shadows in favor of **translucent glass layering, micro-borders, and radial ambient glow**.

### Shadow Vocabulary
- **Ambient Emerald Glow** (`0 0 45px -12px rgba(16, 185, 129, 0.35)`): Used on primary hover triggers, active radar badges, and featured hero CTAs.
- **Ambient Cyan Glow** (`0 0 40px -12px rgba(56, 189, 248, 0.30)`): Used under verified platform badges and secondary telemetry panels.
- **Card Subtle Lift** (`0 10px 30px -10px rgba(0, 0, 0, 0.5)`): Rendered on event card hover states.

### Named Rules
**The Glass-Over-Shadow Rule.** Depth is created through surface contrast (`rgba(14, 18, 27, 0.65)`) and 1px translucent borders (`rgba(255, 255, 255, 0.08)`) over an ambient background, never opaque drop shadows.

## Shapes

- **Form Language:** Crisp rounded rectangles with subtle softened corners.
- **Radius Scale:**
  - `sm` (`6px`): Micro-badges, inline code chips, and tag pills.
  - `md` (`8px`): Standard inputs, compact buttons, dropdown items.
  - `lg` (`10px`): Event cards, interactive tiles, dialog modals.
  - `full` (`9999px`): Status radar indicators, pill badges, and filter chips.

## Components

### Buttons
- **Shape:** Rounded-lg (`10px` radius)
- **Primary:** Background `#10b981`, text `#022c22` (deep dark green), font-medium, padding `8px 20px`. Subtle scale and brightness shift on hover (`#34d399`), with soft emerald glow.
- **Outline / Secondary:** Background `rgba(255, 255, 255, 0.03)`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#f4f4f5`. Hover transitions to `rgba(255, 255, 255, 0.08)`.

### Cards & Event Containers
- **Corner Style:** `10px` radius (`rounded-lg` / `rounded-xl`).
- **Background:** Frosted glass `#12141c` (`rgba(14, 18, 27, 0.65)` with `backdrop-filter: blur(12px)`).
- **Border:** `1px solid rgba(255, 255, 255, 0.08)`, transitioning to `rgba(16, 185, 129, 0.3)` on hover.
- **Internal Padding:** `20px` to `24px`.

### Badges & Status Chips
- **Style:** Monospace font, `rounded-full` or `rounded-md`, `px-2.5 py-1 text-xs`.
- **Urgent Badge (<48h):** Border `rgba(245, 158, 11, 0.3)`, text `#fbbf24`, background `rgba(245, 158, 11, 0.1)`.
- **Live / Upcoming Badge:** Border `rgba(16, 185, 129, 0.3)`, text `#34d399`, background `rgba(16, 185, 129, 0.1)`.
- **City Tag:** Border `rgba(255, 255, 255, 0.08)`, text `#a1a1aa`, background `rgba(255, 255, 255, 0.04)`.

### Inputs & Filters
- **Style:** Height `40px`, radius `8px`, background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.1)`.
- **Focus:** Border `#10b981`, ring `3px rgba(16, 185, 129, 0.25)`.

## Do's and Don'ts

### Do:
- **Do** emphasize registration deadline dates and countdown timers on every card and detail view.
- **Do** format city names, platform sources, dates, and counts in uppercase Geist Mono.
- **Do** maintain deep obsidian dark backgrounds with subtle 1px frosted translucent borders.
- **Do** provide instant 1-click external registration links without intermediate capture friction.

### Don't:
- **Don't** use solid opaque high-contrast white card backgrounds or garish drop shadows.
- **Don't** hide registration deadlines behind nested accordions or secondary tabs.
- **Don't** mix more than three accent colors on a single viewport.
- **Don't** use decorative generic stock illustration; ground imagery in real Pakistani campuses, auditoriums, and technical artifacts.
