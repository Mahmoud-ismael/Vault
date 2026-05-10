# VAULT — Design System
**Codename:** Industrial Clarity (Sky)  
**Version:** 1.0  
**Based on:** Passr design language, accent shifted to sky blue

---

## 1. Design Philosophy

Vault follows **Industrial Clarity** — a design language built on the principle that serious thinking deserves a serious tool. The aesthetic is precise, restrained, and typographically rigorous. It borrows from technical documentation, archival systems, and industrial interfaces. Nothing is decorative unless it earns its place.

**Three rules:**
1. Every element is either functional or invisible.
2. Typography carries the visual weight. Not colour. Not illustration.
3. The interface should feel like it will still exist in 20 years.

---

## 2. Colour Palette

All colours as CSS custom properties. Define in `globals.css`.

```css
:root {
  /* Backgrounds */
  --vault-bg:        #0D0D0F;   /* primary background */
  --vault-bg-2:      #121215;   /* elevated surface (cards, sidebar) */
  --vault-bg-3:      #18181C;   /* hover states, secondary panels */
  --vault-bg-4:      #1F1F26;   /* input backgrounds, badges */

  /* Borders */
  --vault-border:    #252529;   /* default border */
  --vault-border-2:  #32323A;   /* hover border, active states */
  --vault-border-3:  #404048;   /* strong borders, dividers */

  /* Text */
  --vault-text:      #F0EDE8;   /* primary text */
  --vault-text-2:    #9E9B94;   /* secondary text, labels */
  --vault-text-3:    #5A5854;   /* muted text, placeholders */
  --vault-text-4:    #38362F;   /* disabled text */

  /* Accent — Sky Blue */
  --vault-accent:    #3B9EFF;   /* primary accent */
  --vault-accent-2:  #1A6FCC;   /* accent hover / darker */
  --vault-accent-3:  #0D4A8A;   /* accent pressed */
  --vault-accent-dim:#3B9EFF14; /* accent tint background */
  --vault-accent-border: #3B9EFF33; /* accent border tint */

  /* Status colours */
  --vault-settled:   #4CAF7D;   /* green — settled stance */
  --vault-evolving:  #E8A838;   /* amber — evolving stance */
  --vault-undecided: #7B9FE0;   /* soft blue — undecided */
  --vault-empty:     #3A3A42;   /* grey — not started */

  /* Semantic */
  --vault-danger:    #C95050;   /* errors, destructive actions */
  --vault-warning:   #C98A30;   /* warnings, unverified AI */
  --vault-success:   #4CAF7D;   /* success states */
  --vault-ai:        #3B9EFF;   /* AI-generated content marker */
}
```

---

## 3. Typography

### Font Stack

```css
/* In globals.css — import from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600&display=swap');
```

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / Hero | `Instrument Serif` | 400, italic | Page titles, stance titles, journal headings |
| UI / Body | `Geist` | 300–600 | All body text, descriptions, paragraphs |
| Mono / Metadata | `DM Mono` | 300–500 | Labels, badges, dates, counts, tags, code |

### Type Scale

```css
/* globals.css */
.text-display   { font-family: 'Instrument Serif', serif; font-size: 36px; line-height: 1.15; }
.text-title-lg  { font-family: 'Instrument Serif', serif; font-size: 28px; line-height: 1.2; }
.text-title     { font-family: 'Instrument Serif', serif; font-size: 22px; line-height: 1.3; }
.text-title-sm  { font-family: 'Instrument Serif', serif; font-size: 18px; line-height: 1.35; }

.text-body-lg   { font-family: 'Geist', sans-serif; font-size: 17px; line-height: 1.7; }
.text-body      { font-family: 'Geist', sans-serif; font-size: 15px; line-height: 1.65; }
.text-body-sm   { font-family: 'Geist', sans-serif; font-size: 13px; line-height: 1.6; }

.text-mono-lg   { font-family: 'DM Mono', monospace; font-size: 13px; letter-spacing: 0.05em; }
.text-mono      { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.10em; }
.text-mono-sm   { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.15em; }
.text-mono-xs   { font-family: 'DM Mono', monospace; font-size: 9px;  letter-spacing: 0.20em; }
```

### Typography Rules
- All UI labels and metadata are `DM Mono`, uppercase, tracked out
- Page titles and content headings are `Instrument Serif`
- Body text, descriptions, and editor content are `Geist`
- No font mixing within a single component
- Italic `Instrument Serif` is used for emphasis, quotes, and stance text

---

## 4. Spacing System

Base unit: `4px`. All spacing is multiples of 4.

```
4px   — xs   (tight gaps, icon padding)
8px   — sm   (component internal padding)
12px  — md   (between related elements)
16px  — lg   (section padding, card padding)
24px  — xl   (between components)
32px  — 2xl  (section gaps)
40px  — 3xl  (page section spacing)
48px  — 4xl  (hero padding)
```

In Tailwind: use `p-2`, `p-3`, `p-4`, `p-6`, `p-8`, `p-10`, `p-12` — never custom values.

---

## 5. Component Patterns

### Cards

```
background:  var(--vault-bg-2)
border:      1px solid var(--vault-border)
border-radius: 6px
padding:     16px 20px
transition:  border-color 150ms, background 150ms

hover:
  border-color: var(--vault-border-2)
  background:   var(--vault-bg-3)

active/selected:
  border-color: var(--vault-accent-border)
  background:   var(--vault-accent-dim)
```

### Buttons

```
Primary:
  background:  var(--vault-accent)
  color:       #0D0D0F
  font:        DM Mono 11px uppercase tracked
  padding:     8px 18px
  border-radius: 4px
  hover: background var(--vault-accent-2)

Ghost:
  background:  transparent
  border:      1px solid var(--vault-border-2)
  color:       var(--vault-text-2)
  hover: background var(--vault-bg-3), color var(--vault-text)

Danger:
  background:  transparent
  border:      1px solid #C9505033
  color:       var(--vault-danger)
  hover: background #C9505011
```

### Inputs

```
background:   var(--vault-bg-4)
border:       1px solid var(--vault-border)
border-radius: 4px
padding:      8px 12px
font:         Geist 15px
color:        var(--vault-text)

focus:
  border-color: var(--vault-accent)
  box-shadow:   0 0 0 3px var(--vault-accent-dim)
  outline: none

placeholder:
  color: var(--vault-text-3)
  font-style: italic
```

### Status Badges

```
font:         DM Mono 9px uppercase letter-spacing 0.15em
padding:      2px 8px
border-radius: 3px

Settled:   background #4CAF7D18  color var(--vault-settled)
Evolving:  background #E8A83818  color var(--vault-evolving)
Undecided: background #7B9FE018  color var(--vault-undecided)
Empty:     background var(--vault-bg-4)  color var(--vault-text-3)
AI:        background var(--vault-accent-dim)  color var(--vault-accent)  border 1px solid var(--vault-accent-border)
```

### AI Content Blocks

AI-generated content is always visually distinct:

```
border-left:  3px solid var(--vault-accent)
background:   var(--vault-accent-dim)
border-radius: 0 6px 6px 0
padding:      12px 16px

Header tag:
  font: DM Mono 9px uppercase
  color: var(--vault-accent)
  content: "AI · [model name]"
```

### Section Headers (within pages)

```
font:        DM Mono 10px uppercase letter-spacing 0.20em
color:       var(--vault-text-3)
padding-bottom: 8px
border-bottom: 1px solid var(--vault-border)
margin-bottom: 16px
```

---

## 6. Layout

### Sidebar
```
width:        240px
background:   var(--vault-bg-2)
border-right: 1px solid var(--vault-border)
position:     fixed, full height
```

### Topbar
```
height:       52px
background:   var(--vault-bg)
border-bottom: 1px solid var(--vault-border)
position:     sticky top-0 z-50
```

### Main Content
```
margin-left:  240px
padding:      32px 40px
max-width:    none (full width minus sidebar)
```

### Content Max Widths
```
Narrow (forms, editors):   680px
Standard (lists, cards):   100%
Wide (document viewer):    100%
Reading mode:              680px centered
```

---

## 7. Navigation

### Sidebar Nav Items

```
padding:      9px 20px
font:         Geist 14px
color:        var(--vault-text-2)
border-left:  2px solid transparent
gap:          10px (icon + label)

hover:
  background: var(--vault-bg-3)
  color:      var(--vault-text)

active:
  color:       var(--vault-accent)
  border-left: 2px solid var(--vault-accent)
  background:  var(--vault-accent-dim)
```

### Section Labels in Sidebar

```
font:         DM Mono 9px uppercase letter-spacing 0.2em
color:        var(--vault-text-3)
padding:      14px 20px 6px
```

---

## 8. Icons

Use `lucide-react` exclusively. Icon size: `14px` for nav, `16px` for actions, `20px` for empty states.

Icon mapping:
```
Dashboard    →  LayoutDashboard
Stances      →  Target
Journal      →  BookOpen
Notes        →  FileText
Documents    →  Archive
Search       →  Search
Settings     →  Settings
AI action    →  Sparkles
Add          →  Plus
Back         →  ArrowLeft
Export       →  Download
Settled      →  CheckCircle2
Evolving     →  RefreshCw
Undecided    →  HelpCircle
Warning      →  AlertTriangle
```

---

## 9. Motion & Animation

Vault uses minimal, purposeful animation only.

```css
/* Page transitions */
.page-enter {
  animation: pageIn 180ms ease forwards;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* All interactive elements */
transition-duration: 150ms;
transition-timing-function: ease;

/* No bounce, no spring, no elastic */
/* No loading spinners — use skeleton screens */
```

Skeleton screens use:
```css
background: linear-gradient(90deg, var(--vault-bg-3) 25%, var(--vault-bg-4) 50%, var(--vault-bg-3) 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

---

## 10. Editor Styles (Tiptap)

The rich text editor (Journal + Notes) inherits Vault typography:

```css
.tiptap-editor {
  font-family: 'Geist', sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: var(--vault-text-2);
}

.tiptap-editor h1 { font-family: 'Instrument Serif', serif; font-size: 28px; color: var(--vault-text); }
.tiptap-editor h2 { font-family: 'Instrument Serif', serif; font-size: 22px; color: var(--vault-text); }
.tiptap-editor h3 { font-family: 'Instrument Serif', serif; font-size: 18px; color: var(--vault-text); }
.tiptap-editor blockquote {
  border-left: 3px solid var(--vault-accent);
  padding-left: 16px;
  color: var(--vault-text-2);
  font-style: italic;
}
.tiptap-editor code {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  background: var(--vault-bg-4);
  padding: 1px 6px;
  border-radius: 3px;
}
.tiptap-editor a { color: var(--vault-accent); text-decoration: underline; text-decoration-color: var(--vault-accent-border); }
.tiptap-editor ::selection { background: var(--vault-accent-dim); }
```

---

## 11. Responsive Behaviour

Vault is desktop-first but mobile-usable.

```
≥ 1280px  — Full sidebar + content, all columns
1024–1279px — Sidebar collapses to icons only
768–1023px  — Sidebar hidden, hamburger menu
< 768px     — Mobile layout, bottom nav, single column
```

---

## 12. Do Nots

- ❌ No gradients (background or text)
- ❌ No box shadows (use borders instead)
- ❌ No border-radius above 8px
- ❌ No illustrations or decorative SVGs
- ❌ No color fills as primary backgrounds (only accent tints at very low opacity)
- ❌ No Inter, Roboto, or system fonts
- ❌ No purple, no green as accent (those are status colours only)
- ❌ No animations above 300ms
- ❌ No modal dialogs for destructive actions — use inline confirmation
