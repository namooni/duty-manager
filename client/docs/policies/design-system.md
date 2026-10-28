# Design System & UI Tone and Manner Guidelines

You are an expert frontend engineer and product designer. When building or updating UI components, pages, or styling, strictly adhere to the following principles, palette, and component conventions. Avoid generic, template-like "AI-generated" aesthetics (e.g., violet/indigo gradients, floating glassmorphism, overly rounded pills, exaggerated padding).

---

## 1. Core Visual Principles (Anti-AI Aesthetics)

- **Structure over Decoration:** Use crisp 1px solid borders for visual hierarchy instead of heavy box-shadows or glow effects.
- **Subtle Elevation:** Limit shadows to subtle, realistic elevation (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`).
- **Tight Corner Radii:** Keep corner radius restrained. Use `4px` (`rounded-sm` or `rounded`) to `6px` (`rounded-md`). Do NOT use large pills or `rounded-2xl` on standard cards, tables, or panels.
- **High Information Density:** Design for desktop-first internal workplace efficiency. Avoid excessive whitespace, oversized hero banners, or mobile-first padded margins.
- **Functional Typography:**
  - Standard sans-serif stack (`Pretendard`, `Inter`, or `system-ui`).
  - Always enforce `font-variant-numeric: tabular-nums` (`tabular-nums` in Tailwind) for numeric data, tables, timestamps, and metrics.
  - Plain, neutral microcopy (e.g., "저장 완료", "동기화 중") without exaggerated greetings or unnecessary emotional cues.

---

## 2. Design Tokens: Neutral Workplace

Use white, neutral grays and charcoal for navigation, normal actions, selection and focus. Do not use green, a warm editorial palette, gradients or a decorative brand accent. Reserve amber for cautionary actions and warnings, and red for destructive actions and errors. Success uses neutral styling and explicit text.

### Color Tokens

- **Background (Canvas):** `#F7F7F7` (Neutral light gray)
- **Background (Surface/Card):** `#FFFFFF`
- **Background (Subtle/Hover):** `#F0F0F0`
- **Border / Divider:** `#DFDFDF`
- **Text (Primary):** `#202020` (Neutral charcoal, high readability)
- **Text (Muted/Secondary):** `#666666`
- **Primary Action:** `#262626` (Charcoal)
- **Primary Hover:** `#171717`
- **Warning Accent:** `#B45309` (Warning status only; not a brand accent)

### Semantic Feedback Colors

- **Success:** `#525252` (Neutral gray; communicate success with text)
- **Warning:** `#B45309` (Amber)
- **Destructive/Error:** `#B42318` (Crimson Red)

---

## 3. Tailwind CSS Preset (Reference)

When generating Tailwind classes or updating `tailwind.config.js`, map to this structure:

```js
// tailwind.config.js snippet
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F7',
        surface: '#FFFFFF',
        subtle: '#F0F0F0',
        border: '#DFDFDF',
        text: {
          main: '#202020',
          muted: '#666666',
        },
        primary: {
          DEFAULT: '#262626',
          hover: '#171717',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#B45309',
          subtle: '#FFF7ED',
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
};
```

---

## 4. Component Implementation Checklist

1. **Buttons:**
   - Primary: Background `#262626`, Text `#FFFFFF`, rounded `4px`~`6px`, no colored glow.
   - Secondary: Background `surface`, Border `1px solid #DFDFDF`, Text `#202020`.
   - Warning: White background, amber border/text `#B45309`; hover `#FFF7ED`. Use for disabling members and removing holiday exceptions.
   - Danger text: Transparent background/border, red text `#B42318`; hover `#FEF3F2`. Use for opening delete confirmation and removing draft rows.
   - Danger: Red background/border `#B42318`, white text; hover `#912018`. Use for the final destructive confirmation.
2. **Cards / Containers:**
   - Background `#FFFFFF`, Border `1px solid #DFDFDF`, Radius `6px`.
   - Avoid `backdrop-filter: blur()`.
3. **Data Tables & Lists:**
   - Clear row division with `#DFDFDF` borders.
   - Headers: Background `#F7F7F7` or transparent, Text `#666666`, uppercase small text.
   - Numerical cells must include `tabular-nums`.

## 5. Color Usage

- Primary buttons, ordinary links, active navigation, checkboxes and focus rings use charcoal. Destructive actions use the danger variants.
- Standard badges, assignee names and success messages use neutral gray styling.
- Amber is reserved for actual items needing attention. Red is reserved for destructive actions and errors.
- Keep the existing compact layout, 1px borders, 4–6px radii and tabular numerals. Do not use color to establish a decorative brand mood.

## 6. Action Hierarchy

- Create/save/primary navigation: primary (charcoal fill).
- Edit/change/cancel: secondary (neutral outline).
- Disable a member or remove a holiday exception: warning (amber outline). Re-enable a member: neutral text.
- Delete entry point: dangerText (red text). Final delete confirmation: danger (red fill).
- Keep explicit labels; color supplements wording and fill/border differences. Do not assign decorative colors to every action. All variants retain shared disabled, focus and keyboard behavior.

## 7. Spacing and Alignment

- Use 8px between related controls or cell items, 12px between a label and its action, and 16px between content groups. Card content padding is 20px; standard panel/dialog padding is 16px.
- Put card actions in a separate footer with 16px top padding and 8px button gaps. Keep footers aligned even when descriptions or member names wrap.
- Table headers use 12px 16px padding; cells use 14px 16px and top alignment. Titles, descriptions, and actions are separate stacked elements, never adjacent inline text and buttons.
- Use the shared ItemActionRow grid for names with trailing actions. Schedule assignee groups are at most 284px wide (160px name + 12px gap + 112px action), aligned to the start of the cell. Preserve full names with wrapping; do not stretch the group to the far edge of a wide cell.
- Use common Button size=sm (32px) in tables. Tables must not override button padding/height through descendant selectors. Wide schedule tables scroll inside TableWrap on narrow screens.
- InlineActions provides an 8px wrapping action group. Align year/filter controls at the bottom of their labelled fields. Dialog spacing comes from its body and form/stack gaps; avoid adding alert margins on top of those gaps.

- Single-line member tables vertically center content; keep the state-change action width constant so delete buttons also align across active/inactive rows.
