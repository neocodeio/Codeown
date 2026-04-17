# AI Professional UI/UX Engineering Instructions for Codeown

## Core Philosophy
Avoid "AI Slop" and "Vibe-coded" aesthetics. The goal is a high-end, engineering-focused, minimalist SaaS product. Prioritize functional density, mathematical precision, and subtle human touches over flashy, generic templates.

## 1. Typography & Visual Hierarchy
- **Strict Vertical Rhythm:** Use a modular scale (e.g., 1.250). Avoid arbitrary font sizes.
- **Letter Spacing:** Apply `tracking-tight` (-0.02em) to headers for a "premium" feel. Use `tracking-wide` for small overlines/labels.
- **Font Contrast:** Never use pure black (#000) for text. Use deep slate or navy-tinted grays. 
- **Body Text:** Maintain a line-height of 1.6 to 1.7 for maximum readability.

## 2. The "Anti-AI" Border & Surface Strategy
- **Subtle Borders:** Use very low-contrast borders (e.g., `1px solid rgba(0,0,0,0.05)` for light mode or `rgba(255,255,255,0.1)` for dark mode).
- **Shadows over Gradients:** Avoid heavy gradients. Use extremely subtle "Ambient Occlusion" shadows (multi-layered shadows) rather than single, muddy shadows.
- **Surface Elevation:** Use color to indicate depth (e.g., background is #FAFAFA, cards are #FFFFFF) instead of heavy box-shadows.
- **Squircle Corners:** Use moderate, consistent border-radii (10px - 14px). Avoid "pill" shapes unless functional.

## 3. Grid & Layout (Breaking the Bento)
- **Intentional Asymmetry:** Don't make every card the same size. Use a 60/40 or 70/30 split to guide the eye.
- **Whitespace (Negative Space):** Increase padding. Professional designs "breathe." AI slop is usually cramped.
- **Content-First:** The layout should serve the data (e.g., Analytics charts should dictate the card size, not vice versa).

## 4. Engineering Details (The "Pro" Touch)
- **Micro-Interactions:** Implement subtle hover states. Instead of just changing color, use a slight translation (e.g., `translateY(-2px)`) with a `cubic-bezier(0.4, 0, 0.2, 1)` transition.
- **Monospace Accents:** Use monospace fonts for numbers, timestamps, and metadata (e.g., stats in the Analytics dashboard). It screams "Built for Devs."
- **Noise & Texture:** Apply a 2-3% opacity grain/noise overlay on large surfaces to break digital perfection.
- **Skeleton States:** Always design for data loading. Use refined, pulsing skeleton loaders.

## 5. Color Palette Principles
- **Desaturated Accents:** Use "washed-out" or "professional" accent colors. Instead of neon blue, use a slate-blue or a deep indigo.
- **Functional Color:** Use color only to convey meaning (Success, Error, Warning, New Feature).
- **Dark Mode:** Don't just invert colors. Use "Elevation grays" (the higher the element, the lighter the gray).

## 6. Code Execution Guidelines
- **Pure CSS/HTML Emphasis:** No unnecessary libraries. Focus on clean, semantic HTML5 and optimized CSS.
- **Responsive Geometry:** Ensure layouts don't just "stack" on mobile, but re-calculate proportions to maintain the aesthetic.
- **Data Visualization:** Charts should be minimalist. No grid lines, no excessive labels. Use smooth area paths with low-opacity fills.

---
*Note: If any generated design looks like a generic landing page template, stop and simplify. Aim for the "Linear.app" or "Vercel" aesthetic.*
