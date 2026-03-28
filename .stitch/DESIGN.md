# UMLAB Procurement — Source of Truth Design System
> **Auto-generated from Stitch MCP** | Project: `15003387309710635251` | Design System: `Structural Blue` (`assets/57a001efbda949d99f9206e8d3265ce3`)
> 
> **Last synced:** 2026-03-29T02:30 UTC+8
> 
> ⚠️ This file is the **single source of truth** for all frontend work. All hex codes, font families, border radii, and spacing values must be referenced from here.

---

## 1. Creative North Star: "The Tectonic Ledger"

> The design system rejects the "template" look of standard SaaS by utilizing **intentional asymmetry, tonal depth, and editorial spacing.** By leveraging the contrast between the deep `primary` (#00346f) and the airy `surface` (#f8f9fb), we create an environment that feels authoritative yet breathable.

---

## 2. Color Palette (Complete Token Map)

### 2.1 Primary

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `primary` | `#00346f` | `--primary` | CTAs, active nav, links, key text |
| `primary_container` | `#004a99` | `--primary-container` | Gradient endpoint, hover states |
| `primary_fixed` | `#d7e2ff` | `--primary-fixed` | Active nav bg, table highlights |
| `primary_fixed_dim` | `#abc7ff` | `--primary-fixed-dim` | Inverse primary, secondary highlight |
| `on_primary` | `#ffffff` | `--on-primary` | Text on primary fill |
| `on_primary_container` | `#9bbdff` | `--on-primary-container` | Text on primary container |
| `on_primary_fixed` | `#001b3f` | `--on-primary-fixed` | Deep primary text |
| `on_primary_fixed_variant` | `#00458f` | `--on-primary-fixed-variant` | Alt primary text |

### 2.2 Secondary (Pending / Info)

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `secondary` | `#48626e` | `--secondary` | Secondary text, labels |
| `secondary_container` | `#cbe7f5` | `--secondary-container` | **PENDING** chip bg |
| `secondary_fixed` | `#cbe7f5` | `--secondary-fixed` | Fixed secondary fill |
| `secondary_fixed_dim` | `#afcbd8` | `--secondary-fixed-dim` | Dimmed secondary |
| `on_secondary` | `#ffffff` | `--on-secondary` | Text on secondary |
| `on_secondary_container` | `#4e6874` | `--on-secondary-container` | **PENDING** chip text |
| `on_secondary_fixed` | `#021f29` | `--on-secondary-fixed` | Deep secondary text |
| `on_secondary_fixed_variant` | `#304a55` | `--on-secondary-fixed-variant` | Alt secondary text |

### 2.3 Tertiary (Approved / Success)

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `tertiary` | `#003d35` | `--tertiary` | **Audit timestamps**, success deep |
| `tertiary_container` | `#00564c` | `--tertiary-container` | Tertiary container |
| `tertiary_fixed` | `#97f3e2` | `--tertiary-fixed` | **APPROVED** chip bg |
| `tertiary_fixed_dim` | `#7ad7c6` | `--tertiary-fixed-dim` | Dimmed tertiary |
| `on_tertiary` | `#ffffff` | `--on-tertiary` | Text on tertiary |
| `on_tertiary_container` | `#70ccbc` | `--on-tertiary-container` | Text on tertiary container |
| `on_tertiary_fixed` | `#00201b` | `--on-tertiary-fixed` | Deep tertiary text |
| `on_tertiary_fixed_variant` | `#005047` | `--on-tertiary-fixed-variant` | **APPROVED** chip text |

### 2.4 Error (Rejected)

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `error` | `#ba1a1a` | `--error` | Error stroke, destructive CTAs |
| `error_container` | `#ffdad6` | `--error-container` | **REJECTED** chip bg |
| `on_error` | `#ffffff` | `--on-error` | Text on error |
| `on_error_container` | `#93000a` | `--on-error-container` | **REJECTED** chip text |

### 2.5 Surface Hierarchy

| Token | Hex | CSS Variable | Layer | Usage |
|---|---|---|---|---|
| `surface` | `#f8f9fb` | `--surface` | Level 0 | Foundation / page bg |
| `surface_container_low` | `#f2f4f6` | `--surface-container-low` | Level 1 | Sectioning |
| `surface_container` | `#eceef0` | `--surface-container` | — | Container mid |
| `surface_container_lowest` | `#ffffff` | `--surface-container-lowest` | Level 2 | Active Cards |
| `surface_container_high` | `#e6e8ea` | `--surface-container-high` | — | **Hover state** |
| `surface_container_highest` | `#e0e3e5` | `--surface-container-highest` | Level 3 | **Dialogs, Audit Trail bg** |
| `surface_dim` | `#d8dadc` | `--surface-dim` | — | Dimmed surface |
| `surface_bright` | `#f8f9fb` | `--surface-bright` | — | Bright surface |
| `surface_variant` | `#e0e3e5` | `--surface-variant` | — | Variant surface |
| `surface_tint` | `#255dad` | `--surface-tint` | — | Surface tint overlay |

### 2.6 Text & Outline

| Token | Hex | CSS Variable | Usage |
|---|---|---|---|
| `on_surface` | `#191c1e` | `--on-surface` | **Primary text** (never use pure black) |
| `on_surface_variant` | `#424751` | `--on-surface-variant` | Secondary text, descriptions |
| `on_background` | `#191c1e` | `--on-background` | Background text |
| `outline` | `#737783` | `--outline` | Labels, metadata, placeholder |
| `outline_variant` | `#c2c6d3` | `--outline-variant` | Ghost borders (use at 15% opacity) |

### 2.7 Inverse (Dark Mode Prep)

| Token | Hex | CSS Variable |
|---|---|---|
| `inverse_surface` | `#2d3133` | `--inverse-surface` |
| `inverse_on_surface` | `#eff1f3` | `--inverse-on-surface` |
| `inverse_primary` | `#abc7ff` | `--inverse-primary` |

### 2.8 Override Colors (Design System Config)

| Token | Hex | Usage |
|---|---|---|
| `overridePrimaryColor` | `#004A99` | CTA gradient endpoint |
| `overrideSecondaryColor` | `#546E7A` | Secondary accent |
| `overrideTertiaryColor` | `#00796B` | Tertiary accent |
| `overrideNeutralColor` | `#F5F7F9` | Neutral base |

---

## 3. Typography

| Role | Font Family | Stitch Config |
|---|---|---|
| **Headline** | `Public Sans` | `headlineFont: PUBLIC_SANS` |
| **Body** | `Public Sans` | `bodyFont: PUBLIC_SANS` |
| **Label** | `Inter` | `labelFont: INTER` |

### Type Scale

| Class | Size | Weight | Font | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-md` | 2.75rem | 900 | Public Sans | -0.02em | Procurement totals |
| `title-lg` | 1.375rem | 600 | Public Sans | -0.015em | Section anchors |
| `title-md` | 1.125rem | 600 | Public Sans | — | Card titles |
| `body-md` | 0.875rem | 400 | Public Sans | — | Workhorse body (line-height: 1.5) |
| `body-sm` | 0.8125rem | 400 | Public Sans | — | Secondary body |
| `label-md` | 0.75rem | 500 | Inter | 0.02em | Status trackers, metadata |
| `label-sm` | 0.625rem | 500 | Inter | 0.04em | Timestamps, fine detail |

---

## 4. Border Radius

| Token | Value | Stitch Config | Usage |
|---|---|---|---|
| `DEFAULT` | `0.125rem` (2px) | `borderRadius.DEFAULT` | Structural containers, cards, navs |
| `lg` | `0.25rem` (4px) | `borderRadius.lg` | Slightly rounded elements |
| `xl` | `0.5rem` (8px) | `borderRadius.xl` | Buttons, inputs |
| `full` | `0.75rem` (12px) | `borderRadius.full` | Progress bars, badges' container |
| `pill` | `9999px` | DESIGN.md rule | **Chips** (approval badges) |

> **Rule:** Use `rounded-sm` (0.125rem) for structural and `pill` (9999px) for interactive chips. Never use `rounded-md` universally.

---

## 5. Spacing Scale

| Config | Value |
|---|---|
| `spacingScale` | `1` (default) |

### Vertical White Space (List Separation)
- Use `0.9rem` vertical spacing between list items (no dividers)
- Alternating backgrounds: `surface` (#f8f9fb) / `surface-container-low` (#f2f4f6)

---

## 6. Elevation & Shadows

| Type | Value | Usage |
|---|---|---|
| **Ambient Shadow** | `0 20px 40px rgba(25, 28, 30, 0.06)` | Floating elements, modals, sidebar |
| **Ghost Border** | `outline_variant` at `15%` opacity | Card outlines when accessibility requires |
| **No Border Rule** | N/A | Sections separated by surface color shifts only |

> **Rule:** Traditional drop shadows are replaced by Ambient Tonal Shifts. Depth = surface-container-lowest on surface-container-low.

---

## 7. Gradient

| Type | Value | Usage |
|---|---|---|
| **Signature Gradient** | `linear-gradient(135deg, #00346f, #004a99)` | Primary CTAs, progress bar fill |

---

## 8. Component Tokens

### 8.1 Approval Chips

| Status | Background | Text Color | Radius |
|---|---|---|---|
| **PENDING** | `#cbe7f5` (secondary_container) | `#4e6874` (on_secondary_container) | 9999px |
| **APPROVED** | `#97f3e2` (tertiary_fixed) | `#005047` (on_tertiary_fixed_variant) | 9999px |
| **REJECTED** | `#ffdad6` (error_container) | `#93000a` (on_error_container) | 9999px |
| **COMMITTED** | `#97f3e2` (tertiary_fixed) | `#005047` (on_tertiary_fixed_variant) | 9999px |
| **QUEUED** | `#cbe7f5` (secondary_container) | `#4e6874` (on_secondary_container) | 9999px |

### 8.2 Form Fields

| State | Stroke Color | Weight | Background |
|---|---|---|---|
| Default | `#c2c6d3` (outline_variant) | 1px bottom | Transparent |
| Focus | `#00346f` (primary) | 2px bottom | Transparent |
| Error | `#ba1a1a` (error) | 2px bottom | `#ffdad6` (error_container) tint |

### 8.3 Navigation (Sidebar)

| State | Background | Text Color | Transform |
|---|---|---|---|
| Default | Transparent | `#191c1e` (on_surface) | none |
| Hover | `#f2f4f6` (surface_container_low) | `#191c1e` | none |
| Active | `#d7e2ff` (primary_fixed) | `#00346f` (primary) | `translateX(4px)` |

### 8.4 Progress Bar

| Part | Color |
|---|---|
| Track | `#cbe7f5` (secondary_container) |
| Fill | `linear-gradient(135deg, #00346f, #004a99)` |

### 8.5 Status Trackers

| Element | Color |
|---|---|
| Connector | Dashed `#c2c6d3` (outline_variant), 4px gap |
| Completed Step | `#00346f` (primary) + checkmark |
| Active Step | White circle + `#00346f` ring |

### 8.6 Glass Panel

```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
```

---

## 9. Stitch Screen Inventory

| Screen | ID | Dimensions |
|---|---|---|
| Procurement Request Form | `14fc3f3a2c784de984c954b18ae4e117` | 780×4620 |
| Dashboard (with Company Switcher) | `b71df51341654eecb3b5d9e5627d2e63` | 780×4966 |
| UMLAB Procurement Dashboard | `d1f5d9a0798549bea7dbd20d81ed7fda` | 390×884 |
| Dashboard | `bd4a369b34f74ad8866080d0ce5d1587` | 780×4856 |
| Vendor Directory | `d7179b77afd64736a6ec5df1c0b3d12a` | 780×5922 |
| Petty Cash Dashboard | `6d61ccda64af4259a4fc13ba155b3e4e` | 780×4796 |
| Dashboard (Updated) | `1a38df07855b460db4bfeb3e92b35299` | 780×4964 |
| Payment Approval View | `956dcaf73a7f4e34a6a58541c0f1467b` | 780×3896 |
| Approval View | `8c89f9caf3734572ba441cf3f877ba4d` | 780×3882 |
| Payment Request Form | `0a90d907ec0c4a8f810cc099471c1751` | 780×3896 |
| Admin Settings | `6252b63b8aa54690a321409ee60d0c58` | 780×5166 |

---

## 10. Do's and Don'ts

### ✅ Do:
- Use asymmetrical margins for editorial feel
- Use `primary_fixed` (#d7e2ff) for data table highlights
- Let typography scale do the heavy lifting (size + weight > boxes)
- Use `on-surface` (#191c1e) for all text — **never pure black**

### ❌ Don't:
- Use 1px solid borders for sectioning — **use surface color shifts**
- Use `rounded-md` for everything — mix `0.125rem` + `9999px`
- Use shadows to define cards — use background color "cut-outs"
- Use solid lines in status trackers — **use dashed lines**
- Use dividers in lists — **use vertical white space (0.9rem) + alternating bg**

---

## 11. Design System Metadata

```json
{
  "stitch_project_id": "15003387309710635251",
  "design_system_asset_id": "57a001efbda949d99f9206e8d3265ce3",
  "design_system_name": "Structural Blue",
  "color_mode": "LIGHT",
  "color_variant": "FIDELITY",
  "roundness": "ROUND_FOUR",
  "spacing_scale": 1,
  "device_type": "MOBILE"
}
```
