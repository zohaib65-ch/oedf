# Design System

Approved 24 November 2026. Tokens come from the reference site named in the project brief, studied live at 390, 768, 1024, 1280, 1440 and 1536 px (home plus Contact, Career, Blog, About, Services). Only design values are copied: no text, photos, logos, icons, code or assets.

**Labels:** _Measured_ = read from the live page. _Derived_ = calculated from a measured value. _Adjusted_ = changed for WCAG 2.2 AA (see Accessibility). Colors are hex.

## Approved decisions

| Decision                                                                                                     | Status                                                                           |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Gold buttons use navy text, not white                                                                        | Approved                                                                         |
| Logo files are JPEGs with an off-white background: on dark surfaces the logo sits on a white rounded plate   | Approved                                                                         |
| Favicon and app icons: plain solid-navy placeholder, no mark, no seal                                        | Approved (changed from the recommendation)                                       |
| One light theme plus a `.surface-dark` scope for dark sections. No dark mode toggle (the reference has none) | Approved                                                                         |
| Portal is light, with a navy sidebar and gold active state                                                   | Approved                                                                         |
| Full navigation from 1280 px up, mobile menu below (the reference's own menu breaks at 1024 px)              | Approved                                                                         |
| Logo teal as the 5th chart color                                                                             | Approved                                                                         |
| Entry pop-up, floating WhatsApp and call buttons, home "Important notice" card                               | Not built until the client confirms (see [open-questions.md](open-questions.md)) |

## Colors

### Brand and surfaces (Measured unless noted)

| Token                   | Hex                   | Role                                                                               |
| ----------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `navy`                  | `#0b1120`             | Main dark surface: header, footer, call-to-action band, dark buttons, step circles |
| `navy-deep`             | `#08111f`             | Dark feature sections. Header base `#07101f` at 26% (94% once scrolled)            |
| `navy-darkest`          | `#050816`             | End of the hero gradient                                                           |
| `ink`                   | `#111827`             | Body text, headings, dark button fill, middle of the hero gradient                 |
| `gold`                  | `#c9a355`             | Accent on dark surfaces, icons, glows. **Not for text on light surfaces**          |
| `gold-light`            | `#ebdfa7`             | End of the gold highlight gradient on heading words                                |
| `gold-text`             | `#846932`             | **Adjusted** (reference `#9a7a3a`). Gold text on light surfaces                    |
| `gold-from` / `gold-to` | `#d4af37` / `#b38c26` | Gold button gradient (90 degrees)                                                  |
| `page`                  | `#f9fafb`             | Page background                                                                    |
| `warm`                  | `#f8f6f1`             | Warm section background ("why choose us")                                          |

### Neutrals (Tailwind v4 gray) and status

| Token      | Hex                                         | Used for                                              |
| ---------- | ------------------------------------------- | ----------------------------------------------------- |
| `gray-100` | `#f3f4f6`                                   | Card borders, muted surfaces                          |
| `gray-200` | `#e5e7eb`                                   | FAQ item borders, dividers                            |
| `gray-400` | `#99a1af`                                   | Secondary text on navy                                |
| `gray-500` | `#6a7282`                                   | Card body text (adjusted value: `--muted-foreground`) |
| `gray-600` | `#4a5565`                                   | Section subtitles                                     |
| `gray-800` | `#1e2939`                                   | Footer and sidebar borders                            |
| Success    | bg `#dcfce7`, text `#016630` (**adjusted**) | Status chips                                          |
| Danger     | bg `#ffe2e2`, text `#c10007` (**adjusted**) | Status chips                                          |
| Notice     | `#fffbeb` to `#ffffff`, border `#fee685`    | Amber notice card                                     |

Logo colors (sampled, logos are never recolored): gold `#fdcf33` to `#d8bf64`, navy `#003372` / `#00235d`, teal `#0599a7`, seal ring blue `#0003b9`.

### shadcn variables (`:root` in `src/app/globals.css`)

| Variable                                                                           | Value                                                 | Note                                                                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `--background`                                                                     | `#f9fafb`                                             |                                                                                  |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--accent-foreground` | `#111827`                                             | `ink`                                                                            |
| `--card`, `--popover`                                                              | `#ffffff`                                             |                                                                                  |
| `--primary` / `--primary-foreground`                                               | `#c9a355` / `#0b1120`                                 | Button default is rendered with the gold gradient (see Buttons)                  |
| `--secondary` / `--secondary-foreground`                                           | `#0b1120` / `#ffffff`                                 | Dark pill button                                                                 |
| `--muted` / `--muted-foreground`                                                   | `#f3f4f6` / `#646b79`                                 | **Adjusted** from `#6a7282`                                                      |
| `--accent`                                                                         | `#f8f6f1`                                             | Hover and selected rows                                                          |
| `--destructive`                                                                    | `#e7000b`                                             |                                                                                  |
| `--border`                                                                         | `#e5e7eb`                                             |                                                                                  |
| `--input`                                                                          | `#868e9b`                                             | **Adjusted** (reference 1.2:1, needs 3:1)                                        |
| `--ring`                                                                           | `#0b1120`                                             | **Adjusted** (gold is 2.4:1 on white)                                            |
| `--radius`                                                                         | `0.5rem`                                              | `xl` 12, `2xl` 16, `3xl` 24 keep Tailwind's values                               |
| `--chart-1` to `--chart-5`                                                         | `#c9a355`, `#0b1120`, `#846932`, `#6a7282`, `#0599a7` |                                                                                  |
| `--sidebar`, `--sidebar-primary`                                                   | `#0b1120`, `#c9a355`                                  | Sidebar foreground `#e5e7eb`, accent `#161c2a`, border `#1e2939`, ring `#c9a355` |

**`.surface-dark`** wraps the hero, page banners, leadership, call-to-action band and footer so shadcn components inside pick up dark values (not a mode switch): background `#0b1120` (`#08111f` for feature sections), foreground `#ffffff`, card `#161c2a`, muted `#1a1f2d`, muted-foreground `#99a1af`, accent `#1f2432`, border `#232936`, ring `#c9a355`.

### Gradients (Measured)

| Name              | Value                                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero              | `radial-gradient(circle at 72% 28%, #c9a35533, transparent 28%)` over `linear-gradient(135deg, #0b1120, #111827 52%, #050816)`, plus a left-to-right navy overlay `#0b1120f0` to `#0b112075` |
| Page mesh         | `#f8fafc` with `radial-gradient(at 80% 0, #ceaa501a, transparent 50%)` and `radial-gradient(at 0 100%, #f5faff, transparent 50%)`                                                            |
| Top bar           | `linear-gradient(to right, #07111fEB, #17243aE0 50%, #3a2a10E0)`, 1 px bottom border gold at 20%                                                                                             |
| Gold button       | `linear-gradient(90deg, #d4af37, #b38c26)`                                                                                                                                                   |
| Dark feature glow | `radial-gradient(circle at 0 0, #c9a35529, transparent 42%)` and `radial-gradient(circle at 100% 0, #c9a3552e, transparent 44%)`                                                             |

## Typography

**Inter** (variable), via `next/font`, `display: swap`, weights 400 to 900. (The reference names Inter but never ships the file.) Minimum text size 12 px. Use `tabular-nums` for reference numbers and statistics.

| Element                   | Mobile (390)        | 768 and up | 1280 and up | Weight           | Line height  | Tracking          | Color                                |
| ------------------------- | ------------------- | ---------- | ----------- | ---------------- | ------------ | ----------------- | ------------------------------------ |
| Hero H1                   | 36 px               | 48 px      | 53.6 px     | 800              | 1.05         | -0.025em          | White; last line in gold gradient    |
| Page banner H1            | 36 / 45             | 60 / 75    | 60 / 75     | 800              | 1.25         | -0.025em          | White                                |
| Page banner paragraph     | 18 / 29             | same       | same        | 400              | 1.625        | normal            | `#d1d5dc`, max width 768 px          |
| Section H2 (light)        | 30 px               | 36 px      | 36 px       | 800              | 1.11 to 1.25 | -0.025em          | `ink`                                |
| Section H2 (dark)         | 36 px               | 48 px      | 48 px       | 800              | 1            | -0.025em          | White                                |
| Card title large / medium | 24 / 32 and 18 / 28 | same       | same        | 700              | 1.33 / 1.55  | normal            | `ink`                                |
| Body / card text          | 16 / 24 and 16 / 26 | same       | same        | 400              | 1.5 / 1.625  | normal            | `ink` / `muted-foreground`           |
| Section subtitle          | 16 px               | 18 px      | 18 px       | 400              | 1.625        | normal            | `gray-600`                           |
| Hero eyebrow              | 14 px               | same       | same        | 600              | 20 px        | 0.22em, uppercase | `gold` on dark                       |
| Pill label                | 12 px               | same       | same        | 700              | 16 px        | 0.1em, uppercase  | `gold-text` on light, `gold` on dark |
| Nav link / button         | 15 px / 14 to 16 px | same       | same        | 700 / 600 to 700 | normal       | normal            | White at 90% / see Buttons           |
| Footer heading / link     | 14 px               | same       | same        | 700 / 400        | normal       | 0.05em / normal   | White / `gray-400`                   |
| Top bar                   | 12 px               | same       | same        | 400              | normal       | normal            | White at 88%                         |
| Step number               | 24 px               | same       | same        | 900              | 1            | normal            | `gold` on `navy` circle              |

## Layout, radius, shadows, motion

- **Spacing base** 4 px. **Container** max 1280 px, 24 px gutters (content 1232 px). **Breakpoints** 640 / 768 / 1024 / 1280 / 1536.
- **Header** fixed: top bar 33 px plus main row 82 px (116 px with border). Hero top padding 160 px (mobile) or 176 px, bottom 0. Page banner top 176 px, bottom 80 or 96 px, centered, max width 768 px.
- **Section padding** 80 px default, 96 px for card grids and feature sections, 64 px compact on mobile. **Gaps** 24 px between cards, 48 px between split columns (ratios like `1.02fr / 0.98fr`, one column below 1024 px).
- **Card padding** 40 px (large centered), 32 px (step, feature), 24 px (service), 16 px (small).

| Radius | Used on                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| Pill   | Buttons (except compact), pills, avatars, step circles                                                        |
| 24 px  | Large centered value cards                                                                                    |
| 16 px  | Step cards, FAQ items, trust card, hero glass chips, modal                                                    |
| 12 px  | Small dark mini cards                                                                                         |
| 8 px   | Service, blog and leadership cards, disclaimer, call-to-action band, check cards, compact buttons, icon tiles |

| Shadow      | Value                                                             | Used on                    |
| ----------- | ----------------------------------------------------------------- | -------------------------- |
| `soft`      | `0 4px 20px -2px rgba(0,0,0,.05)`                                 | Card hover                 |
| `card`      | `0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)`         | Service, step, trust cards |
| `button`    | `0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)` | Gold and dark pill buttons |
| `gold-glow` | `0 16px 35px rgba(201,163,85,.28)`                                | Gold button on dark hero   |
| `header`    | `0 16px 42px rgba(2,6,23,.26)`                                    | Header once scrolled       |
| `band`      | `0 24px 70px rgba(11,17,32,.24)`                                  | Call-to-action band        |

- **Borders:** cards 1 px `gray-100`; FAQ items `gray-200`; gold pills and tiles gold at 20% to 25%.
- **Glass on dark:** fill white at 4.5% to 8%, border white at 10% to 12%, optional blur 24 px.
- **Icon tile** 48 px, radius 8 px, gold at 10% (`#faf6ee`); **icon circle** 80 px navy at 8% (56 px solid `navy` with gold icon on "why choose us").
- **Motion:** scroll reveal rises 28 px over 0.7 s, `cubic-bezier(.22, 1, .36, 1)` (token `--ease-reveal`); hover lifts cards 4 px (feature cards 8 px) with `soft`; transitions 0.15 to 0.3 s; smooth scrolling. With reduced motion, everything is instant.

## Component patterns

| Part            | Pattern                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header          | Top bar (tagline left, phone and email right, hidden below 768 px, text managed in Settings). Main row: logo, nav, gold "Apply now". Transparent glass (`#07101f` at 26%, blur 24 px, white 10% bottom border) that becomes `#07101f` at 94% with the `header` shadow once scrolled. Dropdowns: white panel, 16 px radius, 4 px gold top line, two columns of icon tile, title, description |
| Mobile menu     | 44 px glass hamburger opening a Sheet styled like the reference's white panel (list rows, accordion chevrons, gold call to action at the end)                                                                                                                                                                                                                                               |
| Hero            | Dark gradient, two columns. Left: eyebrow, H1, 18 to 20 px paragraph in white at 80%, gold and light buttons, three glass mini cards. Right: large photo with 2 to 4 floating glass chips                                                                                                                                                                                                   |
| Page banner     | Navy, centered: pill label, H1, paragraph. Variant: left-aligned with a glass card on the right (careers)                                                                                                                                                                                                                                                                                   |
| Section heading | Centered pill label, H2, subtitle (max width 672 px); left-aligned variant with a "View all" link                                                                                                                                                                                                                                                                                           |
| Cards           | Value (24 px, 80 px icon circle), why-choose (navy circle), service (icon tile), step (64 px navy circle, gold number), FAQ (accordion, open item has a gold border), blog (image, eyebrow, "Read article"), notice (amber)                                                                                                                                                                 |
| Footer          | `navy`, 80 px top and 32 px bottom padding. Five columns: logo, short text and social icons; two link columns; legal; address and contact. Bottom bar: copyright left, registration note right                                                                                                                                                                                              |

### Buttons

| Variant        | Used on        | Fill                             | Text                                     | Shape                      | Height                         |
| -------------- | -------------- | -------------------------------- | ---------------------------------------- | -------------------------- | ------------------------------ |
| Gold (default) | Any            | Gold gradient                    | `navy` (**adjusted**), 14 to 16 px / 600 | Pill                       | 44 px header, 52 to 58 px hero |
| Light          | Dark surfaces  | White, 1 px gold border at 70%   | `navy`, 16 px / 700                      | Pill                       | 58 px                          |
| Dark           | Light surfaces | `navy` or `ink`                  | White, 14 to 16 px / 600 to 700          | Pill, or 8 px when compact | 48 to 52 px                    |
| Ghost          | Dark surfaces  | White at 5%, border white at 15% | White, 16 px / 600                       | Pill                       | 54 px                          |

Hover: brightness 110%, scale 1.02, light sweep. The gold gradient default is a variant in `src/components/shared/`, not an edit to `src/components/ui/`.

## Accessibility adjustments (WCAG 2.2 AA)

Anything under 4.5:1 (normal text) or 3:1 (borders, large text) was adjusted as little as possible.

| Item                                | Reference             | Contrast         | OEDF                  | Contrast   |
| ----------------------------------- | --------------------- | ---------------- | --------------------- | ---------- |
| Gold text on white, warm, gold tint | `#c9a355` / `#9a7a3a` | 2.4 / 3.6 to 4.0 | `#846932`             | 4.6 to 5.2 |
| Button text on gold gradient        | white                 | 2.1 to 3.1       | `#0b1120`             | 6.0 to 8.9 |
| Muted text on `warm`                | `#6a7282`             | 4.48             | `#646b79`             | 4.96       |
| Input border                        | `#e5e7eb`             | 1.2              | `#868e9b`             | 3.3        |
| Focus ring on light surfaces        | `#c9a355`             | 2.4              | `#0b1120`             | 18.8       |
| Success / danger chip text          | `#00a63e` / `#e7000b` | 2.9 / 3.9        | `#016630` / `#c10007` | 6.5 / 5.3  |
| Slate labels on `navy-deep`         | `#6b7a99`             | 4.4              | `#99a1af`             | 7.3        |
| Micro labels                        | 10 px                 | n/a              | 12 px minimum         | n/a        |

Unchanged because they pass: `gold` on `navy` (7.9), `ink` on `page` (17), white on `navy` (18.8), `gray-400` on `navy` (7.2). Input placeholders use `muted-foreground` (not `gray-400`, 2.6 on white).

## Logo and brand assets

| File                             | Notes                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `public/brand/logo-full.jpeg`    | 1599 x 892 stacked logo, off-white background. Artwork about 59% of width, 94% of height |
| `docs/reference/seal.jpeg`       | Seal with "Reg: 0361535 / Authorized". **Held back, not used publicly** until confirmed  |
| `docs/reference/letterhead.jpeg` | Design and contact reference only                                                        |

Missing: a transparent or SVG logo, a white version, an icon-only mark (see [open-questions.md](open-questions.md)). Rules until then: never recolor, redraw, stretch or crop a logo; on dark surfaces place it on a white rounded plate (12 px radius, plate color equal to the JPEG background); header logo 56 px high, footer 96 px; clear space equals the height of the mark.

## Section mapping

Reference home page, in order, and the OEDF equivalent. Built in Phase 3, with the exceptions in [open-questions.md](open-questions.md) (D9 to D14).

| #      | Reference section                                   | Surface             | OEDF equivalent                                                                                                                                                    |
| ------ | --------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1      | Top bar (tagline, phone, email)                     | Dark gradient       | Announcement and contact bar, managed in Settings                                                                                                                  |
| 2      | Fixed header with dropdowns and gold button         | Glass navy          | About, Departments, Programs, Admissions & Scholarships, Careers, Research, News, Contact, "Apply now"                                                             |
| 3      | Hero, 3 mini cards, photo with chips                | Dark gradient       | Mission hero. Buttons "Apply for admission or scholarship" and "Explore programs". Mini cards link to Admissions, Scholarships, Careers. Chips show impact numbers |
| 4      | Three centered value cards                          | White               | Three value statements (placeholder copy)                                                                                                                          |
| 5      | "Why choose us", four navy-circle cards             | Warm                | Governance and trust: SECP registration, accountability, transparency, scholarships                                                                                |
| 6      | Trust signals with partner and regulator logos      | White card          | Registration block with the SECP number as text. A regulator logo only if supplied                                                                                 |
| 7      | Live market snapshot (scrolling quote cards)        | Mesh                | Impact numbers from Settings _(not in the brief's table)_                                                                                                          |
| 8      | Platform guidance: checklist, photo, two buttons    | Navy-deep           | Applicant guidance: what to prepare, "Start application", "Get help"                                                                                               |
| 9      | About with photo and four check cards               | Light               | About OEDF with the CEO message teaser                                                                                                                             |
| 10     | Trading services: intro card and four service cards | White               | The four departments and their programs                                                                                                                            |
| 11     | Account opening, 4 numbered steps                   | Mesh                | "How to apply" for admissions and scholarships                                                                                                                     |
| 12     | Leadership carousel                                 | Navy-deep           | Prof. Omar Farooq and directors ("To be appointed")                                                                                                                |
| 13     | Disclaimer card                                     | Amber               | "Important notice": **not built** until confirmed                                                                                                                  |
| 14     | FAQ: intro card plus accordion                      | White card          | FAQs from the portal                                                                                                                                               |
| 15     | Market education blog carousel                      | White               | Latest research and latest news and events                                                                                                                         |
| 16     | Call-to-action band                                 | Navy, gold top line | Closing call to action                                                                                                                                             |
| 17     | Footer, five columns                                | Navy                | Logo, mission, quick links, departments, address and contact, SECP number                                                                                          |
| 18, 19 | Entry pop-up, floating call and WhatsApp            | n/a                 | **Not built** until confirmed                                                                                                                                      |

Inner pages: About, Governance (banner, alternating light sections); Departments, Programs (banner, card grids); Careers (left-aligned banner with glass card, list, detail); News, Research (banner, card grid); Contact (banner, details card plus form card); Legal (banner, narrow text column).

## Shared components

**Built in Phase 2:** `Logo` (full logo only; `isOnDark` adds the white plate), `Container`, `Section`, `PageHero`, `CtaButton` (gold and light variants), `EmptyState`, the site `Header`, `MainNav`, `MobileNav`, `TopBar`, `Footer`, `CtaBand`, `SiteShell`, and, in Phase 3, the shared `SectionHeading`, `IconCard`, `LinkCard`, `FilterChips`, `Pagination`, `DetailSection`, `FactsCard`, `ProseBlock`, `PlainTextContent`, `DraftNotice`, `BackLink`, `JsonLd`, loading skeletons, the forms in `src/components/forms/` (`TextField`, `TextareaField`, `SelectField`, `CheckboxField`, `UploadField` with progress, `ErrorSummary`, `HoneypotField`, `SubmitButton`, `FormSuccess`), `Turnstile`, and the site cards `ProgramCard`, `InstitutionCard`, `NewsCard`, `PublicationCard`, `DepartmentCard`, `ClosingCta`, and the portal `AppSidebar`, `Topbar`, `PageHeader`, `UserMenu` and `PortalShell`. **The rest are built in the phase whose screens use them** (an unused component fails Knip). Install a shadcn component only when a screen uses it, and use theme tokens only.

| Component                                                                | Purpose                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Logo`                                                                   | Every logo placement (variants full, mark, white; plate rule above)                                                                                                      |
| `Container`, `Section`, `PageHero`                                       | Page width, vertical rhythm, inner-page banner                                                                                                                           |
| `DataTable` set                                                          | Server-side paging, sorting, filters synced to URL params; `isRowHighlighted` tints rows that need attention (the row also says why in text, such as an "Overdue" badge) |
| Form fields (`TextField`, `SelectField`, `DateField`, `FileField`, …)    | React Hook Form bound to shadcn Field with label, description, error                                                                                                     |
| `FileUpload`                                                             | Signed upload straight to Cloudinary with progress and checks                                                                                                            |
| `FormattedText`                                                          | Long plain text: blank lines make paragraphs, "- " lines make bullets (no HTML stored)                                                                                   |
| `PublicImage`, `ImageFields`                                             | A record's photo on a public page (`next/image`); the portal's photo upload with its required description                                                                |
| `CheckboxListField`, `ConfirmButton`, `ArchiveButton`                    | Several choices from a list; an Alert Dialog before acting; archive or restore a record                                                                                  |
| Alert badges (`OverdueBadge`, High and Urgent `PriorityBadge`)           | Solid `bg-destructive` with white text: the light red badge fails 4.5:1 at badge size                                                                                    |
| `ExportCsvButton`                                                        | An outline button-styled link that downloads the list as it is filtered and sorted                                                                                       |
| `ComboboxField` (shadcn Popover + Command)                               | Pick an existing value or add a new one by typing it, such as an FAQ topic, so spelling stays consistent                                                                 |
| `StatusBadge`, `ConfirmDialog`, `EmptyState`, `SearchInput`, `Turnstile` | Status to label and color; destructive confirm; empty list; debounced search; spam check                                                                                 |
| Site: `Header`, `MainNav`, `MobileNav`, `Footer`, `TopBar`, `CtaBand`    | Public layout                                                                                                                                                            |
| Portal: `AppSidebar`, `Topbar`, `PageHeader`, `UserMenu`, `StatCard`     | Staff layout                                                                                                                                                             |

Reuse rules: search before creating; extend with props or `cva` variants; navigation is defined once in `src/lib/constants/`; icons only from `lucide-react`; `next/image` with explicit sizes and real alt text.
