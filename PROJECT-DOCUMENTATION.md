# GSO-PMS — Property Management System
### Technical Documentation

Prepared by Gabriel Sacro, developer, for the GSO-PMS capstone team (Angel Jisrill P., Cuizon Jerriel L., Loy Loy Jun Rey M., Ganzan Christopher A.) — BS Information Technology, University of Science and Technology of Southern Philippines, Villanueva Campus.

This document explains what I built, why I built it this way, and how every major piece of it works, using the actual file and function names in the codebase. It's written so any of you can read it once and then field questions about the system in your own words — you don't need to memorize this, you need to understand it well enough to explain it.

---

## 1. Tech Stack, Named and Justified

Here is every language, framework, and library actually used in this project, by exact name.

**Languages**

- **TypeScript** — the language almost the entire codebase is written in. TypeScript is JavaScript with an added type-checking layer: you write normal JavaScript, plus optional type annotations, and a compiler checks your code is internally consistent *before* it ever runs. Every `.ts` and `.tsx` file in `src/` is TypeScript.
- **JavaScript** — what TypeScript compiles down to. The browser never sees TypeScript directly; the Next.js build process strips the types and emits plain JavaScript, which is the only language a web browser can execute natively.
- **SQL** — used directly for the database schema, Row Level Security policies, and helper functions, all written in PostgreSQL's dialect of SQL (see Section 5).
- **CSS** — styling, almost entirely written as Tailwind utility classes (see below), with a small amount of hand-written CSS in `src/app/globals.css` for theme variables and print rules.
- **HTML** — never hand-written as `.html` files. Every screen is written as JSX/TSX (HTML-like syntax embedded directly in TypeScript), which React and Next.js compile into real HTML sent to the browser.

**Is Java used anywhere? No.** But that question actually bundles three different things together, and it's worth pulling them apart before answering it:

- **Java** — a general-purpose programming language used for things like Android apps, enterprise backend systems, and desktop software.
- **JavaScript** — the only programming language a web browser can run directly — it's what makes a webpage interactive.
- **TypeScript** — JavaScript with an extra layer added on top that checks the code for mistakes before it ever runs.

Here's the clean way I'd actually say it out loud: this project is written in TypeScript, but it runs as JavaScript. TypeScript is just JavaScript with type-checking added on top — think of it as JavaScript with a spellchecker built in, catching mistakes while I'm writing instead of after a user hits an error. Once the project is built, that type-checking layer disappears, and what's left is ordinary JavaScript — the same language every browser runs. Java, on the other hand, has nothing to do with any of this — it's a completely different language for a completely different kind of job, and the two only share part of a name because of a 1995 marketing decision, nothing technical. There's no Java file, no JVM, and no Android component anywhere in this project.

**Framework**

- **Next.js 16.2.12** — the application framework. It handles routing, server-side rendering, the build process, and the bundler (Next 16 uses **Turbopack** by default instead of the older Webpack).
- **React 19.2.4** (with `react-dom` 19.2.4) — the UI library Next.js is built on. Every screen is a tree of React components.

**Backend / Database**

- **Supabase** — a hosted backend platform built on top of **PostgreSQL 17**. It provides the database itself, user authentication (Supabase Auth), and file storage (Supabase Storage). There is no separate custom backend server in this project — Supabase *is* the backend.
- **`@supabase/supabase-js`** (^2.112.0) and **`@supabase/ssr`** (^0.12.4) — the official client libraries used to talk to Supabase from both the browser and the Next.js server, with `@supabase/ssr` specifically handling cookie-based sessions so login state survives page reloads and server-rendered pages.

**Key libraries**

- **`radix-ui`** (^1.6.7) — accessible, unstyled UI primitives (dialogs, dropdowns, tooltips, the sidebar) that handle keyboard navigation, focus trapping, and screen-reader behavior correctly out of the box. This project's component library is generated via **shadcn** (`shadcn` ^4.16.1, the CLI tool — not a runtime dependency, it's how the `src/components/ui/*` files were scaffolded), configured with the "radix-nova" style in `components.json`.
- **`qrcode`** (^1.5.4) — generates the QR codes used on asset tags and stickers.
- **`html5-qrcode`** (^2.3.8) — reads QR codes back using a device camera, used in the Scan-to-Verify feature.
- **`lucide-react`** — the icon set used throughout the interface.
- **`sonner`** — the toast notification library (the small "Saved." / "Deleted." pop-ups after an action).
- **`tailwind-merge`**, **`clsx`**, **`class-variance-authority`** — small utilities for combining and conditionally applying CSS class names cleanly, used inside almost every component via the shared `cn()` helper in `src/lib/utils.ts`.
- **`tailwindcss`** v4 and **`tw-animate-css`** — the styling system and its animation utilities.
- **`next-themes`** — only used inside `src/components/ui/sonner.tsx` to pass a theme preference to the toast library. Worth being upfront about: this project doesn't currently expose a light/dark mode toggle to users, so it's a small unused hook left over from the shadcn scaffold rather than a deliberately built feature.
- **`server-only`** — a guard package that causes a build error if server-only code (like `src/lib/supabase/admin.ts`, which holds a secret key) is ever accidentally imported into browser-facing code.

**Tooling**

- **ESLint 9** (`eslint-config-next`) — lints the code for correctness and consistency during development and build.
- **TypeScript 5** — the compiler/type-checker itself.
- **Turbopack** — Next.js 16's default bundler, replacing Webpack for faster local development and builds.

**Hosting & infrastructure**

- **Vercel** — hosts the deployed application and rebuilds it automatically on every push to GitHub.
- **GitHub** — source control (`github.com/gmaxuw/GSO-PMS`), the single history of every change made to the codebase.
- **Supabase Cloud** — hosts the PostgreSQL database, authentication service, and file storage buckets (project region: `ap-south-1`, Postgres 17.6).

---

## 2. Why This Stack

The thesis's own Chapter 3 already specifies something closer to a small enterprise records system than a brochure website: an 11-plus-table relational schema, role-based access (Administrator vs. Property Custodian), a physical document trail (PAR/ICS receipts), and compliance reporting (RPCPPE). That shape of problem — structured, relational, permissioned, transactional — is what dictated every tool choice below. None of this was picked for résumé value; each choice maps to a specific requirement.

**Why Next.js instead of plain HTML/CSS/JavaScript, or a traditional CMS like WordPress**

Hand-written HTML/PHP/vanilla-JS means every page re-implements its own form validation, its own database queries, and its own authentication checks, usually copy-pasted from the last page that needed the same thing. That's slow to build correctly and easy to get subtly wrong — unvalidated database queries are one of the most common vulnerabilities in exactly this kind of small custom PHP project. A CMS like WordPress solves a different problem: publishing content (pages, posts). Bending it into a transactional records system with role permissions and linked tables means stacking plugins on top of a tool that wasn't built for it, which is its own well-known source of security holes.

Next.js is built for applications, not documents. Every screen in this system — the asset registry, the receipt printer, the QR sticker sheet — is assembled from the same small set of reusable components (`Button`, `Dialog`, `Table`, `AssetFormDialog`, and so on). Fix a bug or change a design once, and it's fixed everywhere that component is used, instead of hunting through dozens of duplicated template files.

**Why TypeScript specifically, not just JavaScript**

TypeScript catches a category of mistakes — a typo in a database column name, passing a string where a number was expected — at build time, before the code ever reaches a browser. Concretely: `src/lib/supabase/database.types.ts` is generated directly from the real Supabase schema, so every `supabase.from("assets").select(...)` call in the codebase is checked against the actual columns that exist in the `assets` table. If someone renames a column in the database and forgets to update a query, the project fails to build instead of silently breaking in front of a user.

**Why Supabase instead of a hand-rolled MySQL/PHP backend, or a NoSQL service like Firebase**

The thesis's data dictionary is explicitly relational — assets belong to categories, get assigned to officers, generate linked PAR/ICS records. That's a natural fit for PostgreSQL's foreign keys and joins, and a poor fit for a document database like Firebase, which would have meant fighting the shape of the team's own design. Supabase gives a full, free-tier hosted Postgres database with three things a from-scratch backend would otherwise need to be built by hand: **Row Level Security** (permission rules enforced by the database itself, not just by the website — see Section 5), **Supabase Auth** (so this codebase never has to store or hash a password itself), and **Supabase Storage** (for officer/team photos and branding uploads).

**Why Vercel for hosting**

Traditional shared hosting (the typical cPanel/FTP setup) runs on one server with no built-in rollback — if a bad file gets uploaded, someone has to notice and manually re-upload the old one. Vercel rebuilds and republishes the site automatically on every push to GitHub, usually within about a minute, with HTTPS included by default and one-click rollback to the previous working deployment if something breaks. For a team without a dedicated ops person, that's meaningfully less to maintain by hand.

**Why Tailwind CSS + shadcn/Radix instead of hand-rolled CSS or a component kit like Bootstrap**

Tailwind keeps styling co-located with the markup instead of in separate stylesheets that drift out of sync with what's actually on the page, and the design tokens in `src/app/globals.css` (colors defined as CSS variables in the OKLCH color space) keep the whole interface visually consistent. Radix primitives (wrapped by the shadcn-generated components in `src/components/ui/`) handle correct keyboard navigation, focus trapping, and screen-reader labeling for things like dialogs and dropdowns — behavior that's genuinely easy to get wrong by hand and that a generic component kit like Bootstrap doesn't guarantee out of the box.

**Is any of this actually free, long-term?**

Yes, as scoped from day one: GitHub, Vercel, and Supabase are all being used on their free tiers. There's a transparent upgrade path if the LGU's real usage ever outgrows those limits, but nothing about the architecture requires a rebuild to scale — it's the same code, just on a paid tier of the same three services.

---

## 3. Full Project Tree, Explained

```
JerrielCuizonInventory/
├── AGENTS.md, CLAUDE.md          # Editor/tooling notes for this specific Next.js version
├── README.md                     # Standard create-next-app boilerplate readme
├── components.json               # shadcn config: which style, which folders components generate into
├── eslint.config.mjs             # Lint rules
├── next.config.ts                # Next.js config (see below)
├── package.json                  # Dependency list and npm scripts (dev/build/start/lint)
├── postcss.config.mjs            # Required by Tailwind v4's build pipeline
├── tsconfig.json                 # TypeScript compiler settings, incl. the "@/*" import alias
├── public/                       # Static files served as-is
│   ├── brand/                    # Logo source files (black/blue, PNG + SVG)
│   └── *.svg                     # Default create-next-app placeholder icons (unused in the UI)
└── src/
    ├── proxy.ts                  # Session refresh + route protection, runs on every request
    ├── app/                      # Next.js App Router — one folder per URL route
    │   ├── layout.tsx            # Root HTML shell, fonts, dynamic favicon
    │   ├── page.tsx               # Public homepage ("/")
    │   ├── globals.css            # Tailwind entrypoint + theme color variables
    │   ├── icon.svg, apple-icon.png   # Fallback favicons
    │   ├── api/reports/assets/route.ts  # CSV export endpoint
    │   ├── login/                 # "/login"
    │   └── dashboard/             # Everything behind login, one subfolder per feature
    ├── components/                # Reusable UI building blocks
    │   └── ui/                    # shadcn/Radix primitives (Button, Dialog, Table, Sidebar, ...)
    ├── hooks/                     # Small reusable React hooks
    └── lib/                       # Non-UI logic: formatting, Supabase clients, QR/image helpers
```

**`next.config.ts`** — deliberately almost empty. Its one real setting, `images.remotePatterns`, allow-lists the project's Supabase Storage domain so Next's built-in `<Image>` component (used for team photos) is allowed to load and optimize images hosted there.

**`src/proxy.ts`** — in Next.js 16, the file previously called `middleware.ts` (with a `middleware()` export) was renamed to `proxy.ts` (with a `proxy()` export). Functionally it's the same mechanism: a function that runs before almost every request. This one does two things — refreshes the Supabase session cookie on each request (so a logged-in user doesn't get silently logged out), and redirects: anyone unauthenticated trying to reach `/dashboard/*` gets bounced to `/login`, and anyone already logged in who lands on `/login` gets sent straight to `/dashboard`.

**`src/app/layout.tsx`** — the root HTML wrapper every page renders inside. It loads the Geist font family, wraps the app in a `TooltipProvider` and a `Toaster` (so any page can pop a toast notification), and its `generateMetadata()` function checks the `site_settings` table for a custom favicon uploaded by an admin, falling back to the static `icon.svg`/`apple-icon.png` files if none was set.

**`src/app/page.tsx`** — the public homepage. Fetches `team_members` and `site_settings` directly from Supabase (no login required — see the RLS policies in Section 5) and renders the hero section plus one `TeamMemberCard` per row.

**`src/app/login/`** — `page.tsx` is the sign-in form (a Client Component using `useActionState`); `actions.ts` holds the `login()` Server Action that calls `supabase.auth.signInWithPassword()`.

**`src/app/dashboard/`** — every authenticated screen, one subfolder per feature area. Each feature folder follows the same two-file pattern: a `page.tsx` (a Server Component that fetches data and renders the screen) and an `actions.ts` (Server Actions — functions marked `"use server"` that run only on the server and handle every insert/update/delete for that feature):

- `layout.tsx` — wraps every dashboard page with `requireUser()`, the sidebar (`AppSidebar`), and the top bar.
- `page.tsx` (dashboard root) — the KPI overview screen.
- `actions.ts` (dashboard root) — just the `logout()` action.
- `assets/` — the Property Asset Registry, plus `assets/[id]/` (single-asset detail view) and `assets/[id]/sticker/` (printable QR sticker sheet) and `assets/scan/` (camera/manual Scan-to-Verify page).
- `movements/` — Movement & Issuance log and the New Issuance/Return form.
- `officers/` — Accountable Officers CRUD.
- `disposal/` — Disposal & Write-off registry.
- `expiry/` — Expiry & Lifecycle Tracker.
- `alerts/` — the alerts inbox.
- `records/` — the combined PAR/ICS registry, plus `records/par/[id]/` and `records/ics/[id]/`, the actual printable receipt templates.
- `reports/` — the Reports landing page, plus `reports/rpcppe/`, the printable compliance report.
- `settings/` — admin-only: Staff Accounts, Categories, Offices, Homepage Team, and Branding, all as tabs on one page.

**`src/app/api/reports/assets/route.ts`** — the one plain HTTP API route in the project (as opposed to a Server Action). It's a `GET` handler because a CSV download needs to be a real URL a browser can navigate/download from (`<a href="/api/reports/assets" download>`), which a Server Action can't do directly.

**`src/components/`** — shared building blocks used across multiple pages: form dialogs (`AssetFormDialog`, `MovementFormDialog`, `OfficerFormDialog`, `DisposalFormDialog`, `CategoryFormDialog`, `OfficeFormDialog`, `TeamMemberFormDialog`, `CreateStaffDialog`), small action buttons (`DeleteButton`, `PrintButton`, `ApproveDisposalButton`, `AlertActions`, `SendNotificationsButton`, `UserRowActions`), display components (`StatusBadge`, `StatCard`, `PhotoLightbox`, `SiteLogo`, `TeamMemberCard`), and the two components that do real work beyond forms: `ImageUploadField` (photo upload + compression, used everywhere a photo is needed) and `AssetScanner` (the camera-based QR reader).

**`src/components/ui/`** — the shadcn-generated primitives (`button.tsx`, `dialog.tsx`, `table.tsx`, `sidebar.tsx`, `select.tsx`, `tabs.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `badge.tsx`, `avatar.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `sonner.tsx`, `tooltip.tsx`, `alert.tsx`). These are the accessible low-level pieces everything else is built from.

**`src/hooks/`** — `use-form-success.ts` defines `FormActionState` (the shared shape every Server Action's result follows) and `useFormSuccessEffect()` (fires a success toast and closes a dialog when a form submission succeeds). `use-mobile.ts` defines `useIsMobile()`, used by the sidebar to switch to a mobile-friendly collapsed layout.

**`src/lib/`** — non-visual logic:
- `format.ts` — date/currency formatting (`formatDate`, `formatCurrency`) and day-math helpers (`daysUntil`, `daysSince`, `isoDaysFromNow`, `todayIso`) used by the Expiry Tracker and alert generation.
- `qrcode.ts` — `generateQrDataUrl()`, wraps the `qrcode` package to turn an asset code into an embeddable image.
- `image-compress.ts` — `compressToWebp()`, converts any uploaded photo to a compressed WebP image in the browser before it's uploaded.
- `utils.ts` — `cn()`, the standard shadcn class-name-merging helper.
- `supabase/client.ts` — creates a Supabase client for use in the browser (Client Components).
- `supabase/server.ts` — creates a Supabase client for use on the server (Server Components/Actions), wired to Next's cookie store.
- `supabase/admin.ts` — a separate, more powerful Supabase client that uses the secret service-role key and bypasses Row Level Security entirely. Marked `import "server-only"` so it can never accidentally end up in browser code, and only ever called after `requireAdmin()` has already run (used exclusively by `createStaffAccount`, to create a new login without requiring the new user to confirm an email first).
- `supabase/auth.ts` — `getCurrentProfile()`, `requireUser()`, `requireAdmin()`: the functions every protected page and admin-only action calls first.
- `supabase/database.types.ts` — auto-generated TypeScript types matching the live database schema exactly (see Section 1).

---

## 4. Architecture & Data Flow

The overall pattern is: **Server Components fetch data directly from the database when a page loads; Server Actions handle every write.** There is deliberately no separate hand-written REST or GraphQL API layer sitting between the pages and the database for normal CRUD — Next.js Server Actions *are* that layer, auto-generated from ordinary-looking async functions.

**General request lifecycle**

1. A browser requests a page, e.g. `/dashboard/assets`.
2. `src/proxy.ts` runs first: refreshes the session cookie, and redirects to `/login` if there's no logged-in user.
3. The matching `page.tsx` (a Server Component, so this code runs only on the server, never shipped to the browser) calls `requireUser()` from `src/lib/supabase/auth.ts`, then queries Supabase directly — e.g. `supabase.from("assets").select("*, categories(category_name), offices:assigned_office_id(office_name)")` in `src/app/dashboard/assets/page.tsx`.
4. Postgres evaluates that query against the requesting user's session, applying Row Level Security automatically (Section 5) — the query only succeeds because the logged-in user's `profiles` row satisfies `is_active_user()`.
5. The Server Component renders straight to HTML on the server and sends that HTML to the browser. Client Components inside it (marked `"use client"`, like `AssetFormDialog`) then hydrate to become interactive.
6. When a user submits a form, the browser doesn't send a `fetch()` call to a hand-written API route — it calls a Server Action directly (a function imported from an `actions.ts` file, wired to the form via `<form action={formAction}>` and React's `useActionState` hook). Next.js handles turning that into a network request/response behind the scenes.
7. The Server Action re-validates permissions (`requireUser()` or `requireAdmin()` again — never trusting that the UI already checked), writes to Supabase, then calls `revalidatePath()` to tell Next.js "the data behind this URL is now stale."
8. Next.js discards its cached render for that path; the next time it's viewed, step 3 runs again with fresh data.

**What steps 2 and 3 actually look like in code**

Every protected page starts with one of these two, from `src/lib/supabase/auth.ts`. In plain terms: `requireUser()` checks there's a logged-in profile and that it hasn't been deactivated — if either check fails, it redirects to the login page before rendering anything. `requireAdmin()` reuses that same check and adds one more on top: if the profile's role isn't admin, it sends them back to the regular dashboard instead. I call whichever one a page actually needs at the very top of the file, before any data gets fetched.

```ts
export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    redirect("/login");
  }
  return profile;
}

export async function requireAdmin() {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }
  return profile;
}
```

- **`async function requireUser()`** — marked `async` because it calls `getCurrentProfile()` inside, which is itself a database lookup and needs `await`.
- **`if (!profile || profile.status !== "active")`** — the `||` means either condition alone is enough to fail the check: no profile at all, or a profile that exists but has been deactivated. `!==` reads as "not equal to."
- **`redirect("/login")`** — a Next.js function that immediately stops the rest of this function from running and sends the browser to a different page. Nothing after this line executes once it's called.
- **`requireAdmin()` calling `await requireUser()`** — reuses the exact same check instead of duplicating it, then only adds the extra role check on top.

And this is the real query behind the Property Asset Registry — not a simplified stand-in — from `src/app/dashboard/assets/page.tsx`. In plain terms: same `*` and nested-relation trick as before, plus two more pieces: `offices:assigned_office_id(office_name)` renames that joined relation to `offices` so the rest of the code can just write `asset.offices.office_name`, and `.order()` sorts newest assets first before anything is even rendered.

```ts
let query = supabase
  .from("assets")
  .select("*, categories(category_name), offices:assigned_office_id(office_name)")
  .order("created_at", { ascending: false });
```

- **`let query = ...`** — `let`, not `const`, on purpose this time — a few lines below this (not shown here), the code conditionally adds more filters onto `query` depending on which filters the user picked, so it genuinely does get reassigned.
- **`offices:assigned_office_id(office_name)`** — the part before the colon (`offices`) is a rename, same idea as `data: assets` from the login example — Supabase would otherwise name this joined relation something less friendly, based on the foreign key column.
- **`.order("created_at", { ascending: false })`** — sorts by the `created_at` column, `ascending: false` meaning newest first.

**Concrete example: adding a new asset**

`AssetFormDialog` (`src/components/asset-form-dialog.tsx`) is a Client Component holding the "Add Asset" dialog. Submitting it calls `createAsset` (`src/app/dashboard/assets/actions.ts`), which:
1. Confirms a session exists via `requireUser()`.
2. Runs `parseAssetForm()` to pull typed fields out of the raw `FormData` (converting empty strings to `null` for optional fields, so a blank "Serial Number" is stored as an actual empty value rather than the literal text `""`).
3. Inserts the row: `supabase.from("assets").insert(parsed)`.
4. Calls `revalidatePath("/dashboard/assets")` and `revalidatePath("/dashboard")`.
5. Returns `{ success: true }`, which `useFormSuccessEffect` (in `src/hooks/use-form-success.ts`) picks up to close the dialog and fire a "Asset added to the registry." toast.

**Concrete example: issuing an asset and generating a PAR**

This is the flow the original thesis screens didn't fully cover on their own, and the one I extended most deliberately (see Section 6). `MovementFormDialog` calls `createMovement` (`src/app/dashboard/movements/actions.ts`), which:
1. Inserts a new row into `asset_assignments` (who has the asset now, which office, what status).
2. Updates the asset's own `assigned_office_id` so its current custody stays in sync.
3. If the transaction type is "Issued" or "Transferred" *and* an officer was selected, it auto-generates the linked document: an insert into either `par_records` or `ics_records`, with an auto-numbered doc number like `PAR-2026-0007` (`PAR-${year}-${assignment_id padded to 4 digits}`), and a foreign key (`assignment_id`) tying that receipt back to the exact transaction that created it.
4. That receipt is immediately viewable and printable at `/dashboard/records/par/[id]` — a plain server-rendered page (`src/app/dashboard/records/par/[id]/page.tsx`) styled to look like an official PAR form, with a `PrintButton` that just calls `window.print()`.

**The actual `createMovement` code**, from `src/app/dashboard/movements/actions.ts`:

```ts
export async function createMovement(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const supabase = await createClient();

  const assetId = Number(formData.get("asset_id"));
  const officerId = formData.get("officer_id")
    ? Number(formData.get("officer_id"))
    : null;
  const officeId = formData.get("office_id")
    ? Number(formData.get("office_id"))
    : null;
  const status = formData.get("status") as "issued" | "returned" | "transferred";
  const assignedDate = formData.get("assigned_date") as string;
  const remarks = (formData.get("remarks") as string) || null;
  const docType = formData.get("doc_type") as "par" | "ics" | "";

  const { data: assignment, error } = await supabase
    .from("asset_assignments")
    .insert({
      asset_id: assetId,
      officer_id: officerId,
      office_id: officeId,
      status,
      assigned_date: assignedDate,
      returned_date: status === "returned" ? assignedDate : null,
      remarks,
    })
    .select("assignment_id")
    .single();

  if (error || !assignment) {
    return { error: error?.message ?? "Failed to record transaction." };
  }

  // Keep the asset's current custody in sync with the latest movement.
  await supabase
    .from("assets")
    .update({ assigned_office_id: status === "returned" ? null : officeId })
    .eq("asset_id", assetId);

  if ((status === "issued" || status === "transferred") && docType && officerId) {
    const year = new Date(assignedDate).getFullYear();
    if (docType === "par") {
      await supabase.from("par_records").insert({
        par_no: `PAR-${year}-${String(assignment.assignment_id).padStart(4, "0")}`,
        asset_id: assetId,
        officer_id: officerId,
        assignment_id: assignment.assignment_id,
        issue_date: assignedDate,
        remarks,
      });
    } else {
      await supabase.from("ics_records").insert({
        ics_no: `ICS-${year}-${String(assignment.assignment_id).padStart(4, "0")}`,
        asset_id: assetId,
        officer_id: officerId,
        assignment_id: assignment.assignment_id,
        issue_date: assignedDate,
        remarks,
      });
    }
  }

  revalidatePath("/dashboard/movements");
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard/records");
  revalidatePath("/dashboard");
  return { success: true };
}
```

In plain terms: this runs every time someone records an issuance, return, or transfer. I insert the new `asset_assignments` row first, then immediately update the asset's own current custody so the registry always reflects the latest movement. If it was an issuance or transfer to a named officer, I auto-generate the matching PAR or ICS receipt with a document number built from the year and the assignment's own ID — so the numbering is automatic and can never collide. At the end I tell Next.js which pages just went stale, so they reload with fresh data the next time anyone views them.

- **`_prevState`** — the leading underscore is a naming convention meaning "this parameter is required by `useActionState`'s function signature, but I don't actually use it in this function."
- **`formData.get("officer_id") ? Number(...) : null`** — a ternary: "if this value exists, convert it to a number; otherwise use `null`." Shorter than a full if/else for a one-line decision.
- **`status === "returned" ? assignedDate : null`** — same ternary pattern, deciding what to store in `returned_date` based on the transaction type.
- **`` `PAR-${year}-${String(assignment.assignment_id).padStart(4, "0")}` ``** — a template literal — backticks let me drop live values directly into a string with `${ }` instead of gluing pieces together with `+`. `.padStart(4, "0")` pads the number with leading zeros until it's 4 digits long, so `7` becomes `"0007"`.
- **`error?.message ?? "Failed to record transaction."`** — two things stacked. `error?.message` is optional chaining: if `error` happens to be `null` or `undefined`, the whole expression short-circuits instead of crashing on `.message`. `??` is nullish coalescing: if what's on the left is `null` or `undefined`, use the fallback text on the right.
- **`(status === "issued" || status === "transferred") && docType && officerId`** — reads left to right: only proceed past this line if the status is one of those two, AND a document type was picked, AND an officer is actually attached to this transaction.

**Concrete example: uploading a photo**

`ImageUploadField` (`src/components/image-upload-field.tsx`) is used for officer photos, team member photos, and branding. When a file is picked: `compressToWebp()` (`src/lib/image-compress.ts`) resizes and re-encodes it to WebP in the browser using the Canvas API, then the browser-side Supabase client (`src/lib/supabase/client.ts`) uploads the compressed file straight to Supabase Storage. The component stores the resulting public URL in a hidden `<input type="hidden">`, so it rides along with the rest of the form's normal submission — the Server Action that eventually runs (`createOfficer`, `updateTeamMember`, `updateSiteBranding`, etc.) just sees a `photo_url` string field like any other, with no separate upload-handling code needed on the server side at all.

---

## 5. Database & Security, Explained Plainly

**What's used.** The database is a hosted **PostgreSQL 17** instance provided by **Supabase** (project region `ap-south-1`). There is no separate application server holding business logic outside of Next.js — Supabase provides the database, the authentication service, and file storage as one connected platform.

**The schema — 13 tables**, matching (and slightly extending) the thesis's own data dictionary:

| Table | Holds |
|---|---|
| `profiles` | Extends Supabase's built-in `auth.users` with `role` (`admin`/`staff`) and `status` (`active`/`inactive`) |
| `categories` | Asset categories (ICT Equipment, Furniture, etc.) |
| `offices` | Municipal departments |
| `accountable_officers` | Personnel who can be issued custody of an asset, including a mandatory photo |
| `assets` | The core property registry |
| `asset_assignments` | The issuance/return/transfer history for each asset |
| `par_records` | Property Acknowledgement Receipts, linked to the assignment that generated them |
| `ics_records` | Inventory Custodian Slips, same pattern |
| `maintenance` | Service/repair history per asset |
| `disposal` | Disposal & write-off records |
| `alerts` | Generated warranty/useful-life/maintenance notifications |
| `team_members` | The public homepage's team profiles (not part of the original thesis schema — added for the homepage requirement) |
| `site_settings` | A single-row table holding the uploaded logo/favicon URLs |

**Is Row Level Security enabled?** Yes — on all 13 tables, with no exceptions. This means permission rules are enforced *inside Postgres itself*, not only inside this codebase. Even a request that somehow bypassed the Next.js app entirely and hit the database directly would still be subject to these same rules, because Postgres checks them on every single query.

Two small SQL helper functions do the actual permission checking, and every policy in the database is built on top of them:

```sql
create function is_active_user() returns boolean
  language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'active'
  );
$$;

create function is_admin() returns boolean
  language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'active'
  );
$$;
```

In plain terms: these are the two functions every RLS policy in this database is built on. Both do the same basic thing — look up the currently logged-in user's own row in `profiles` and check something about it. `is_active_user()` just checks `status = 'active'`. `is_admin()` checks that plus `role = 'admin'`. Postgres runs one of these, silently, on every single query the app makes to a protected table.

- **`returns boolean`** — this function always answers true or false, nothing else.
- **`security definer`** — normally a database function runs with the permissions of whoever's calling it. `security definer` means it instead runs with the permissions of whoever created it — necessary here because it needs to read the `profiles` table, and I don't want to separately grant every user direct read access to that table just so this check can work.
- **`auth.uid()`** — a built-in Supabase function returning the ID of whoever is currently authenticated, based on their session — how the database knows who's asking without the application having to pass that in manually.
- **`exists (select 1 from ...)`** — a standard SQL pattern for "does at least one matching row exist," without caring what's in it — `select 1` is a placeholder, not a real column, since `exists` only checks whether the subquery returns anything at all.
- **`where id = (select auth.uid()) and status = 'active'`** — both conditions have to be true for a row to count: the profile's own id has to match the logged-in user, and their status has to be active.

`is_active_user()` is true for anyone logged in whose account hasn't been deactivated; `is_admin()` additionally requires `role = 'admin'`. Almost every table in the system follows the same pattern using these two functions:

- **Everyday operational tables** (`assets`, `accountable_officers`, `asset_assignments`, `alerts`, `maintenance`, `par_records`, `ics_records`, `disposal`): any active user (Staff or Admin) can `SELECT`/`INSERT`/`UPDATE`, e.g. policy `"active users read assets"` (`SELECT`, condition `is_active_user()`) and `"active users write assets"` (`INSERT`, condition `is_active_user()`). Only an Admin can `DELETE` — e.g. `"admin delete assets"` (`DELETE`, condition `is_admin()`). This matches the thesis's own role split: Staff/Property Custodians handle day-to-day recording, but only Administrators can permanently remove a record.
- **Reference tables** (`categories`, `offices`): any active user can read them (needed for dropdowns throughout the app), but only an Admin can create, edit, or delete them — e.g. `"admin write categories"` (`INSERT`, condition `is_admin()`).
- **`profiles`** is a special case: policy `"view own or admin view all profiles"` (`SELECT`, condition `(id = auth.uid()) OR is_admin()`) means a user can always see their own account, and Admins can see everyone's; `"admin update all profiles"` (`UPDATE`, condition `is_admin()`) means only Admins can change anyone's role or status. There is deliberately **no `INSERT` policy at all** on `profiles` — new rows are never created by a client request. Instead, a database trigger (`on_auth_user_created`, firing `handle_new_user()`) automatically creates the matching `profiles` row the instant a new `auth.users` row is created, running with elevated (`security definer`) privileges that bypass RLS entirely:

  ```sql
  create function handle_new_user() returns trigger
    language plpgsql security definer set search_path to 'public' as $$
  begin
    insert into public.profiles (id, email, full_name, role)
    values (new.id, new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      coalesce(new.raw_user_meta_data->>'role', 'staff'));
    return new;
  end;
  $$;
  ```

  In plain terms: this fires automatically the instant a new row shows up in Supabase's own `auth.users` table — meaning the instant someone new signs up or gets created by `createStaffAccount`. It's the only thing that's ever allowed to insert into `profiles`, and it fills in the name and role from whatever metadata was passed in at account-creation time, falling back to sensible defaults if that metadata wasn't provided.

  - **`returns trigger`** — this isn't a function I call directly — it's shaped specifically to run automatically in response to a database event (a trigger), a different kind of function in Postgres.
  - **`new.id`, `new.email`** — inside a trigger, `new` refers to the row that was just inserted — here, the brand-new `auth.users` row. `new.id` is that user's freshly-created ID.
  - **`coalesce(new.raw_user_meta_data->>'full_name', new.email)`** — `coalesce()` returns the first value here that isn't null. `->>'full_name'` reads the `full_name` key out of a JSON column. So this line says: use the full name if one was provided, otherwise fall back to their email address.
  - **`coalesce(..., 'staff')`** — same pattern, but the fallback is a plain literal: if no role was specified, default to `'staff'` rather than `'admin'` — a deliberate least-privilege default.

- **`team_members` and `site_settings`** have public, no-login-required read access — policies `"anyone can read team members"` and `"anyone can read site settings"` (both `SELECT`, condition simply `true`) — because the homepage that displays them is public. Writing to either still requires `is_admin()`.

**File storage security** follows the same idea. There are three public Storage buckets — `team-photos`, `officer-photos`, `branding` — all readable by anyone (so `<img>` tags on the public homepage work without authentication), but every `INSERT`/`UPDATE`/`DELETE` policy on `storage.objects` checks `bucket_id = '<name>' AND (is_active_user() OR is_admin())` depending on the bucket, matching who's allowed to edit that kind of record in the database.

**Is any data pre-filled/seeded, versus created dynamically by users?** Two small reference tables were seeded once, directly in Supabase, to match the offices and categories already named in the thesis's own mockups and never needed a UI to create them: `categories` (5 fixed rows — ICT Equipment, Furniture, Motor Vehicle, Machinery, Other Assets) and `offices` (7 fixed rows — Mayor's Office, Civil Registry, Budget Office, Admin Office, MIS Office, GSO Warehouse, Motor Pool). There is no seed script file in the repository; this was a one-time setup step, and both tables remain fully editable afterward from Settings by an Admin. Every other table — `assets`, `accountable_officers`, `asset_assignments`, `par_records`, `ics_records`, `maintenance`, `disposal`, `alerts`, `team_members`, `site_settings`, and the two bootstrap `profiles` accounts — was created through the application's own forms, the same way any future real user would create them. Nothing about the live demo data is hard-coded into the app's code.

**How authentication works.** Login is plain email + password via **Supabase Auth** (`supabase.auth.signInWithPassword()` in `src/app/login/actions.ts`) — no third-party login (Google, Facebook, etc.) and, deliberately, **no public self-registration route**. The only way a new account gets created is an Admin using `createStaffAccount` in Settings, which calls `supabase.auth.admin.createUser()` through the service-role client in `src/lib/supabase/admin.ts`. Session state is a secure, httponly cookie managed by `@supabase/ssr` — `src/proxy.ts` refreshes it on every request, and `src/lib/supabase/server.ts`/`client.ts` read it to know who's asking. Passwords themselves are never touched, hashed, or stored by this codebase at all — that's entirely handled inside Supabase Auth, which is a dedicated, audited identity provider rather than something built from scratch here. Two layers double-check permissions on every protected action: the route-level check in `proxy.ts`, and a second, independent check inside the page/action itself via `requireUser()`/`requireAdmin()` (`src/lib/supabase/auth.ts`) — the comment in that file is explicit about why: *"proxy.ts route matching alone is not sufficient."* Even if a route pattern were ever misconfigured, the server action itself still refuses to run for the wrong role.

**`createStaffAccount`, the one function that intentionally bypasses RLS.** From `src/app/dashboard/settings/actions.ts`:

```ts
export async function createStaffAccount(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireAdmin();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it to .env.local (get it from Supabase Dashboard > Project Settings > API Keys) to enable account creation.",
    };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
```

In plain terms: this is the only place in the entire codebase that creates a new login, and it's the one place that intentionally reaches for a more powerful client than everything else uses. `requireAdmin()` runs first, so only an admin ever gets this far. Then, instead of the normal Supabase client every other action uses — the one RLS applies to — this calls `createAdminClient()`, which authenticates with a secret service-role key instead of a user session and is allowed to bypass Row Level Security entirely. That's necessary here specifically because creating a brand-new login isn't something a logged-in user's own permissions should ever be able to do on their own.

- **`!process.env.SUPABASE_SERVICE_ROLE_KEY`** — `process.env` is how server-side code reads environment variables/secrets. The `!` checks "if this is missing" — a guard so the app fails with a clear message instead of a confusing crash if that secret was never configured on the server.
- **`user_metadata: { full_name: fullName, role }`** — building an object literal inline. `role` by itself (no colon) is shorthand for `role: role` — when a property name and the variable holding its value are spelled the same, JavaScript lets you skip repeating it.
- **`admin.auth.admin.createUser(...)`** — the service-role-only method that actually creates the login — this is what ultimately triggers `handle_new_user()` above, since it inserts into `auth.users` under the hood.

**How an RLS check actually happens — two independent gates.** This is the part that's easy to say in one sentence but hard to actually picture: the app-level checks from Section 4 and the database's own RLS checks are two separate systems that don't know about each other. Here's what happens end to end for one request to, say, `/dashboard/assets`:

*Gate 1 — Application Layer*
1. Browser requests `/dashboard/assets`.
2. `proxy.ts` checks the session cookie — no valid session, and it redirects straight to `/login` before anything else runs.
3. The page calls `requireUser()` (or `requireAdmin()` on admin-only routes) — a second, independent check that re-reads the profile's own status/role from the database.
4. Only once that passes does the code even attempt `supabase.from("assets").select(...)`.

↓

*Gate 2 — Database Layer (independent of Gate 1)*
5. That query arrives at Postgres carrying the logged-in user's identity, via the Supabase session.
6. Before returning a single row, Postgres evaluates the table's RLS policy — e.g. `"active users read assets"` checks `is_active_user()`.
7. `is_active_user()` runs its own separate query against `profiles`, right there inside the database. If it comes back false, Postgres quietly returns zero rows — not an error, just nothing — no matter what the application code upstream already decided.

The point: even if step 2 or 3 somehow had a bug and let a request through it shouldn't have, step 6 would still block it — the database doesn't trust the application to have already checked. That's what **"RLS enforced at the database level, not just the interface"** actually means in practice, not just as a talking point.

---

## 6. Core Features, One by One

**Public Homepage & Editable Team Profiles** — *Problem:* the thesis requires an entry page introducing the team before login, with a specific fixed set of fields per member. *How it works:* `src/app/page.tsx` fetches `team_members` (ordered by `sort_order`) and `site_settings` with no authentication required (per the RLS policies above), and renders one `TeamMemberCard` per row, in the exact field order the thesis specifies: Name, Year Level, Course, Age, Sex, Address, Contact Number, Email Address, then a "5 Years From Now" quote pulled from `future_summary`. *Trade-off:* every field, including the photo, is editable later from Settings → Homepage Team (`TeamMemberFormDialog`) rather than hard-coded, so the team never needs a code change to update their own bios.

**Authentication & Role-Based Dashboard** — *Problem:* the system needs Administrator vs. Staff/Property Custodian access levels, matching the thesis's own role split. *How it works:* see Section 5 in full — Supabase Auth for identity, a `profiles.role` column for the two roles, RLS for database-level enforcement, and `requireUser()`/`requireAdmin()` for a second application-level check. The sidebar (`AppSidebar`) itself also hides Settings entirely from Staff accounts (`profile.role === "admin"` check), so the visible navigation matches what a Staff account is actually allowed to do.

**Property Asset Registry** — *Problem:* the core inventory of every non-consumable government asset. *How it works:* `src/app/dashboard/assets/page.tsx` lists every asset with live filtering by status and department (`AssetFilterBar`, driving URL search params so filters are shareable/bookmarkable) and free-text search (`ilike` against `asset_name`/`asset_code`). `AssetFormDialog` handles both create and edit through the same component — it's given an `asset` prop for editing, `undefined` for creating, and picks between the `createAsset`/`updateAsset` Server Actions accordingly.

**QR Sticker Generation & Printing** — *Problem:* the thesis calls for scannable asset tags, but a QR code alone is useless without a physical label to attach to real equipment. *How it works:* `generateQrDataUrl()` (`src/lib/qrcode.ts`) encodes the asset's `asset_code` as a QR image. `/dashboard/assets/[id]/sticker` renders a print-ready sheet of that code repeated in a grid (`StickerCopiesControl` lets staff pick how many copies, 1–24), styled at exact `1in` x `2.5in` physical dimensions with `print:hidden` on everything that shouldn't appear on paper. *A deliberate design decision:* this page is linked from wherever custody has just been established — the individual asset page, and directly from each row in Movement & Issuance once a transaction is saved — rather than being a separate, disconnected "batch print all stickers" screen. The reasoning: you don't actually know who to print a label *for* until you know who's receiving the asset, so printing has to happen at or after the point of issuance, not before it.

The whole function, from `src/lib/qrcode.ts`:

```ts
import QRCode from "qrcode";

export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { margin: 1, width: 240 });
}
```

In plain terms: this is the whole function. It hands the asset's code off to the `qrcode` library and asks for a data URL back — a self-contained image encoded directly as text, which means it can go straight into an `<img>` tag's `src` with no separate file to upload or host anywhere.

- **`Promise<string>`** — a TypeScript return-type annotation: this function is `async`, so it doesn't return a string directly, it returns a `Promise` that eventually resolves to one. Anyone calling it needs `await` to get the actual string out.
- **`{ margin: 1, width: 240 }`** — an options object passed as the second argument — the `qrcode` library's own settings for how much white border to leave and how many pixels wide to render the code.

**Movement & Issuance (+ automatic PAR/ICS generation)** — *Problem:* every issue/return/transfer needs to produce an official, numbered paper trail. *How it works:* covered in full in Section 4's data-flow walkthrough — `createMovement` in `src/app/dashboard/movements/actions.ts` records the transaction and, when appropriate, automatically creates the linked receipt record with an auto-generated document number.

**Printable PAR/ICS Receipts** — *Problem:* government property transactions require a signed Property Acknowledgement Receipt or Inventory Custodian Slip in a recognizable official format. *How it works:* `/dashboard/records/par/[id]` and `/dashboard/records/ics/[id]` are plain server-rendered pages styled to resemble the standard COA-format documents, each with a `PrintButton` that calls the browser's native `window.print()` — no PDF-generation library is used; the browser's own print engine (which every OS already has) handles pagination and output.

**Scan-to-Verify** — *Problem:* during a physical inventory count, staff need to instantly confirm what a labeled asset is supposed to be. *How it works:* `AssetScanner` (`src/components/asset-scanner.tsx`) lazy-loads the `html5-qrcode` library only when scanning starts, opens the device camera, and on a successful scan looks the decoded text up directly against `assets.asset_code`. A manual text-entry fallback exists for devices without camera access, or when a sticker is damaged and needs to be typed in by hand.

**Expiry & Lifecycle Tracker + Alerts** — *Problem:* warranties lapse and equipment ages without anyone tracking it centrally. *How it works:* `/dashboard/expiry` computes, per asset, days remaining until `expiration_date` (via `daysUntil()` in `src/lib/format.ts`) and a "life consumed" percentage bar (elapsed time since `acquisition_date` divided by total useful life), bucketed into Expired / ≤30 days / ≤90 days / Good Standing. The "Send Notifications" button (`SendNotificationsButton` → `generateAlerts()` in `src/app/dashboard/expiry/actions.ts`) scans every active asset's warranty, useful-life, and next-service dates against its own `alert_days_before` threshold and inserts a row into `alerts` for anything newly due, skipping assets that already have a pending alert of that type so it's safe to run repeatedly. *Being direct about a limitation here:* "Send Notifications" only creates in-app alert rows visible on the Alerts page — it does not send an email or SMS. There's no outbound messaging service wired up; it's a manual scan-and-flag tool, not a push-notification system.

The full function, from `src/app/dashboard/expiry/actions.ts`:

```ts
export async function generateAlerts() {
  await requireUser();
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("asset_id, asset_name, expiration_date, warranty_expiry, next_service_date, alert_days_before")
    .neq("status", "disposed");

  if (!assets) return { created: 0 };

  const { data: existingAlerts } = await supabase
    .from("alerts")
    .select("asset_id, alert_type")
    .eq("status", "pending");

  const existingKey = new Set(
    (existingAlerts ?? []).map((a) => `${a.asset_id}:${a.alert_type}`),
  );

  const toInsert: {
    asset_id: number;
    alert_type: "warranty" | "useful_life" | "maintenance";
    alert_message: string;
    alert_date: string;
  }[] = [];

  const today = new Date().toISOString().slice(0, 10);

  for (const asset of assets) {
    const threshold = asset.alert_days_before ?? 30;

    const checks: {
      type: "warranty" | "useful_life" | "maintenance";
      date: string | null;
      label: string;
    }[] = [
      { type: "warranty", date: asset.warranty_expiry, label: "Warranty expires" },
      { type: "useful_life", date: asset.expiration_date, label: "Useful life ends" },
      { type: "maintenance", date: asset.next_service_date, label: "Maintenance due" },
    ];

    for (const check of checks) {
      if (!check.date) continue;
      const remaining = daysUntil(check.date);
      if (remaining === null || remaining > threshold) continue;

      const key = `${asset.asset_id}:${check.type}`;
      if (existingKey.has(key)) continue;

      const message =
        remaining < 0
          ? `${check.label} — overdue by ${Math.abs(remaining)} day(s)`
          : `${check.label} in ${remaining} day(s)`;

      toInsert.push({
        asset_id: asset.asset_id,
        alert_type: check.type,
        alert_message: `${asset.asset_name}: ${message}`,
        alert_date: today,
      });
      existingKey.add(key);
    }
  }

  if (toInsert.length > 0) {
    await supabase.from("alerts").insert(toInsert);
  }

  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/expiry");
  revalidatePath("/dashboard");
  return { created: toInsert.length };
}
```

In plain terms: this pulls every active asset, then checks each one's warranty date, useful-life end date, and next service date against its own alert threshold. Anything that's due soon — and doesn't already have a pending alert of that same type — gets queued up and inserted in one batch at the end. Running this twice in a row does nothing the second time, since already-flagged assets get skipped.

- **`if (!assets) return { created: 0 };`** — an early return — if the query came back with nothing at all, stop right here instead of trying to loop over something that doesn't exist.
- **`(existingAlerts ?? []).map(...)`** — `?? []` again: if `existingAlerts` happens to be `null`, fall back to an empty array so `.map()` has something safe to run on instead of crashing.
- **`new Set(...)`** — a `Set` is a collection that automatically ignores duplicates. Building one here makes checking "have I already flagged this asset for this alert type" an instant lookup instead of searching through an array every time.
- **`const toInsert: { ... }[] = []`** — a typed empty array — this annotation tells TypeScript exactly what shape of object is allowed to go into `toInsert` later, so a typo in one of those fields gets caught immediately instead of failing silently.
- **`for (const asset of assets)`** — a `for...of` loop — runs the code inside once for every asset in the array, giving direct access to each one as `asset`.
- **`asset.alert_days_before ?? 30`** — nullish coalescing again — if this asset was never given a custom alert threshold, default to 30 days.
- **`` remaining < 0 ? `...overdue by...` : `...in ${remaining} day(s)` ``** — a ternary picking between two different template-literal messages depending on whether the date has already passed.
- **`if (existingKey.has(key)) continue;`** — `continue` skips straight to the next loop iteration without running the rest of the code below it — here, skipping an alert type that's already been flagged for this asset.

**Disposal & Write-off** — *Problem:* condemned/disposed assets need their own compliant record separate from active inventory. *How it works:* `createDisposal` records the disposal (method, appraisal value, inspection date, approving official) and simultaneously flips the asset's own `status` to `disposed`, removing it from active registry views. An Admin can mark a pending disposal `approved` via `markDisposalApproved`. *Deliberate scope limit:* this is a record-keeping and single-step approval flag, not a multi-stage approval workflow (routing, notifications, sign-offs) — that matches the thesis's own Chapter 1 scope, which explicitly excludes building a full approval-workflow engine.

**Reports** — *Problem:* the office needs both a working-data export and a formal compliance document. *How it works:* `/api/reports/assets` is a real HTTP `GET` endpoint (not a Server Action, since a file download needs an actual URL) that hand-builds a CSV string (with a small `csvEscape()` helper for quoting fields containing commas/quotes/newlines) and returns it with a `Content-Disposition: attachment` header. `/dashboard/reports/rpcppe` renders a printable **Report on the Physical Count of Property, Plant and Equipment** — the standard COA-format compliance document — computed live from current asset data rather than being a static template.

**Settings (Staff Accounts, Categories, Offices, Homepage Team, Branding)** — *Problem:* an Admin needs to manage everything that isn't a day-to-day transaction, without touching code. *How it works:* one tabbed page (`src/app/dashboard/settings/page.tsx`), gated by `requireAdmin()`, covering: creating/deactivating Staff and Admin logins (no public sign-up exists anywhere in this system, by design — every account is Admin-provisioned, matching how a real government office issues system access); Categories and Offices CRUD; full CRUD on the public Homepage Team profiles; and Branding (logo + favicon upload, both falling back to the default GSO-PMS mark if left blank).

**Accountable Officer Photos** — *Problem:* the client specifically asked for a way to visually confirm who's holding a piece of equipment, not just a name in a database. *How it works:* `OfficerFormDialog` uses `ImageUploadField` with a photo required — `createOfficer`/`updateOfficer` (`src/app/dashboard/officers/actions.ts`) explicitly reject the submission server-side if `photo_url` is empty (*"A photo is required so the office can identify the custodian on sight."*). Photos display as small clickable thumbnails (`PhotoLightbox`) throughout the Officers list, which open into a larger modal view on click and close on an outside click or Escape — both handled for free by the underlying Radix `Dialog` primitive, not custom-written.

From `src/app/dashboard/officers/actions.ts`:

```ts
function parseOfficerForm(formData: FormData): TablesInsert<"accountable_officers"> {
  const str = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  // ...
}

export async function createOfficer(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();

  const parsed = parseOfficerForm(formData);
  if (!parsed.photo_url) {
    return { error: "A photo is required so the office can identify the custodian on sight." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("accountable_officers").insert(parsed);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/officers");
  return { success: true };
}
```

In plain terms: `parseOfficerForm()` first turns every blank text field into a real `null` instead of an empty string, so the database stores "nothing entered" accurately. Then `createOfficer()` checks specifically for a missing photo and refuses to save if one wasn't uploaded — this check runs on the server, so there's no way around it even by tampering with the form in the browser.

- **`const str = (key: string) => { ... }`** — a small arrow function defined right inside `parseOfficerForm`, used only in this one file — it turns an empty form field into `null` instead of an empty string, so a blank "Employee No." is stored as genuinely empty rather than the text `""`.
- **`typeof value === "string" && value.length > 0 ? value : null`** — `typeof` checks what kind of value `formData.get()` actually returned. Combined with the length check, this reads as: "if it's a non-empty string, keep it — otherwise, `null`."
- **`if (!parsed.photo_url) { return { error: ... }; }`** — the actual enforcement of "a photo is required." This runs on the server, not just in the browser, so there's no way to submit an officer without a photo even by skipping the UI entirely.

**In-App Documentation Page** — *Problem:* the team needs this same explanation available inside the actual deployed system, not only as an external file, so a professor or panelist looking at the live site can see it directly — without needing an account. *How it works:* `src/app/documentation/page.tsx` lives at the top level of the app (outside `/dashboard`), so it's a genuinely public route, unauthenticated, mirroring the content of this document as a single continuous page. *A deliberate decision:* it's intentionally left out of the sidebar navigation and out of every other page's links — it's only reachable if you already have the direct URL (`gsopms.gabrielsacro.com/documentation`), which keeps it out of the way for day-to-day Staff/Admin use while still being open for a defense panel to pull up on request.

---

## 7. Likely Panel Questions, With Ready Answers

**1. "Where's the Java?"**
There isn't any — and that's correct for a web application. This system runs on JavaScript (written as TypeScript, its typed superset), which is the only language browsers execute natively. Java is a completely different, separately-compiled language for a different job (enterprise/desktop/Android). The two share part of a name from a 1995 marketing decision and nothing else technically.

**2. "Why Next.js instead of something simpler like plain PHP or WordPress?"**
This is a transactional records system with role-based permissions and linked tables (assets → assignments → receipts), not a content-publishing site. WordPress is built for the latter; forcing it to do the former means stacking plugins on top of a tool not designed for it. Plain PHP means hand-writing validation, queries, and auth from scratch on every page — slower to build and easier to get wrong. Next.js gives reusable components (one `AssetFormDialog` used everywhere an asset form is needed) and, through TypeScript, catches a class of bugs before the code ever runs.

**3. "Is Row Level Security actually enforced, or is that just marketing?"**
It's enforced at the database level on all 13 tables — every single one has `rls_enabled = true`, and every policy is backed by the SQL functions `is_active_user()` and `is_admin()`, which check the requesting user's own `profiles` row. That means even a request that bypassed this website entirely and hit the Supabase database directly would still be blocked by the same rules — permissions aren't just "hide the button in the interface," they're checked by Postgres on every query.

**4. "What data is real versus fake/demo data?"**
Two small reference tables — `categories` (5 fixed values) and `offices` (7 fixed values) — were seeded once to match the departments and asset categories already named in the thesis's own mockups. Everything else — every asset, officer, movement, receipt, alert, disposal record, and the two admin logins — was created through the application's own forms, exactly the way a real user would create them going forward. Nothing is hard-coded into the app's code.

**5. "How does login actually work — where are passwords stored?"**
Passwords are never touched, hashed, or stored by this codebase at all. Login is handled entirely by Supabase Auth, a dedicated identity provider — `src/app/login/actions.ts` just calls `supabase.auth.signInWithPassword()` and lets Supabase verify the credentials. The result is a secure session cookie, refreshed on every request by `src/proxy.ts`.

**6. "What happens if someone edits the URL to try to reach an admin page as a Staff account?"**
Two independent checks catch it. First, `src/proxy.ts` runs on every request and redirects unauthenticated visitors away from `/dashboard`. Second — and this is the one that actually matters for role, not just login state — every admin-only page and Server Action calls `requireAdmin()` (`src/lib/supabase/auth.ts`) itself, which re-checks the user's role from the database and redirects non-admins back to `/dashboard`. That second check exists specifically because route-matching alone isn't trustworthy enough on its own — it's a deliberate defense-in-depth choice, not an oversight.

**7. "Why generate the QR sticker at the movement/issuance step instead of right when the asset is added?"**
Because at the moment an asset is first registered, nobody necessarily knows yet who it's being issued to. Printing a sticker before custody is assigned means either printing a blank/generic label or guessing. The sticker page is linked from the asset detail view and directly from each row in Movement & Issuance once a transaction is saved, so a label only gets printed once there's an actual officer and office to print it for.

**8. "Does the system send real email or SMS notifications for expiring warranties?"**
No, and that's worth saying plainly rather than dressing it up: "Send Notifications" on the Expiry Tracker scans all active assets against their warranty/useful-life/maintenance thresholds and creates in-app alert rows visible on the Alerts page. There's no email or SMS service wired up. It's a manual scan-and-flag tool a staff member triggers, not an automated push-notification pipeline.

**9. "Why is disposal only a single 'Mark Approved' step instead of a full approval workflow?"**
That matches the thesis's own Chapter 1 scope, which explicitly excludes building a multi-stage approval-routing engine. What exists is a compliant record — who requested it, the method, the appraisal value, and a single admin-only approval flag — without simulating a sign-off chain the thesis never asked for.

**10. "Is this actually free to run, or will the LGU get a bill later?"**
Everything runs on the free tiers of GitHub, Vercel, and Supabase today, exactly as scoped. If usage ever outgrows those free limits, the same code moves to a paid tier of the same three services — there's no rebuild required, just a plan upgrade.

**11. "What stops two people from editing the same asset at the same time and losing data?"**
Nothing prevents a race condition explicitly — the last write to a given row wins, which is standard behavior for a system this size and is an honest, known trade-off rather than an oversight. At the office's expected usage volume (one municipal GSO, not a high-concurrency public system), that's an acceptable risk; it would be worth revisiting with optimistic locking or row versioning if usage ever scaled up significantly.

**12. "Why does the homepage show team member details that look editable — who can change those?"**
Only an Administrator. `team_members` has a public *read* policy (`"anyone can read team members"`) since the homepage is public and unauthenticated, but every `INSERT`/`UPDATE`/`DELETE` policy on that table requires `is_admin()`. The Settings → Homepage Team tab is where an admin edits it, through `TeamMemberFormDialog`.

---

## 8. Limitations & Possible Improvements

Being upfront about what's simplified, since a panel generally responds better to an honest scope statement than to an over-claimed one:

- **No real outbound notifications.** "Send Notifications" generates in-app alerts only; there's no email/SMS integration. Adding one (e.g. via a transactional email API) would be a contained addition — the alert-generation logic already exists in `generateAlerts()`, it would just also need to dispatch a message per new alert.
- **No automated test suite or CI pipeline.** Testing so far has been manual, click-through verification against both the local dev server and the live deployment. A real production system for a government office would benefit from an automated test suite covering the RLS policies and the PAR/ICS document-generation logic specifically, since those are the pieces where a silent bug would be most costly.
- **No scheduled/background job runner.** Alert generation is triggered manually by a staff member clicking "Send Notifications" rather than running automatically on a schedule (e.g. daily). Supabase supports scheduled Postgres jobs (`pg_cron`) that could call the same logic automatically.
- **No pagination on list views.** The Asset Registry, Officers, and Records tables load and render every matching row at once. That's fine at the current (prototype/demo) data volume, but a real multi-year deployment with thousands of assets would need pagination or virtualized scrolling.
- **No optimistic concurrency control.** As noted in the panel-questions section, simultaneous edits to the same record aren't specially handled — last write wins.
- **No soft-delete or change history.** Deletes (Admin-only) are permanent; there's no audit trail of who changed what and when beyond what's implicit in the record itself. A dedicated audit-log table would be a natural next addition for a compliance-focused system like this one.
- **Single-tenant, one-LGU branding.** "Municipality of Villanueva" is written directly into the PAR/ICS/RPCPPE print templates rather than being a configurable setting. That's appropriate for this thesis's scope (one specific municipal GSO) but would need to become a setting if the system were ever adapted for another LGU.
- **No rate limiting on the login form.** There's no explicit protection against repeated login attempts beyond whatever Supabase Auth provides by default. For a real deployment, adding basic rate limiting would be a sensible hardening step.
- **`next-themes` is present but unused as a feature.** It's wired into the toast component from the shadcn scaffold, but there's no user-facing light/dark mode toggle. Either removing the dependency or actually building the toggle would tidy this up — currently it's simply inert.

None of the above are hidden gaps — they're conscious trade-offs appropriate for a capstone-scoped system, and every one of them has a clear, described path forward if the project continues past thesis defense.

---

## 9. Reviewer Cheat Sheet

The concepts that come up most in conversation, explained the way I'd actually say them out loud — not reworded code comments. Read this section once before walking the students through it, so it comes out fluent instead of sounding like I'm reading documentation at them.

### The example that proves it: HTML input → TypeScript → Supabase → HTML output

**Step 1 — the HTML.** The sign-in screen has this literal tag in `src/app/login/page.tsx`:

```html
<input id="email" name="email" type="email" required />
```

That's pure HTML. It has no idea what a database is — it just sits there and waits for someone to type.

- **`id="email"`** — connects this input to its `<Label htmlFor="email">` above it, so clicking the label focuses the box. This is not what the server reads.
- **`name="email"`** — this is what the server actually reads. When the form submits, `formData.get("email")` matches this `name`, not the `id`.
- **`type="email"`** — tells the browser to show an email-style keyboard on mobile and do basic "does this look like an email" checking before it even submits.
- **`required`** — tells the browser to block the form from submitting at all if this field is empty, before any of my own code even runs.

**Step 2 — the TypeScript.** When the form is submitted, `src/app/login/actions.ts` runs:

```ts
const email = formData.get("email") as string;
const password = formData.get("password") as string;
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

This is the actual "fetch" — TypeScript reading what was typed into that HTML input, then making a real network call to Supabase.

In plain terms: when someone submits the sign-in form, this function runs on the server. I pull the email and password straight out of the submitted form data, then hand both off to Supabase's own sign-in method — I'm not writing any password-checking logic myself, Supabase handles that securely on its end. That's a real network call, so I use `await` to pause the code until Supabase actually responds. What comes back includes an `error` field, and that's the only piece I grab, because that's what tells me whether the login worked or not.

- **`const`** — not `let`, because `email` is set once from the form data and never reassigned anywhere in this function. If a value won't change after I set it, `const` is the safer default — TypeScript actually stops the build if I try to reassign it later by mistake.
- **`formData.get("email")`** — `formData` is the raw data the browser packaged up from the form. `.get("email")` pulls the value out of whichever input has `name="email"` — not `id`, `name`. That's how the browser and my code agree on which field is which.
- **`as string`** — this is TypeScript only, not plain JavaScript. `formData.get()` is typed to return more than one possible kind of value (it could technically be a string, a `File`, or `null`), so `as string` is me telling the compiler to trust that in this specific case it's a string. It changes nothing at runtime — it only changes what TypeScript lets me do with the value afterward.
- **`await`** — `signInWithPassword` doesn't answer instantly — it's a real request going out over the network to Supabase's servers. `await` pauses this function right there until that response actually arrives, instead of racing ahead to the next line with no answer yet.
- **`const { error } = ...`** — this is destructuring. `signInWithPassword` actually returns an object with more than one property on it (`data` and `error`), and instead of grabbing the whole object and writing `result.error` every time, `{ error }` reaches in and pulls out just that one property into its own variable directly. I only need `error` here — if it comes back `null`, the sign-in worked.

**Step 3 — back to HTML, the other direction.** On the Asset Registry, `src/app/dashboard/assets/page.tsx` runs:

```ts
const { data: assets } = await supabase.from("assets").select("*, categories(category_name)...");
```

In plain terms: here I'm asking Supabase for every row in the `assets` table, and for each one, also pulling in its related category's name — one request instead of two separate queries. Since it's a network call, I wait for it with `await`, and I grab just the data part of the response, naming it `assets` so the rest of the page can use it directly.

- **`supabase.from("assets")`** — points the query at the `assets` table specifically.
- **`.select("*, categories(category_name)...")`** — the `*` means "give me every column on the asset itself." `categories(category_name)` rides along on that same request and pulls in the related category's name through the foreign key, so I don't need a second, separate query just to show a category name next to each asset.
- **`await`** — same reason as the login example — this is a real network call, so the function pauses here until Supabase actually answers.
- **`const { data: assets } = ...`** — destructuring again, but this time with a rename. Supabase always hands back an object shaped like `{ data, error }`. `{ data: assets }` reaches in, grabs the `data` property, and immediately renames it to `assets` for the rest of the file — shorter than writing `result.data` everywhere, and `assets` reads clearer than `data` on a page with more than one query.

and then, further down the same file:

```tsx
<TableCell>{asset.asset_name}</TableCell>
```

That second line *looks* like it's just sitting on the page as HTML. It isn't. `asset.asset_name` is a live value that came out of the Supabase query a few lines above — every time that page loads, TypeScript asks the database fresh, and only then builds that `<td>` tag with whatever the database currently says. Rename that asset in the database right now, and the very next page load shows the new name — nobody edited an HTML file. **The HTML on that screen was never typed by a person; TypeScript generated it, live, from Supabase, the moment the page was requested.**

- **`<TableCell>`** — one of this project's table components — visually it's just a table cell, a `<td>`, in the end.
- **`{ }`** — curly braces inside JSX mean "stop treating this as plain text, run this as real TypeScript and print whatever it returns." Anything outside curly braces in JSX is static text; anything inside is a live value.
- **`asset.asset_name`** — plain dot notation — reading the `asset_name` property off whichever `asset` object is currently being rendered, one per row of the table.

### Quick-fire Q&A

**Is it fair to call Vercel and Supabase "hosting" too?**
Yes — both are hosting, they just host two different halves of the system. Vercel hosts and runs the actual application: it takes the code, builds it, and serves the pages when someone visits the URL. Supabase hosts the data side: the database, the login system, and the uploaded photos. Simple way to say it: Vercel is the storefront that's always open; Supabase is the warehouse and records room behind it that the storefront calls into whenever it needs information.

**So is it "one hosts frontend, one hosts backend"?**
Close, but worth tightening — a panel likes to poke at exactly this. Vercel doesn't only host what the browser shows, it also runs the server-side part of the app (fetching data, handling form submissions) before the page ever reaches the browser. So Vercel hosts and runs the whole application, front and back. Supabase isn't "the backend" in the sense of running code at all — it's the data layer the app calls out to. Cleaner phrasing: Vercel runs the app. Supabase remembers everything the app needs to remember.

**Is JavaScript the same thing as TypeScript?**
No — Section 1 above breaks this down properly (Java vs. JavaScript vs. TypeScript, one at a time), since it's really three concepts people mash into a single question. Short version: TypeScript is JavaScript with type-checking added on top, and it compiles down to plain JavaScript before it ever reaches a browser — so this project is written in TypeScript but runs as JavaScript.

**What does "compile" or "build" actually mean here?**
It means turning the TypeScript/React source code into the plain HTML, CSS, and JavaScript a browser can run — checking types, bundling files together, and optimizing them along the way. That's the `next build` step, the exact one Vercel runs automatically on every push.

**If Supabase holds the data, is Supabase "the website"?**
No — Supabase has no idea what the website looks like. It only stores data and answers requests for it. Its own dashboard shows tables and rows, not the property registry screen. The actual website — pages, layout, forms — is entirely defined by the Next.js code hosted on Vercel. Supabase is a service the website talks to, not the website itself.

**If PHP works, why isn't it used here?**
PHP genuinely works — WordPress runs on it. It's not that PHP can't do this job, it's that plain PHP means hand-building everything Next.js and Supabase already hand us for free: reusable interactive components, type-checking that catches mistakes before code runs, permission rules enforced at the database itself instead of just the page, and a deploy pipeline triggered automatically by a git push. A modern PHP framework like Laravel gets closer, but that's rebuilding the same toolkit under a different name, still on older single-server hosting instead of this project's push-to-deploy pipeline.

**Is this project mobile-friendly?**
Reasonably, yes, though it isn't mobile-first. Tailwind's responsive classes run throughout: the homepage's team grid reflows from four columns down to one on a phone, the sidebar collapses into a slide-out drawer on small screens (that's what `useIsMobile()` in `use-mobile.ts` is for), and dialogs resize to fit. What isn't fully optimized: the data tables (Asset Registry, Officers, Movement & Issuance, Records) scroll sideways on a phone instead of restacking as cards — a normal, honest trade-off for a back-office tool GSO staff mostly use at a desk, and a contained next step rather than a rebuild if this engagement continues.
