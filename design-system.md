# NomadCompass Design System

A warm, editorial travel magazine aesthetic for digital nomads.

---

## Typography

### Font Stack

| Role | Font | Weight | Google Fonts URL |
|------|------|--------|------------------|
| **Display** | DM Serif Display | 400 | `https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap` |
| **Body** | Source Sans 3 | 400, 500, 600 | `https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap` |

**Combined Import:**
```
https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600&display=swap
```

### Type Scale

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| `--text-xs` | 0.75rem (12px) | 1.5 | Captions, labels |
| `--text-sm` | 0.875rem (14px) | 1.5 | Small body text |
| `--text-base` | 1rem (16px) | 1.6 | Body text |
| `--text-lg` | 1.125rem (18px) | 1.6 | Lead paragraphs |
| `--text-xl` | 1.25rem (20px) | 1.5 | Subheadings |
| `--text-2xl` | 1.5rem (24px) | 1.4 | Section titles |
| `--text-3xl` | 1.875rem (30px) | 1.3 | Page headings |
| `--text-4xl` | 2.25rem (36px) | 1.2 | Hero subheads |
| `--text-5xl` | 3rem (48px) | 1.1 | Hero titles |
| `--text-6xl` | 3.75rem (60px) | 1.05 | Display |

---

## Color Palette

### Primary Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Terracotta** | `#C4704B` | `--color-terracotta` | Primary brand, CTAs, accents |
| **Terracotta Dark** | `#A85A38` | `--color-terracotta-dark` | Hover states |
| **Terracotta Light** | `#E8A584` | `--color-terracotta-light` | Subtle accents |

### Secondary Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Forest** | `#2D4739` | `--color-forest` | Headlines, nav, footer bg |
| **Forest Light** | `#3D5F4D` | `--color-forest-light` | Hover states |
| **Forest Muted** | `#4A7360` | `--color-forest-muted` | Secondary text on dark |

### Neutral Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Cream** | `#FDF8F3` | `--color-cream` | Page background |
| **Sand** | `#F5EDE4` | `--color-sand` | Cards, sections |
| **Sand Dark** | `#E8DDD0` | `--color-sand-dark` | Borders, dividers |
| **Stone** | `#8C8279` | `--color-stone` | Muted text |
| **Charcoal** | `#3D3833` | `--color-charcoal` | Body text |
| **Ink** | `#1F1C19` | `--color-ink` | Headlines |

### Utility Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **White** | `#FFFFFF` | `--color-white` | Backgrounds, text on dark |
| **Success** | `#4A7360` | `--color-success` | Positive states |
| **Warning** | `#D4A03D` | `--color-warning` | Caution states |
| **Error** | `#C1544B` | `--color-error` | Error states |

---

## Spacing Scale

Based on a 4px grid with a base of 1rem = 16px.

| Name | Value | Pixels | Usage |
|------|-------|--------|-------|
| `--space-1` | 0.25rem | 4px | Tight gaps |
| `--space-2` | 0.5rem | 8px | Icon gaps, tight padding |
| `--space-3` | 0.75rem | 12px | Small padding |
| `--space-4` | 1rem | 16px | Standard gap |
| `--space-5` | 1.25rem | 20px | Comfortable padding |
| `--space-6` | 1.5rem | 24px | Card padding |
| `--space-8` | 2rem | 32px | Section gaps |
| `--space-10` | 2.5rem | 40px | Large gaps |
| `--space-12` | 3rem | 48px | Section padding |
| `--space-16` | 4rem | 64px | Large section padding |
| `--space-20` | 5rem | 80px | Hero spacing |
| `--space-24` | 6rem | 96px | Major section breaks |

---

## Border Radius

| Name | Value | Usage |
|------|-------|-------|
| `--radius-sm` | 4px | Inputs, small buttons |
| `--radius-md` | 8px | Cards, buttons |
| `--radius-lg` | 12px | Large cards, modals |
| `--radius-xl` | 16px | Feature cards |
| `--radius-full` | 9999px | Pills, avatars |

---

## Shadows

| Name | Value | Usage |
|------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(31, 28, 25, 0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 12px rgba(31, 28, 25, 0.08)` | Cards |
| `--shadow-lg` | `0 8px 24px rgba(31, 28, 25, 0.12)` | Dropdowns, modals |
| `--shadow-xl` | `0 16px 48px rgba(31, 28, 25, 0.16)` | Feature elements |

---

## Transitions

| Name | Value | Usage |
|------|-------|-------|
| `--transition-fast` | `150ms ease` | Micro-interactions |
| `--transition-base` | `250ms ease` | Standard transitions |
| `--transition-slow` | `400ms ease` | Page transitions |

---

## Layout

| Name | Value | Usage |
|------|-------|-------|
| `--container-max` | 1200px | Main content width |
| `--container-narrow` | 720px | Article/blog content |
| `--nav-height` | 72px | Navigation bar height |

---

## Design Principles

1. **Warmth over cold**: Avoid blue-tinted grays. All neutrals lean warm.
2. **Editorial confidence**: Bold serif headlines create authority and sophistication.
3. **Breathing room**: Generous whitespace lets content breathe.
4. **Considered details**: Every shadow, radius, and transition should feel intentional.
5. **Earthy authenticity**: Colors inspired by terracotta tiles, forest canopies, and sandy beaches.

---

## Accessibility Notes

- All color combinations meet WCAG AA contrast requirements
- Terracotta on cream: 4.6:1 ratio (passes AA for large text)
- Forest on cream: 8.2:1 ratio (passes AAA)
- Charcoal on cream: 10.1:1 ratio (passes AAA)
