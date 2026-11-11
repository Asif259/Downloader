# UI/UX Design System — DownLink

**Project:** DownLink Monorepo  
**Design Philosophy:** "Cybernetic Minimalism" — High-contrast dark theme, laser-focused utility, zero cognitive friction, and vivid emerald accents.  
**Status:** Approved Design System  

---

## 1. Design Philosophy & Visual Identity

DownLink is crafted for utility, speed, and precision. It completely rejects the cluttered, ad-riddled, untrustworthy aesthetic of legacy media downloader websites. Instead, it presents itself as a sleek developer-grade utility — blending deep obsidian backgrounds with radiant emerald neon accents, crisp typography, and fluid micro-interactions.

### Core Principles
1. **Utility-First:** The primary action (pasting a link and getting a file) is always visible above the fold and requires minimal clicks.
2. **Honest Feedback:** Every server state (parsing, downloading, muxing, streaming) is communicated transparently with real numbers (percentages, transfer speeds, file sizes).
3. **Respect for Dark Mode:** Engineered natively for low-light environments with deeply stratified dark elevation layers, avoiding harsh pure-white eye strain.

---

## 2. Color Palette & Design Tokens

### 2.1 Color Tokens (Exact Values)

| Token Name | HEX / CSS Value | Description / Usage |
|---|---|---|
| `--bg-deep` | `#0a0a0b` | Base canvas background for the entire application |
| `--bg-surface` | `#121214` | Card surfaces, container modules, and history wrappers |
| `--bg-elevated` | `#1a1a1e` | Inputs, interactive buttons, modal headers, dropdowns |
| `--text-primary` | `#f8fafc` | Main headings, titles, active labels, primary values |
| `--text-secondary` | `#94a3b8` | Subtitles, duration text, metadata labels, table headers |
| `--text-muted` | `#475569` | Placeholders, inactive icons, subtle dividers |
| `--accent-primary` | `#10b981` | Emerald green: Primary actions, progress bars, active toggles |
| `--accent-secondary` | `#14b8a6` | Teal cyan: Gradient stop, secondary highlights |
| `--accent-gradient` | `linear-gradient(135deg, #10b981 0%, #14b8a6 100%)` | Brand title, primary CTA button, active tab indicator |
| `--accent-glow` | `0 0 50px rgba(16, 185, 129, 0.2)` | Radial ambient backdrops and hover glow states |
| `--border-subtle` | `rgba(255, 255, 255, 0.05)` | Card boundaries, dividers, table cell borders |
| `--border-glow` | `rgba(16, 185, 129, 0.2)` | Focused input border, active card highlight |
| `--success` | `#10b981` | Completed downloads, valid link indicator |
| `--success-bg` | `rgba(16, 185, 129, 0.1)` | Success badge background |
| `--error` | `#f43f5e` | Crimson red: Failed downloads, invalid URL alerts |
| `--error-bg` | `rgba(244, 63, 94, 0.1)` | Error toast and alert container backgrounds |
| `--warning` | `#f59e0b` | Amber yellow: Backend sleeping alert, retry hints |
| `--warning-bg` | `rgba(245, 158, 11, 0.1)` | Warning banner backgrounds |

---

## 3. Typography & Hierarchy

### 3.1 Font Family
- **Primary Body & UI:** `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace (Speed, Timers, File Sizes):** `"JetBrains Mono", "SF Mono", "Fira Code", monospace`

### 3.2 Type Scale

| Scale Role | Font Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| **Display H1** | `clamp(2.0rem, 5vw, 3.0rem)` | `1.1` | `700 (Bold)` | Main brand header ("DownLink") |
| **Subtitle** | `1.125rem (18px)` | `1.5` | `400 (Regular)` | Page tagline under brand header |
| **Section Header** | `1.25rem (20px)` | `1.3` | `600 (SemiBold)` | "Active Downloads", "Recent History" |
| **Card Title** | `1.0rem (16px)` | `1.4` | `600 (SemiBold)` | Video preview title, modal heading |
| **Body Regular** | `0.9375rem (15px)` | `1.6` | `400 (Regular)` | Standard text, explanations, toasts |
| **Metric / Code** | `0.875rem (14px)` | `1.4` | `500 (Medium)` | `4.8 MB/s`, `00:15`, `1080p` badges |
| **Caption / Tiny** | `0.75rem (12px)` | `1.3` | `500 (Medium)` | Platform pills, table timestamps |

---

## 4. Spacing System & Layout Grid

### 4.1 Spacing Scale
Based on a flexible 4px/8px modular rhythm:
- `xxs`: `4px` (0.25rem)
- `xs`: `8px` (0.5rem)
- `sm`: `12px` (0.75rem)
- `md`: `16px` (1.0rem)
- `lg`: `24px` (1.5rem)
- `xl`: `32px` (2.0rem)
- `2xl`: `48px` (3.0rem)

### 4.2 Layout Grid & Breakpoints
The layout is centered within a maximum container width of `1200px` with responsive lateral padding:

| Breakpoint | Minimum Width | Lateral Padding | Layout Adjustments |
|---|---|---|---|
| **Mobile (`sm`)** | `< 640px` | `1rem (16px)` | Single-column stack, full-width inputs, scrollable table |
| **Tablet (`md`)** | `640px - 768px` | `1.5rem (24px)` | Two-column format tabs, expanded preview thumbnail |
| **Desktop (`lg`)** | `1024px` | `2.0rem (32px)` | Full dashboard grid, side-by-side format & queue panels |
| **Ultra-Wide (`xl`)** | `1280px+` | Auto-centered | Maximum container clamped to `1200px` |

---

## 5. Component Design Specifications

### 5.1 Main URL Input Bar (`LinkInput`)
- **Container Height:** `56px` on desktop, `48px` on mobile.
- **Background:** `var(--bg-elevated)` (`#1a1a1e`).
- **Border:** `1px solid var(--border-subtle)` (`rgba(255, 255, 255, 0.05)`).
- **Border Radius:** `12px` (Smooth squircles).
- **Focus State:** Border changes to `var(--accent-primary)` (`#10b981`) with `box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15)`.
- **Inline Elements:**
  - Left: Search/Link icon in `var(--text-muted)`.
  - Right: Dynamic Platform Badge (colored pill displaying "YouTube", "TikTok", etc.) + Paste Button + Submit Button.

### 5.2 Buttons & Interactive Variants

#### Primary CTA ("Start Download")
- **Background:** `var(--accent-gradient)` (`linear-gradient(135deg, #10b981, #14b8a6)`).
- **Text Color:** `#0a0a0b` (Deep obsidian for maximum contrast against vibrant emerald).
- **Font Weight:** `600 (SemiBold)`.
- **Hover:** `filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3)`.
- **Active:** `transform: translateY(0); filter: brightness(0.95)`.
- **Disabled:** `opacity: 0.5; cursor: not-allowed; filter: grayscale(0.5)`.

#### Secondary Action ("Paste" / "Clear")
- **Background:** `rgba(255, 255, 255, 0.04)`.
- **Border:** `1px solid var(--border-subtle)`.
- **Text Color:** `var(--text-secondary)`.
- **Hover:** Background to `rgba(255, 255, 255, 0.08)`, text to `var(--text-primary)`.

#### Danger Action ("Cancel Task")
- **Background:** `var(--error-bg)` (`rgba(244, 63, 94, 0.1)`).
- **Border:** `1px solid rgba(244, 63, 94, 0.2)`.
- **Text Color:** `var(--error)` (`#f43f5e`).
- **Hover:** Background to `rgba(244, 63, 94, 0.2)`.

### 5.3 Progress Bar Component (`DownloadQueue`)
- **Track Height:** `8px`.
- **Track Background:** `rgba(255, 255, 255, 0.06)`.
- **Track Border Radius:** `9999px` (Full pill).
- **Fill Bar:** Animated gradient (`#10b981` to `#14b8a6`) with CSS transition `width 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Gaze Anchor:** Transfer speed (`4.8 MB/s`) and remaining time (`ETA: 00:15`) aligned right in monospace font.

### 5.4 Toast Notification System
- **Placement:** Fixed bottom-right on desktop (`bottom: 24px; right: 24px; z-index: 1000`), bottom-center on mobile.
- **Entry Animation:** Slide up with cubic-bezier spring (`translateY(0)` from `translateY(20px)`), `opacity: 1`.
- **Variants:**
  - **Success:** Emerald icon + subtle green border.
  - **Error:** Red icon + subtle crimson border.
  - **Warning:** Amber icon + subtle yellow border.

---

## 6. Accessibility & Compliance (WCAG 2.1 AA)

1. **Color Contrast:**
   - Body text (`#f8fafc`) on deep background (`#0a0a0b`) maintains a contrast ratio of **17.8:1** (exceeds AAA requirement of 7:1).
   - Emerald primary action button text (`#0a0a0b`) on emerald fill (`#10b981`) maintains a contrast ratio of **9.2:1** (exceeds AAA).
2. **Keyboard Navigation:**
   - All interactive controls (Input, Paste, Format Buttons, Download, Cancel) have distinct, high-visibility focus rings (`:focus-visible`).
   - Pressing `Enter` inside the URL input automatically executes the primary extraction flow.
3. **Screen Readers:**
   - Icons accompanied by semantic `aria-label` tags (e.g., `aria-label="Paste URL from clipboard"`).
   - Progress bar includes standard ARIA roles: `role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"`.

---

## 7. Instructions for AI Design & Stitch Generation

When prompting AI UI design tools (such as Stitch, v0, or Galileo) to generate supplementary components or landing pages for DownLink:
```text
Role: Senior UI/UX Designer
Style: Futuristic Developer-Grade Cybernetic Minimalism
Theme: Dark-mode first
Background: Deep obsidian #0a0a0b with surface elevation #121214 and elevated inputs #1a1a1e
Accent: Vivid neon emerald #10b981 with teal gradient #14b8a6
Typography: Inter for clean UI, JetBrains Mono for metrics and download speeds
Borders: Subtle 1px translucent lines (rgba(255,255,255,0.05))
Components to generate: Clean single-page dashboard with centered URL bar, live platform detector badges, video thumbnail preview card, quality tab selector (1080p, 720p, 480p, MP3 audio), real-time animated progress bars with speed/ETA readouts, and local history table.
Strict Rules: No purple/violet gradients, no intrusive advertising widgets, no stock photo carousels.
```

