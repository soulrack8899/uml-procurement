```markdown
# Design System Specification: Architectural Precision

## 1. Overview & Creative North Star
**Creative North Star: "The Tectonic Ledger"**

For UMLAB Sarawak, we are moving beyond the "blue-box enterprise" cliché. "The Tectonic Ledger" treats digital procurement not as a series of forms, but as a high-precision architectural blueprint. The design system rejects the "template" look of standard SaaS by utilizing **intentional asymmetry, tonal depth, and editorial spacing.** 

By leveraging the contrast between the deep `primary` (#00346f) and the airy `surface` (#f8f9fb), we create an environment that feels authoritative yet breathable. We break the rigid grid with overlapping document viewers and status trackers that feel like physical sheets of vellum layered over a drafting table.

---

## 2. Colors & Surface Philosophy
Color is not just decoration; it is the structural integrity of the interface.

*   **The "No-Line" Rule:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts. Use `surface-container-low` (#f2f4f6) sections sitting on a `surface` (#f8f9fb) background to define zones.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers. 
    *   **Level 0 (Foundation):** `surface` (#f8f9fb)
    *   **Level 1 (Sectioning):** `surface-container-low` (#f2f4f6)
    *   **Level 2 (Active Cards):** `surface-container-lowest` (#ffffff)
    *   **Level 3 (High Focus/Dialogs):** `surface-container-highest` (#e0e3e5)
*   **The "Glass & Gradient" Rule:** To achieve a premium "Sarawak Enterprise" feel, floating document viewers should use Glassmorphism: `surface-container-lowest` at 80% opacity with a `backdrop-filter: blur(12px)`.
*   **Signature Textures:** For primary CTAs or Progress Bar fills, use a subtle linear gradient transitioning from `primary` (#00346f) to `primary_container` (#004a99) at a 135-degree angle. This adds "soul" and dimension to an otherwise flat enterprise environment.

---

## 3. Typography: Editorial Authority
We utilize **Public Sans** for its industrial clarity and **Inter** for functional data density.

*   **Display & Headline (Public Sans):** Use `display-md` (2.75rem) for high-level procurement totals. Headlines should be set with tight letter-spacing (-0.02em) to evoke a sense of "The Printed Record."
*   **Title (Public Sans):** `title-lg` (1.375rem) serves as the primary anchor for form sections. It provides a clear, bold entry point for the eye.
*   **Body (Public Sans):** `body-md` (0.875rem) is the workhorse. Ensure a line-height of 1.5 to maintain legibility in long procurement descriptions.
*   **Labels (Inter):** For status trackers and metadata, use `label-md` (0.75rem). The switch to Inter provides a technical, "data-stamped" aesthetic that distinguishes functional meta-info from narrative content.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are replaced by **Ambient Tonal Shifts.**

*   **The Layering Principle:** Depth is achieved by "stacking" tiers. Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle contrast creates a soft, natural lift that communicates hierarchy without visual noise.
*   **Ambient Shadows:** If a floating element (like a payment approval modal) requires a shadow, it must be ultra-diffused: `box-shadow: 0 20px 40px rgba(25, 28, 30, 0.06)`. The shadow color is a 6% opacity version of `on-surface` (#191c1e).
*   **The Ghost Border:** If accessibility requires a stroke, use `outline-variant` (#c2c6d3) at 15% opacity. Never use 100% opaque borders.
*   **Indeterminate Progress:** Progress bars should use the `secondary_container` (#cbe7f5) as the track and the signature `primary` gradient as the fill, creating a high-contrast, "moving liquid" effect.

---

## 5. Components & Interaction Patterns

### Procurement Form Fields
*   **Style:** Minimalist. No containers. Use a bottom-only stroke of `outline-variant` (#c2c6d3). 
*   **Focus State:** The stroke transitions to `primary` (#00346f) with a weight of 2px. The label shifts to `primary` color.
*   **Error State:** Use `error` (#ba1a1a) for the stroke and `error_container` (#ffdad6) for a soft background tint behind the text.

### Approval Chips
*   **Pending:** `secondary_container` (#cbe7f5) with `on_secondary_container` (#4e6874) text.
*   **Approved:** `tertiary_fixed` (#97f3e2) with `on_tertiary_fixed_variant` (#005047) text.
*   **Rejected:** `error_container` (#ffdad6) with `on_error_container` (#93000a) text.
*   **Radius:** Always use `rounded-full` (9999px) for chips to contrast against the architectural `rounded-sm` (0.125rem) used for document viewers.

### Status Trackers (Vertical & Horizontal)
*   **The Connector:** Never use a solid line. Use a dashed line with `outline-variant` (#c2c6d3) and a 4px gap.
*   **Completed Steps:** Use `primary` (#00346f) with a checkmark icon.
*   **Active Step:** A `surface-container-lowest` circle with a `primary` ring.

### Document Viewers & Lists
*   **Forbid Dividers:** Do not use lines to separate list items. Use **Vertical White Space** (Spacing Scale `4`: 0.9rem) and alternating background shifts between `surface` and `surface-container-low`.
*   **Interaction:** On hover, a list item should shift to `surface-container-high` (#e6e8ea) to indicate interactivity.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins. If a document viewer is on the right, leave a wider "gutter" on the left to create an editorial feel.
*   **Do** use `primary_fixed` (#d7e2ff) for subtle highlights in complex data tables.
*   **Do** lean on the Typography Scale. Let the size and weight of the text do the work that buttons and boxes usually do.

### Don’t:
*   **Don’t** use "pure black" for text. Always use `on-surface` (#191c1e).
*   **Don’t** use standard `rounded-md` for everything. Mix `none` for heavy structural containers and `full` for interactive chips to create visual rhythm.
*   **Don’t** use shadows to define cards. Use background color shifts. A card should be a "cut-out" or an "overlay" of tone.

---

## 7. Signature Procurement Components

### The "Approval Drawer"
A right-aligned slide-out panel utilizing `surface-container-lowest` with a `backdrop-filter: blur(20px)`. It overlays the document viewer, allowing the lab manager to see the lab results while signing the payment approval. 

### The "Audit Trail" Log
A high-density list using `label-sm` (Inter font). It should be nested inside a `surface-container-highest` container to signify that it is a "read-only" historical archive. Use the `tertiary` (#003d35) color for timestamps to provide a professional, technical accent.```