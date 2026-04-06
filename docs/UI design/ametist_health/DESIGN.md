# Design System Specification: The Empathetic Anchor

## 1. Overview & Creative North Star
This design system is built upon the North Star of **"The Empathetic Anchor."** In the context of Ethiopian healthcare, digital interfaces must bridge the gap between traditional respect and modern efficiency. This is not a "utility app"; it is a digital companion that feels as stable as a stone-hewn church and as light as a breeze.

To break the "template" look common in medical portals, we move away from rigid grids and 1px borders. Instead, we use **Intentional Asymmetry** and **Tonal Depth**. By overlapping elements and using oversized typography scales, we create an editorial experience that prioritizes the patient’s peace of mind over a crowded dashboard. The layout feels "curated" for the individual, using progressive disclosure to ensure that only the most vital information is present at any given moment.

---

## 2. Colors: Tonal Architecture
The palette is rooted in deep, trustworthy blues and restorative greens, avoiding the clinical sterility of pure white or harsh grays.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section content. 
Boundaries must be defined through:
1.  **Background Color Shifts:** Use `surface-container-low` for the base and `surface-container-lowest` for interactive cards.
2.  **Tonal Transitions:** Defining an area by a subtle shift from `surface` to `surface-variant`.

### Surface Hierarchy & Nesting
Treat the mobile screen as a series of physical layers. Use the surface tiers to create "nested" depth:
- **Level 0 (Base):** `surface` (#f7faf9) - The primary canvas.
- **Level 1 (Sections):** `surface-container-low` (#f1f4f3) - For grouped information like a medical history block.
- **Level 2 (Cards):** `surface-container-lowest` (#ffffff) - For the most interactive "tappable" elements to make them pop against the background.

### The "Glass & Gradient" Rule
To elevate the experience, floating elements (like bottom navigation bars or emergency FABs) should utilize **Glassmorphism**. Apply `surface` with 80% opacity and a `backdrop-filter: blur(20px)`. 
**Signature Texture:** Use a subtle linear gradient for primary CTAs (from `primary` to `primary_container`) to give buttons a gentle "hearth-like" glow rather than a flat, plastic appearance.

---

## 3. Typography: Editorial Clarity
The typography system uses **Manrope** for high-impact headlines to provide a modern, friendly character, and **Public Sans** for body text to ensure maximum legibility for both English and Amharic scripts.

- **Display & Headlines (Manrope):** These are the "Wayfinders." Use `display-md` for welcome screens and `headline-sm` for section headers. The goal is an authoritative yet warm editorial feel.
- **Body & Titles (Public Sans):** Chosen for its neutral, open counters which translate well to Amharic characters. `body-lg` (1rem) is the minimum for patient data to accommodate older users.
- **Action-First Language:** Every title should begin with a verb or a clear state (e.g., "View Lab Results" instead of "Reports").

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "tech-heavy" for a calm portal. We use light to create hierarchy.

- **The Layering Principle:** Depth is achieved by "stacking" surface tokens. A `surface-container-highest` element should only ever sit on a `surface-container` or lower. This creates a soft, natural lift.
- **Ambient Shadows:** If a floating card is required, use a shadow color tinted with the `primary` hue (e.g., `rgba(0, 66, 119, 0.06)`) with a blur of 24px and a Y-offset of 8px. This mimics soft, natural daylight.
- **The "Ghost Border":** For accessibility in input fields, use `outline-variant` at 20% opacity. This provides a "suggestion" of a boundary without cluttering the visual field.

---

## 5. Components

### Buttons & Tap Targets
- **Primary Button:** Uses the `primary` fill with `on_primary` text. **Radius:** `lg` (1rem). **Height:** Minimum 56dp to ensure accessibility for first-time smartphone users.
- **Secondary Button:** Uses a `secondary_container` fill. This "calming green" indicates a positive but non-urgent action.
- **Tertiary:** Text-only with `primary` coloring, used for "Cancel" or "Back" to reduce cognitive weight.

### Cards & Lists
- **The "No-Divider" Rule:** Forbid the use of horizontal lines between list items. Instead, use a `16px` vertical spacer or a subtle shift from `surface` to `surface-container-low` for every other item.
- **Patient Record Cards:** Use `surface-container-lowest` with a `md` (0.75rem) corner radius. Elements inside the card should use `title-md` for the primary data point (e.g., "Blood Pressure").

### Input Fields
- **Floating Labels:** Use `label-md` in `on_surface_variant`. 
- **States:** Error states must use `error` text and a `error_container` background tint, ensuring the user feels "guided" rather than "scolded."

### Specialized Component: The "Progressive Disclosure Drawer"
Since this is mobile-first, avoid navigating to new pages for simple info. Use a bottom sheet (Radius `xl` on top corners) that slides up, utilizing the Glassmorphism rule to keep the user grounded in their previous context.

---

## 6. Do's and Don'ts

### Do:
- **DO** use `secondary` (Green) for "Health-Positive" states like "Recovered" or "Appointment Confirmed."
- **DO** maintain a minimum touch target of 48x48dp for every interactive element.
- **DO** prioritize Amharic readability by increasing line-height by 1.2x compared to English defaults.
- **DO** use "Action-First" language (e.g., "Schedule Visit" vs "New Appointment").

### Don't:
- **DON'T** use 100% opaque, high-contrast black borders.
- **DON'T** use `error` (Red) for anything other than immediate medical alerts or system failures. For "Urgent but not panic," use `tertiary` (Orange).
- **DON'T** use "Standard" Material Design shadows; they are too heavy for the "Calm" requirement.
- **DON'T** crowd the screen. If a page has more than 5 primary actions, use a "More" drawer.

### Interaction Patterns
- **The "Soft Reveal":** When a user taps a medical record, the details should expand via a vertical accordion shift rather than a jarring page transition. This reduces cognitive load by keeping the context visible.