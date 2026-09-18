import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SiteLogo } from "@/components/site-logo";
import { createClient } from "@/lib/supabase/server";

const sections = [
  { id: "stack", label: "1. Tech Stack" },
  { id: "why", label: "2. Why This Stack" },
  { id: "tree", label: "3. Project Tree" },
  { id: "flow", label: "4. Architecture & Data Flow" },
  { id: "security", label: "5. Database & Security" },
  { id: "features", label: "6. Core Features" },
  { id: "faq", label: "7. Panel Q&A" },
  { id: "limits", label: "8. Limitations" },
  { id: "reviewer", label: "9. Reviewer Cheat Sheet" },
];

const stackItems: [string, string][] = [
  ["TypeScript", "Primary language for the whole codebase, front end and back end alike — JavaScript plus a compile-time type checker that catches mismatched fields and wrong data types before the code ever runs."],
  ["JavaScript", "What TypeScript compiles down to. The only language a web browser executes natively."],
  ["SQL (PostgreSQL dialect)", "The database schema, Row-Level Security policies, and helper functions are all written directly in Postgres SQL."],
  ["Next.js 16.2.12", "The application framework — routing, server-side rendering, the build pipeline, and Turbopack (its default bundler in v16)."],
  ["React 19.2.4", "The UI library every screen is built from, via react-dom 19.2.4."],
  ["Supabase (PostgreSQL 17)", "The backend: hosted database, authentication, and file storage in one platform. There is no separate hand-built backend server."],
  ["@supabase/ssr + @supabase/supabase-js", "Official client libraries connecting the app to Supabase from both the browser and the Next.js server, with cookie-based session handling."],
  ["radix-ui + shadcn", "Accessible, unstyled UI primitives (dialogs, dropdowns, the sidebar) wrapped into this project's styled components under src/components/ui, generated via the shadcn CLI in the “radix-nova” style."],
  ["qrcode / html5-qrcode", "Generates QR codes for asset stickers, and reads them back via device camera for Scan-to-Verify."],
  ["Tailwind CSS v4", "The styling system behind every screen, driven by CSS variables defined in globals.css."],
  ["lucide-react, sonner, tailwind-merge, clsx, class-variance-authority", "Icons, toast notifications, and small class-name utilities used throughout the UI."],
];

const treeGroups: { path: string; note: string }[] = [
  { path: "next.config.ts", note: "Nearly empty — its one real setting allow-lists the Supabase Storage domain so Next's <Image> component can load photos from it." },
  { path: "src/proxy.ts", note: "Next.js 16's renamed middleware file. Refreshes the session cookie on every request and redirects unauthenticated visitors away from /dashboard." },
  { path: "src/app/layout.tsx", note: "Root HTML shell — fonts, toast provider, and a generateMetadata() function that swaps in a custom favicon if one was uploaded in Settings." },
  { path: "src/app/page.tsx", note: "The public homepage — fetches team_members and site_settings with no login required and renders the team cards." },
  { path: "src/app/login/", note: "page.tsx is the sign-in form; actions.ts holds the login() Server Action." },
  { path: "src/app/dashboard/", note: "Every authenticated screen, one folder per feature, each pairing a page.tsx (fetch + render) with an actions.ts (Server Actions for every write)." },
  { path: "src/app/api/reports/assets/route.ts", note: "The one plain HTTP API route in the project — needed because a CSV download requires a real downloadable URL, which a Server Action can't provide directly." },
  { path: "src/components/", note: "Shared building blocks: form dialogs, action buttons, and the two components that do real work beyond forms — ImageUploadField (upload + WebP compression) and AssetScanner (camera QR reading)." },
  { path: "src/components/ui/", note: "The shadcn/Radix primitives everything else is built from — Button, Dialog, Table, Sidebar, Select, Tabs, and so on." },
  { path: "src/hooks/", note: "use-form-success.ts (the shared FormActionState type + useFormSuccessEffect hook every form dialog uses) and use-mobile.ts (responsive sidebar behavior)." },
  { path: "src/lib/", note: "Non-visual logic: format.ts (dates/currency/day-math), qrcode.ts, image-compress.ts, utils.ts, and supabase/ (client.ts, server.ts, admin.ts, auth.ts, database.types.ts)." },
];

const flowSteps = [
  { n: "01", title: "Request Hits proxy.ts", desc: "Session cookie refreshed; unauthenticated visitors to /dashboard/* are redirected to /login." },
  { n: "02", title: "Server Component Fetches Data", desc: "page.tsx calls requireUser(), then queries Supabase directly — e.g. supabase.from(\"assets\").select(...) in assets/page.tsx." },
  { n: "03", title: "Postgres Applies RLS", desc: "The query only succeeds because the logged-in user's profiles row satisfies is_active_user() or is_admin()." },
  { n: "04", title: "HTML Renders on the Server", desc: "The Server Component renders straight to HTML; Client Components like AssetFormDialog hydrate afterward for interactivity." },
  { n: "05", title: "Form Submits to a Server Action", desc: "No hand-written fetch() call — the form calls a Server Action directly via useActionState, e.g. createAsset in assets/actions.ts." },
  { n: "06", title: "Action Re-Checks Permissions & Writes", desc: "requireUser()/requireAdmin() run again inside the action itself, never trusting the UI already checked, then the row is inserted/updated." },
  { n: "07", title: "revalidatePath() Invalidates the Cache", desc: "Next.js discards its cached render for that URL; the next view re-runs step 2 with fresh data." },
];

const generateQrDataUrlBreakdown: [string, string][] = [
  ["Promise<string>", "A TypeScript return-type annotation: this function is async, so it doesn't return a string directly, it returns a Promise that eventually resolves to one. Anyone calling it needs await to get the actual string out."],
  ["{ margin: 1, width: 240 }", "An options object passed as the second argument — the qrcode library's own settings for how much white border to leave and how many pixels wide to render the code."],
];

const generateAlertsBreakdown: [string, string][] = [
  ["if (!assets) return { created: 0 };", "An early return — if the query came back with nothing at all, stop right here instead of trying to loop over something that doesn't exist."],
  ["(existingAlerts ?? []).map(...)", "?? [] again: if existingAlerts happens to be null, fall back to an empty array so .map() has something safe to run on instead of crashing."],
  ["new Set(...)", "A Set is a collection that automatically ignores duplicates. Building one here makes checking \"have I already flagged this asset for this alert type\" an instant lookup instead of searching through an array every time."],
  ["const toInsert: { ... }[] = []", "A typed empty array — this annotation tells TypeScript exactly what shape of object is allowed to go into toInsert later, so a typo in one of those fields gets caught immediately instead of failing silently."],
  ["for (const asset of assets)", "A for...of loop — runs the code inside once for every asset in the array, giving direct access to each one as asset."],
  ["asset.warranty_alert_days_before ?? 30", "Nullish coalescing again — if this asset was never given a custom alert threshold for this date type, default to 30 days. Each of the three dates (warranty, useful life, maintenance) now carries its own independent threshold."],
  ["remaining < 0 ? `...overdue by...` : `...in ${remaining} day(s)`", "A ternary picking between two different template-literal messages depending on whether the date has already passed."],
  ["if (existingKey.has(key)) continue;", "continue skips straight to the next loop iteration without running the rest of the code below it — here, skipping an alert type that's already been flagged for this asset."],
];

const createOfficerBreakdown: [string, string][] = [
  ["const str = (key: string) => { ... }", "A small arrow function defined right inside parseOfficerForm, used only in this one file — it turns an empty form field into null instead of an empty string, so a blank \"Employee No.\" is stored as genuinely empty rather than the text \"\"."],
  ["typeof value === \"string\" && value.length > 0 ? value : null", "typeof checks what kind of value formData.get() actually returned. Combined with the length check, this reads as: \"if it's a non-empty string, keep it — otherwise, null.\""],
  ["if (!parsed.photo_url) { return { error: ... }; }", "The actual enforcement of \"a photo is required.\" This runs on the server, not just in the browser, so there's no way to submit an officer without a photo even by skipping the UI entirely."],
];

type Feature = {
  name: string;
  body: string;
  code?: string;
  codeFile?: string;
  codeSummary?: string;
  codeBreakdown?: [string, string][];
};

const features: Feature[] = [
  { name: "Public Homepage & Editable Team Profiles", body: "src/app/page.tsx renders one TeamMemberCard per team_members row, in the exact field order the thesis specifies (Name, Year Level, Course, Age, Sex, Address, Contact Number, Email Address, then a “5 Years From Now” quote). Every field, including the photo, is editable from Settings → Homepage Team rather than hard-coded." },
  { name: "Authentication & Role-Based Dashboard", body: "Supabase Auth handles identity; profiles.role (admin/staff) drives permissions, checked both by database RLS and by requireUser()/requireAdmin() in code. AppSidebar hides Settings entirely from Staff accounts." },
  { name: "Property Asset Registry", body: "assets/page.tsx lists every asset with live status/department filtering (AssetFilterBar, driven by URL search params) and search. AssetFormDialog handles both create and edit through the same component, switching between createAsset/updateAsset." },
  {
    name: "QR Sticker Generation & Printing",
    body: "generateQrDataUrl() encodes each asset's asset_code as a QR image. The sticker sheet is linked from the asset detail page and directly from each Movement & Issuance row once a transaction is saved — deliberately after custody is known, not before, since you can't label a sticker for an officer you haven't assigned yet.",
    codeFile: "src/lib/qrcode.ts",
    code: `import QRCode from "qrcode";

export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { margin: 1, width: 240 });
}`,
    codeSummary: "In plain terms: this is the whole function. It hands the asset's code off to the qrcode library and asks for a data URL back — a self-contained image encoded directly as text, which means it can go straight into an <img> tag's src with no separate file to upload or host anywhere.",
    codeBreakdown: generateQrDataUrlBreakdown,
  },
  { name: "Movement & Issuance + Automatic PAR/ICS", body: "createMovement records the transaction, keeps the asset's assigned_office_id in sync, and — when issuing or transferring to a named officer — auto-generates a linked par_records or ics_records row with an auto-numbered document like PAR-2026-0007, tied back to the exact transaction via assignment_id. The full function, with a line-by-line breakdown, is shown in Section 4." },
  { name: "Printable PAR/ICS Receipts", body: "/dashboard/records/par/[id] and .../ics/[id] render official-format receipts server-side; PrintButton just calls window.print() — no PDF library involved, the browser's own print engine handles it." },
  { name: "Scan-to-Verify", body: "AssetScanner lazy-loads html5-qrcode only when scanning starts, reads a QR code via the device camera, and looks the decoded text up against assets.asset_code, with a manual text-entry fallback for damaged labels or camera-less devices." },
  {
    name: "Expiry & Lifecycle Tracker + Alerts",
    body: "Computes days remaining and a “life consumed” percentage per asset. “Send Notifications” (generateAlerts()) scans warranty/useful-life/maintenance thresholds and creates alerts rows for anything newly due. Worth being direct: this only creates in-app alerts — there is no email or SMS sending wired up.",
    codeFile: "src/app/dashboard/expiry/actions.ts",
    code: `export async function generateAlerts() {
  await requireUser();
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "asset_id, asset_name, expiration_date, warranty_expiry, next_service_date, expiry_alert_days_before, warranty_alert_days_before, maintenance_alert_days_before",
    )
    .neq("status", "disposed");

  if (!assets) return { created: 0 };

  const { data: existingAlerts } = await supabase
    .from("alerts")
    .select("asset_id, alert_type")
    .eq("status", "pending");

  const existingKey = new Set(
    (existingAlerts ?? []).map((a) => \`\${a.asset_id}:\${a.alert_type}\`),
  );

  const toInsert: {
    asset_id: number;
    alert_type: "warranty" | "useful_life" | "maintenance";
    alert_message: string;
    alert_date: string;
  }[] = [];

  const today = new Date().toISOString().slice(0, 10);

  for (const asset of assets) {
    const checks: {
      type: "warranty" | "useful_life" | "maintenance";
      date: string | null;
      label: string;
      threshold: number;
    }[] = [
      { type: "warranty", date: asset.warranty_expiry, label: "Warranty expires", threshold: asset.warranty_alert_days_before ?? 30 },
      { type: "useful_life", date: asset.expiration_date, label: "Useful life ends", threshold: asset.expiry_alert_days_before ?? 30 },
      { type: "maintenance", date: asset.next_service_date, label: "Maintenance due", threshold: asset.maintenance_alert_days_before ?? 30 },
    ];

    for (const check of checks) {
      if (!check.date) continue;
      const remaining = daysUntil(check.date);
      if (remaining === null || remaining > check.threshold) continue;

      const key = \`\${asset.asset_id}:\${check.type}\`;
      if (existingKey.has(key)) continue;

      const message =
        remaining < 0
          ? \`\${check.label} — overdue by \${Math.abs(remaining)} day(s)\`
          : \`\${check.label} in \${remaining} day(s)\`;

      toInsert.push({
        asset_id: asset.asset_id,
        alert_type: check.type,
        alert_message: \`\${asset.asset_name}: \${message}\`,
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
}`,
    codeSummary: "In plain terms: this pulls every active asset, then checks each one's warranty date, useful-life end date, and next service date against that date's own independently configurable alert threshold. Anything that's due soon — and doesn't already have a pending alert of that same type — gets queued up and inserted in one batch at the end. Running this twice in a row does nothing the second time, since already-flagged assets get skipped.",
    codeBreakdown: generateAlertsBreakdown,
  },
  { name: "Disposal & Write-off", body: "createDisposal records the disposal and flips the asset's status to disposed. An Admin can mark it approved via markDisposalApproved. This is a record-and-flag flow, not a multi-stage approval workflow — matching the thesis's own Chapter 1 scope exclusion." },
  { name: "Reports", body: "/api/reports/assets is a real GET endpoint returning a hand-built CSV (needed because downloads require a real URL). /dashboard/reports/rpcppe renders a printable, live-computed RPCPPE compliance document." },
  { name: "Settings", body: "One admin-only page (requireAdmin()) covering Staff Accounts (no public sign-up exists anywhere — every login is admin-provisioned), Categories, Offices, Homepage Team, and Branding (logo/favicon upload, falling back to the default mark if blank). The createStaffAccount code, with a full breakdown, is shown in Section 5." },
  {
    name: "Accountable Officer Photos",
    body: "OfficerFormDialog requires a photo; createOfficer/updateOfficer explicitly reject the submission server-side if photo_url is empty. Photos display as clickable PhotoLightbox thumbnails that open into a modal, closing on outside click or Escape — both handled by the underlying Radix Dialog for free.",
    codeFile: "src/app/dashboard/officers/actions.ts",
    code: `function parseOfficerForm(formData: FormData): TablesInsert<"accountable_officers"> {
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
}`,
    codeSummary: "In plain terms: parseOfficerForm() first turns every blank text field into a real null instead of an empty string, so the database stores \"nothing entered\" accurately. Then createOfficer() checks specifically for a missing photo and refuses to save if one wasn't uploaded — this check runs on the server, so there's no way around it even by tampering with the form in the browser.",
    codeBreakdown: createOfficerBreakdown,
  },
];

const faqs: { q: string; a: string }[] = [
  { q: "Where's the Java?", a: "There isn't any — and that's correct for a web app. This runs on JavaScript (written as TypeScript), the only language browsers execute natively. Java is a separately-compiled language for a different job; the two share part of a name from 1995 marketing and nothing else." },
  { q: "Why Next.js instead of plain PHP or WordPress?", a: "This is a transactional records system with linked tables and role permissions, not a content-publishing site. WordPress is built for the latter. Next.js gives reusable components — one AssetFormDialog used everywhere an asset form is needed — and TypeScript catches a class of bugs before the code runs." },
  { q: "Is Row Level Security actually enforced, or just UI hiding?", a: "It's enforced at the database level on all 13 tables. Every policy is backed by is_active_user()/is_admin(), checked by Postgres on every query — even a request that bypassed this website entirely would still be blocked." },
  { q: "What data is real versus seeded/demo?", a: "Only categories (5 fixed rows) and offices (7 fixed rows) were seeded once, matching the thesis's own mockups. Everything else — every asset, officer, movement, receipt, alert, disposal, and login — was created through the app's own forms." },
  { q: "How does login work — where are passwords stored?", a: "Never touched by this codebase. Supabase Auth verifies credentials and issues a secure session cookie, refreshed on every request by proxy.ts." },
  { q: "What stops a Staff account from reaching an admin page by URL?", a: "Two independent checks: proxy.ts redirects unauthenticated visitors, and every admin page/action separately calls requireAdmin(), which re-checks the role from the database. That second check exists specifically because route-matching alone isn't trustworthy on its own." },
  { q: "Why print the sticker at issuance instead of at registration?", a: "At registration, nobody necessarily knows yet who the asset is going to. Printing before custody is known means guessing or leaving it blank — so the sticker page is linked from the point custody actually becomes known." },
  { q: "Does this send real email/SMS alerts?", a: "No. “Send Notifications” creates in-app alert rows only. There's no email/SMS service wired up — it's a manual scan-and-flag tool, not a push pipeline." },
  { q: "Why is disposal only one approval step?", a: "That matches the thesis's Chapter 1 scope, which excludes a full approval-routing engine. What exists is a compliant record with a single admin-only approval flag." },
  { q: "Is this actually free to run?", a: "Yes — GitHub, Vercel, and Supabase free tiers, as scoped from the start. If usage ever outgrows those limits, the same code moves to a paid tier of the same services; no rebuild required." },
];

const limitations = [
  "No real outbound notifications — alerts are in-app only, no email/SMS integration.",
  "No automated test suite or CI pipeline — verification so far has been manual, click-through testing.",
  "No scheduled background jobs — alert generation is triggered manually, not run on a timer.",
  "No pagination on list views — fine at current data volume, would need it at real municipal scale.",
  "No optimistic concurrency control — simultaneous edits to the same record are last-write-wins.",
  "No soft-delete or audit-log table — admin deletes are permanent with no change history.",
  "Single-tenant branding — “Municipality of Villanueva” is written directly into print templates, not a setting.",
  "No login rate limiting beyond Supabase Auth's own defaults.",
  "next-themes is present but inert — wired into the toast component from the shadcn scaffold, but there's no user-facing theme toggle.",
];

const reviewerQAs: { q: string; a: string }[] = [
  { q: "Is it fair to call Vercel and Supabase “hosting” too?", a: "Yes — both are hosting, they just host two different halves of the system. Vercel hosts and runs the actual application: it takes the code, builds it, and serves the pages when someone visits the URL. Supabase hosts the data side: the database, the login system, and the uploaded photos. Simple way to say it: Vercel is the storefront that's always open; Supabase is the warehouse and records room behind it that the storefront calls into whenever it needs information." },
  { q: "So is it “one hosts frontend, one hosts backend”?", a: "Close, but worth tightening — a panel likes to poke at exactly this. Vercel doesn't only host what the browser shows, it also runs the server-side part of the app (fetching data, handling form submissions) before the page ever reaches the browser. So Vercel hosts and runs the whole application, front and back. Supabase isn't “the backend” in the sense of running code at all — it's the data layer the app calls out to. Cleaner phrasing: Vercel runs the app. Supabase remembers everything the app needs to remember." },
  { q: "Is JavaScript the same thing as TypeScript?", a: "No — Section 1 above breaks this down properly (Java vs. JavaScript vs. TypeScript, one at a time), since it's really three concepts people mash into a single question. Short version: TypeScript is JavaScript with type-checking added on top, and it compiles down to plain JavaScript before it ever reaches a browser — so this project is written in TypeScript but runs as JavaScript." },
  { q: "What does “compile” or “build” actually mean here?", a: "It means turning the TypeScript/React source code into the plain HTML, CSS, and JavaScript a browser can run — checking types, bundling files together, and optimizing them along the way. That's the next build step, the exact one Vercel runs automatically on every push." },
  { q: "If Supabase holds the data, is Supabase “the website”?", a: "No — Supabase has no idea what the website looks like. It only stores data and answers requests for it. Its own dashboard shows tables and rows, not the property registry screen. The actual website — pages, layout, forms — is entirely defined by the Next.js code hosted on Vercel. Supabase is a service the website talks to, not the website itself." },
  { q: "If PHP works, why isn't it used here?", a: "PHP genuinely works — WordPress runs on it. It's not that PHP can't do this job, it's that plain PHP means hand-building everything Next.js and Supabase already hand us for free: reusable interactive components, type-checking that catches mistakes before code runs, permission rules enforced at the database itself instead of just the page, and a deploy pipeline triggered automatically by a git push. A modern PHP framework like Laravel gets closer, but that's rebuilding the same toolkit under a different name, still on older single-server hosting instead of this project's push-to-deploy pipeline." },
  { q: "Is this project mobile-friendly?", a: "Reasonably, yes, though it isn't mobile-first. Tailwind's responsive classes run throughout: the homepage's team grid reflows from four columns down to one on a phone, the sidebar collapses into a slide-out drawer on small screens (that's what useIsMobile() in use-mobile.ts is for), and dialogs resize to fit. What isn't fully optimized: the data tables (Asset Registry, Officers, Movement & Issuance, Records) scroll sideways on a phone instead of restacking as cards — a normal, honest trade-off for a back-office tool GSO staff mostly use at a desk, and a contained next step rather than a rebuild if this engagement continues." },
];

function SyntaxBreakdown({ items }: { items: [string, string][] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border/60">
      {items.map(([token, desc]) => (
        <div key={token} className="grid grid-cols-1 gap-1 p-2.5 sm:grid-cols-[220px_1fr] sm:gap-4">
          <code className="h-fit w-fit max-w-full rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-bold break-all text-primary">
            {token}
          </code>
          <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>
  );
}

const inputLineBreakdown: [string, string][] = [
  ["id=\"email\"", "Connects this input to its <Label htmlFor=\"email\"> above it, so clicking the label focuses the box. This is not what the server reads."],
  ["name=\"email\"", "This is what the server actually reads. When the form submits, formData.get(\"email\") matches this name, not the id."],
  ["type=\"email\"", "Tells the browser to show an email-style keyboard on mobile and do basic \"does this look like an email\" checking before it even submits."],
  ["required", "Tells the browser to block the form from submitting at all if this field is empty, before any of my own code even runs."],
];

const loginLineBreakdown: [string, string][] = [
  ["const", "Not let, because email is set once from the form data and never reassigned anywhere in this function. If a value won't change after I set it, const is the safer default — TypeScript actually stops the build if I try to reassign it later by mistake."],
  ["formData.get(\"email\")", "formData is the raw data the browser packaged up from the form. .get(\"email\") pulls the value out of whichever input has name=\"email\" — not id, name. That's how the browser and my code agree on which field is which."],
  ["as string", "This is TypeScript only, not plain JavaScript. formData.get() is typed to return more than one possible kind of value (it could technically be a string, a File, or null), so as string is me telling the compiler to trust that in this specific case it's a string. It changes nothing at runtime — it only changes what TypeScript lets me do with the value afterward."],
  ["await", "signInWithPassword doesn't answer instantly — it's a real request going out over the network to Supabase's servers. await pauses this function right there until that response actually arrives, instead of racing ahead to the next line with no answer yet."],
  ["const { error } = ...", "This is destructuring. signInWithPassword actually returns an object with more than one property on it (data and error), and instead of grabbing the whole object and writing result.error every time, { error } reaches in and pulls out just that one property into its own variable directly. I only need error here — if it comes back null, the sign-in worked."],
];

const assetsQueryBreakdown: [string, string][] = [
  ["supabase.from(\"assets\")", "Points the query at the assets table specifically."],
  [".select(\"*, categories(category_name)...\")", "The * means \"give me every column on the asset itself.\" categories(category_name) rides along on that same request and pulls in the related category's name through the foreign key, so I don't need a second, separate query just to show a category name next to each asset."],
  ["await", "Same reason as the login example — this is a real network call, so the function pauses here until Supabase actually answers."],
  ["const { data: assets } = ...", "Destructuring again, but this time with a rename. Supabase always hands back an object shaped like { data, error }. { data: assets } reaches in, grabs the data property, and immediately renames it to assets for the rest of the file — shorter than writing result.data everywhere, and assets reads clearer than data on a page with more than one query."],
];

const tableCellBreakdown: [string, string][] = [
  ["<TableCell>", "One of this project's table components — visually it's just a table cell, a <td>, in the end."],
  ["{ }", "Curly braces inside JSX mean \"stop treating this as plain text, run this as real TypeScript and print whatever it returns.\" Anything outside curly braces in JSX is static text; anything inside is a live value."],
  ["asset.asset_name", "Plain dot notation — reading the asset_name property off whichever asset object is currently being rendered, one per row of the table."],
];

const requireUserBreakdown: [string, string][] = [
  ["async function requireUser()", "Marked async because it calls getCurrentProfile() inside, which is itself a database lookup and needs await."],
  ["if (!profile || profile.status !== \"active\")", "The || means either condition alone is enough to fail the check: no profile at all, or a profile that exists but has been deactivated. !== reads as \"not equal to.\""],
  ["redirect(\"/login\")", "A Next.js function that immediately stops the rest of this function from running and sends the browser to a different page. Nothing after this line executes once it's called."],
  ["requireAdmin() calling await requireUser()", "Reuses the exact same check instead of duplicating it, then only adds the extra role check on top."],
];

const assetsRegistryQueryBreakdown: [string, string][] = [
  ["let query = ...", "let, not const, on purpose this time — a few lines below this (not shown here), the code conditionally adds more filters onto query depending on which filters the user picked, so it genuinely does get reassigned."],
  ["offices:assigned_office_id(office_name)", "The part before the colon (offices) is a rename, same idea as data: assets from the login example — Supabase would otherwise name this joined relation something less friendly, based on the foreign key column."],
  [".order(\"created_at\", { ascending: false })", "Sorts by the created_at column, ascending: false meaning newest first."],
];

const createMovementBreakdown: [string, string][] = [
  ["_prevState", "The leading underscore is a naming convention meaning \"this parameter is required by useActionState's function signature, but I don't actually use it in this function.\""],
  ["formData.get(\"officer_id\") ? Number(...) : null", "A ternary: \"if this value exists, convert it to a number; otherwise use null.\" Shorter than a full if/else for a one-line decision."],
  ["status === \"returned\" ? assignedDate : null", "Same ternary pattern, deciding what to store in returned_date based on the transaction type."],
  ["`PAR-${year}-${String(assignment.assignment_id).padStart(4, \"0\")}`", "A template literal — backticks let me drop live values directly into a string with ${ } instead of gluing pieces together with +. .padStart(4, \"0\") pads the number with leading zeros until it's 4 digits long, so 7 becomes \"0007\"."],
  ["error?.message ?? \"Failed to record transaction.\"", "Two things stacked. error?.message is optional chaining: if error happens to be null or undefined, the whole expression short-circuits instead of crashing on \".message\". ?? is nullish coalescing: if what's on the left is null or undefined, use the fallback text on the right."],
  ["(status === \"issued\" || status === \"transferred\") && docType && officerId", "Reads left to right: only proceed past this line if the status is one of those two, AND a document type was picked, AND an officer is actually attached to this transaction."],
];

const rlsFunctionsBreakdown: [string, string][] = [
  ["returns boolean", "This function always answers true or false, nothing else."],
  ["security definer", "Normally a database function runs with the permissions of whoever's calling it. security definer means it instead runs with the permissions of whoever created it — necessary here because it needs to read the profiles table, and I don't want to separately grant every user direct read access to that table just so this check can work."],
  ["auth.uid()", "A built-in Supabase function returning the ID of whoever is currently authenticated, based on their session — how the database knows who's asking without the application having to pass that in manually."],
  ["exists (select 1 from ...)", "A standard SQL pattern for \"does at least one matching row exist,\" without caring what's in it — select 1 is a placeholder, not a real column, since exists only checks whether the subquery returns anything at all."],
  ["where id = (select auth.uid()) and status = 'active'", "Both conditions have to be true for a row to count: the profile's own id has to match the logged-in user, and their status has to be active."],
];

const handleNewUserBreakdown: [string, string][] = [
  ["returns trigger", "This isn't a function I call directly — it's shaped specifically to run automatically in response to a database event (a trigger), a different kind of function in Postgres."],
  ["new.id, new.email", "Inside a trigger, new refers to the row that was just inserted — here, the brand-new auth.users row. new.id is that user's freshly-created ID."],
  ["coalesce(new.raw_user_meta_data->>'full_name', new.email)", "coalesce() returns the first value here that isn't null. ->>'full_name' reads the full_name key out of a JSON column. So this line says: use the full name if one was provided, otherwise fall back to their email address."],
  ["coalesce(..., 'staff')", "Same pattern, but the fallback is a plain literal: if no role was specified, default to 'staff' rather than 'admin' — a deliberate least-privilege default."],
];

const createStaffAccountBreakdown: [string, string][] = [
  ["!process.env.SUPABASE_SERVICE_ROLE_KEY", "process.env is how server-side code reads environment variables/secrets. The ! checks \"if this is missing\" — a guard so the app fails with a clear message instead of a confusing crash if that secret was never configured on the server."],
  ["user_metadata: { full_name: fullName, role }", "Building an object literal inline. role by itself (no colon) is shorthand for role: role — when a property name and the variable holding its value are spelled the same, JavaScript lets you skip repeating it."],
  ["admin.auth.admin.createUser(...)", "The service-role-only method that actually creates the login — this is what ultimately triggers handle_new_user() above, since it inserts into auth.users under the hood."],
];

const rlsGate1: string[] = [
  "Browser requests /dashboard/assets.",
  "proxy.ts checks the session cookie — no valid session, and it redirects straight to /login before anything else runs.",
  "The page calls requireUser() (or requireAdmin() on admin-only routes) — a second, independent check that re-reads the profile's own status/role from the database.",
  "Only once that passes does the code even attempt supabase.from(\"assets\").select(...).",
];

const rlsGate2: string[] = [
  "That query arrives at Postgres carrying the logged-in user's identity, via the Supabase session.",
  "Before returning a single row, Postgres evaluates the table's RLS policy — e.g. \"active users read assets\" checks is_active_user().",
  "is_active_user() runs its own separate query against profiles, right there inside the database. If it comes back false, Postgres quietly returns zero rows — not an error, just nothing — no matter what the application code upstream already decided.",
];

export default async function PublicDocumentationPage() {
  const supabase = await createClient();
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("logo_url")
    .eq("id", true)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <SiteLogo logoUrl={siteSettings?.logo_url} className="h-5 w-5 text-primary" />
            <span>GSO-PMS</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Back to homepage
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10 pb-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            A single, continuous technical reference for GSO-PMS &mdash; what
            this system does, why it was built this way, and how each part
            works, written for the team to read once and then explain
            confidently in a thesis defense.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2 border-y border-border/60 py-3">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <section id="stack" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">1. Tech Stack, Named and Justified</h2>
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Is Java used anywhere? No.</strong>{" "}
                But that question actually bundles three different things
                together, and it&apos;s worth pulling them apart before
                answering it:
              </p>
              <div className="divide-y divide-border rounded-lg border border-border/60">
                <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                  <p className="text-sm font-bold text-foreground">Java</p>
                  <p className="text-sm text-muted-foreground">
                    A general-purpose programming language used for things
                    like Android apps, enterprise backend systems, and
                    desktop software.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                  <p className="text-sm font-bold text-foreground">JavaScript</p>
                  <p className="text-sm text-muted-foreground">
                    The only programming language a web browser can run
                    directly &mdash; it&apos;s what makes a webpage
                    interactive.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                  <p className="text-sm font-bold text-foreground">TypeScript</p>
                  <p className="text-sm text-muted-foreground">
                    JavaScript with an extra layer added on top that checks
                    the code for mistakes before it ever runs.
                  </p>
                </div>
              </div>
              <p>
                Here&apos;s the clean way I&apos;d actually say it out loud:
                this project is written in TypeScript, but it runs as
                JavaScript. TypeScript is just JavaScript with type-checking
                added on top &mdash; think of it as JavaScript with a
                spellchecker built in, catching mistakes while I&apos;m
                writing instead of after a user hits an error. Once the
                project is built, that type-checking layer disappears, and
                what&apos;s left is ordinary JavaScript &mdash; the same
                language every browser runs. Java, on the other hand, has
                nothing to do with any of this &mdash; it&apos;s a completely
                different language for a completely different kind of job,
                and the two only share part of a name because of a 1995
                marketing decision, nothing technical. There&apos;s no Java
                file, no JVM, and no Android component anywhere in this
                project.
              </p>
            </CardContent>
          </Card>
          <div className="divide-y divide-border rounded-lg border border-border/60">
            {stackItems.map(([name, desc]) => (
              <div key={name} className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-[260px_1fr] sm:gap-4">
                <p className="font-mono text-sm font-bold text-primary">{name}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section id="why" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">2. Why This Stack</h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              The thesis&apos;s own Chapter 3 already specifies something closer to
              a small enterprise records system than a brochure site: an
              eleven-plus-table relational schema, role-based access, a
              physical document trail (PAR/ICS receipts), and compliance
              reporting. That shape of problem is what dictated every tool
              choice here.
            </p>
            <p>
              <strong className="text-foreground">Next.js over plain HTML/PHP or WordPress</strong>{" "}
              &mdash; hand-written PHP re-implements validation, queries, and
              auth on every page, which is slow to build correctly and easy to
              get wrong. WordPress is built for publishing content, not
              transactional, permissioned, relational data. Next.js gives
              reusable components: fix a bug once in{" "}
              <code className="rounded bg-muted px-1">AssetFormDialog</code>,
              it&apos;s fixed everywhere that form is used.
            </p>
            <p>
              <strong className="text-foreground">TypeScript specifically</strong> &mdash;{" "}
              <code className="rounded bg-muted px-1">database.types.ts</code>{" "}
              is generated directly from the live Supabase schema, so every
              query is checked against real columns at build time, not
              discovered broken in front of a user.
            </p>
            <p>
              <strong className="text-foreground">Supabase over a hand-rolled backend or Firebase</strong>{" "}
              &mdash; the schema is explicitly relational (assets &rarr;
              assignments &rarr; receipts), a natural fit for Postgres and a
              poor fit for a NoSQL document store. Supabase also provides Row
              Level Security, authentication, and file storage without any of
              them being hand-built here.
            </p>
            <p>
              <strong className="text-foreground">Vercel for hosting</strong> &mdash; automatic
              rebuild and republish on every GitHub push, HTTPS included, and
              one-click rollback if an update breaks something &mdash; less to
              maintain by hand than traditional shared hosting.
            </p>
          </div>
        </section>

        <Separator />

        <section id="tree" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">3. Full Project Tree, Explained</h2>
          <div className="space-y-2">
            {treeGroups.map((g) => (
              <div key={g.path} className="rounded-lg border border-border/60 p-3">
                <p className="font-mono text-xs font-bold text-primary">{g.path}</p>
                <p className="mt-1 text-sm text-muted-foreground">{g.note}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section id="flow" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">4. Architecture &amp; Data Flow</h2>
          <p className="text-sm text-muted-foreground">
            The overall pattern: Server Components fetch data directly from the
            database when a page loads; Server Actions handle every write.
            There&apos;s no separate hand-written REST/GraphQL layer for normal
            CRUD &mdash; Next.js Server Actions are that layer.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {flowSteps.map((step) => (
              <Card key={step.n}>
                <CardContent className="space-y-1.5 pt-6">
                  <p className="font-mono text-xs font-bold text-primary">{step.n}</p>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <p className="text-sm font-semibold">
              What steps 2 and 3 actually look like in code
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every protected page starts with one of these two, from{" "}
              <code className="rounded bg-muted px-1">src/lib/supabase/auth.ts</code>.
              In plain terms: <code className="rounded bg-muted px-1">requireUser()</code>{" "}
              checks there&apos;s a logged-in profile and that it hasn&apos;t
              been deactivated &mdash; if either check fails, it redirects to
              the login page before rendering anything.{" "}
              <code className="rounded bg-muted px-1">requireAdmin()</code>{" "}
              reuses that same check and adds one more on top: if the
              profile&apos;s role isn&apos;t admin, it sends them back to the
              regular dashboard instead. I call whichever one a page actually
              needs at the very top of the file, before any data gets
              fetched.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`export async function requireUser() {
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
}`}
            </pre>
            <SyntaxBreakdown items={requireUserBreakdown} />

            <p className="text-sm leading-relaxed text-muted-foreground">
              And this is the real query behind the Property Asset Registry
              &mdash; not a simplified stand-in &mdash; from{" "}
              <code className="rounded bg-muted px-1">src/app/dashboard/assets/page.tsx</code>.
              In plain terms: same <code className="rounded bg-muted px-1">*</code> and
              nested-relation trick as before, plus two more pieces:{" "}
              <code className="rounded bg-muted px-1">offices:assigned_office_id(office_name)</code>{" "}
              renames that joined relation to <code className="rounded bg-muted px-1">offices</code>{" "}
              so the rest of the code can just write{" "}
              <code className="rounded bg-muted px-1">asset.offices.office_name</code>, and{" "}
              <code className="rounded bg-muted px-1">.order()</code> sorts
              newest assets first before anything is even rendered.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`let query = supabase
  .from("assets")
  .select("*, categories(category_name), offices:assigned_office_id(office_name)")
  .order("created_at", { ascending: false });`}
            </pre>
            <SyntaxBreakdown items={assetsRegistryQueryBreakdown} />
          </div>

          <p className="text-sm text-muted-foreground">
            Concrete example &mdash; issuing an asset:{" "}
            <code className="rounded bg-muted px-1">MovementFormDialog</code>{" "}
            calls <code className="rounded bg-muted px-1">createMovement</code>,
            which inserts an{" "}
            <code className="rounded bg-muted px-1">asset_assignments</code>{" "}
            row, syncs the asset&apos;s{" "}
            <code className="rounded bg-muted px-1">assigned_office_id</code>,
            and &mdash; when issuing or transferring to a named officer &mdash;
            auto-generates a numbered{" "}
            <code className="rounded bg-muted px-1">par_records</code> or{" "}
            <code className="rounded bg-muted px-1">ics_records</code> row
            (e.g. <code className="rounded bg-muted px-1">PAR-2026-0007</code>),
            immediately viewable and printable at{" "}
            <code className="rounded bg-muted px-1">/dashboard/records/par/[id]</code>.
          </p>

          <div className="space-y-4 rounded-lg border border-border/60 p-4">
            <p className="text-sm font-semibold">
              The actual createMovement code, from{" "}
              <code className="rounded bg-muted px-1">src/app/dashboard/movements/actions.ts</code>
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`export async function createMovement(
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
        par_no: \`PAR-\${year}-\${String(assignment.assignment_id).padStart(4, "0")}\`,
        asset_id: assetId,
        officer_id: officerId,
        assignment_id: assignment.assignment_id,
        issue_date: assignedDate,
        remarks,
      });
    } else {
      await supabase.from("ics_records").insert({
        ics_no: \`ICS-\${year}-\${String(assignment.assignment_id).padStart(4, "0")}\`,
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
}`}
            </pre>
            <p className="text-sm leading-relaxed text-muted-foreground">
              In plain terms: this runs every time someone records an
              issuance, return, or transfer. I insert the new{" "}
              <code className="rounded bg-muted px-1">asset_assignments</code>{" "}
              row first, then immediately update the asset&apos;s own current
              custody so the registry always reflects the latest movement. If
              it was an issuance or transfer to a named officer, I
              auto-generate the matching PAR or ICS receipt with a document
              number built from the year and the assignment&apos;s own ID
              &mdash; so the numbering is automatic and can never collide. At
              the end I tell Next.js which pages just went stale, so they
              reload with fresh data the next time anyone views them.
            </p>
            <SyntaxBreakdown items={createMovementBreakdown} />
          </div>
        </section>

        <Separator />

        <section id="security" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">5. Database &amp; Security, Explained Plainly</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What&apos;s used</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              A hosted <strong className="text-foreground">PostgreSQL 17</strong>{" "}
              database on Supabase, across 13 tables: profiles, categories,
              offices, accountable_officers, assets, asset_assignments,
              par_records, ics_records, maintenance, disposal, alerts,
              team_members, and site_settings. No separate backend server
              exists outside of Next.js and Supabase.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Row Level Security &mdash; enabled on all 13 tables, no exceptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Two SQL helper functions back nearly every policy in the
                database. Here they are exactly as they exist in Postgres,
                not paraphrased:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`create function is_active_user() returns boolean
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
$$;`}
              </pre>
              <p>
                In plain terms: these are the two functions every RLS policy
                in this database is built on. Both do the same basic thing
                &mdash; look up the currently logged-in user&apos;s own row in{" "}
                <code className="rounded bg-muted px-1">profiles</code> and
                check something about it.{" "}
                <code className="rounded bg-muted px-1">is_active_user()</code>{" "}
                just checks <code className="rounded bg-muted px-1">status = &apos;active&apos;</code>.{" "}
                <code className="rounded bg-muted px-1">is_admin()</code>{" "}
                checks that plus <code className="rounded bg-muted px-1">role = &apos;admin&apos;</code>.
                Postgres runs one of these, silently, on every single query
                the app makes to a protected table.
              </p>
              <SyntaxBreakdown items={rlsFunctionsBreakdown} />
              <p>
                Everyday tables (assets, accountable_officers,
                asset_assignments, alerts, maintenance, par_records,
                ics_records, disposal) follow the same shape: any active user
                can read/insert/update &mdash; e.g. policy{" "}
                <code className="rounded bg-muted px-1">&quot;active users write assets&quot;</code>{" "}
                (INSERT, condition <code className="rounded bg-muted px-1">is_active_user()</code>)
                &mdash; while only an Admin can delete &mdash; policy{" "}
                <code className="rounded bg-muted px-1">&quot;admin delete assets&quot;</code>{" "}
                (DELETE, condition <code className="rounded bg-muted px-1">is_admin()</code>).
              </p>
              <p>
                Reference tables (categories, offices) are readable by any
                active user but only writable by an Admin.{" "}
                <code className="rounded bg-muted px-1">profiles</code> has no
                INSERT policy at all &mdash; new rows are created exclusively
                by a database trigger,{" "}
                <code className="rounded bg-muted px-1">handle_new_user()</code>,
                firing automatically when a new{" "}
                <code className="rounded bg-muted px-1">auth.users</code> row
                appears.{" "}
                <code className="rounded bg-muted px-1">team_members</code> and{" "}
                <code className="rounded bg-muted px-1">site_settings</code>{" "}
                are publicly readable (policy condition simply{" "}
                <code className="rounded bg-muted px-1">true</code>) since the
                homepage is unauthenticated, but writes still require{" "}
                <code className="rounded bg-muted px-1">is_admin()</code>.
              </p>

              <p>
                Here&apos;s <code className="rounded bg-muted px-1">handle_new_user()</code>{" "}
                itself, the trigger mentioned above:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`create function handle_new_user() returns trigger
  language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$;`}
              </pre>
              <p>
                In plain terms: this fires automatically the instant a new
                row shows up in Supabase&apos;s own{" "}
                <code className="rounded bg-muted px-1">auth.users</code>{" "}
                table &mdash; meaning the instant someone new signs up or
                gets created by{" "}
                <code className="rounded bg-muted px-1">createStaffAccount</code>.
                It&apos;s the only thing that&apos;s ever allowed to insert
                into <code className="rounded bg-muted px-1">profiles</code>,
                and it fills in the name and role from whatever metadata was
                passed in at account-creation time, falling back to sensible
                defaults if that metadata wasn&apos;t provided.
              </p>
              <SyntaxBreakdown items={handleNewUserBreakdown} />

              <p>
                File storage follows the same pattern: three public buckets
                (team-photos, officer-photos, branding) are readable by
                anyone, but every upload/update/delete policy checks{" "}
                <code className="rounded bg-muted px-1">is_active_user()</code>{" "}
                or <code className="rounded bg-muted px-1">is_admin()</code>{" "}
                depending on the bucket.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seeded vs. dynamic data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Only <code className="rounded bg-muted px-1">categories</code>{" "}
              (5 fixed rows) and <code className="rounded bg-muted px-1">offices</code>{" "}
              (7 fixed rows) were seeded once, directly in Supabase, matching
              the departments and categories already named in the thesis&apos;s own
              mockups &mdash; no seed script file exists in the repo. Every
              other row in the system &mdash; every asset, officer, movement,
              receipt, alert, and login &mdash; was created through the app&apos;s
              own forms.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Email + password via Supabase Auth. No public self-registration
              route exists anywhere &mdash; every account is created by an
              Admin through <code className="rounded bg-muted px-1">createStaffAccount</code>.
              Passwords are never stored or handled by this codebase directly.
              Session state is a secure cookie managed by{" "}
              <code className="rounded bg-muted px-1">@supabase/ssr</code>,
              refreshed on every request by{" "}
              <code className="rounded bg-muted px-1">proxy.ts</code>. Every
              protected page/action independently re-checks the role via{" "}
              <code className="rounded bg-muted px-1">requireUser()</code>/
              <code className="rounded bg-muted px-1">requireAdmin()</code>,
              since &mdash; as the comment in{" "}
              <code className="rounded bg-muted px-1">auth.ts</code> puts it
              &mdash; &quot;proxy.ts route matching alone is not sufficient.&quot;
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                createStaffAccount, the one function that intentionally bypasses RLS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                From{" "}
                <code className="rounded bg-muted px-1">src/app/dashboard/settings/actions.ts</code>:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`export async function createStaffAccount(
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
}`}
              </pre>
              <p>
                In plain terms: this is the only place in the entire codebase
                that creates a new login, and it&apos;s the one place that
                intentionally reaches for a more powerful client than
                everything else uses.{" "}
                <code className="rounded bg-muted px-1">requireAdmin()</code>{" "}
                runs first, so only an admin ever gets this far. Then, instead
                of the normal Supabase client every other action uses &mdash;
                the one RLS applies to &mdash; this calls{" "}
                <code className="rounded bg-muted px-1">createAdminClient()</code>,
                which authenticates with a secret service-role key instead of
                a user session and is allowed to bypass Row Level Security
                entirely. That&apos;s necessary here specifically because
                creating a brand-new login isn&apos;t something a logged-in
                user&apos;s own permissions should ever be able to do on
                their own.
              </p>
              <SyntaxBreakdown items={createStaffAccountBreakdown} />
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/50">
            <CardHeader>
              <CardTitle className="text-base">
                How an RLS check actually happens &mdash; two independent gates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                This is the part that&apos;s easy to say in one sentence but
                hard to actually picture: the app-level checks from Section 4
                and the database&apos;s own RLS checks are two separate
                systems that don&apos;t know about each other. Here&apos;s
                what happens end to end for one request to, say,{" "}
                <code className="rounded bg-muted px-1">/dashboard/assets</code>:
              </p>

              <div className="rounded-lg border border-border/60 bg-background p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Gate 1 &mdash; Application Layer
                </p>
                <div className="space-y-2">
                  {rlsGate1.map((step, i) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                        {i + 1}
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-center text-lg leading-none text-sky-600">&darr;</p>

              <div className="rounded-lg border border-sky-300 bg-sky-100/60 p-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-sky-800 uppercase">
                  Gate 2 &mdash; Database Layer (independent of Gate 1)
                </p>
                <div className="space-y-2">
                  {rlsGate2.map((step, i) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                        {i + 5}
                      </div>
                      <p className="text-xs leading-relaxed text-sky-900">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p>
                The point: even if step 2 or 3 somehow had a bug and let a
                request through it shouldn&apos;t have, step 6 would still
                block it &mdash; the database doesn&apos;t trust the
                application to have already checked. That&apos;s what{" "}
                <strong className="text-foreground">
                  &ldquo;RLS enforced at the database level, not just the
                  interface&rdquo;
                </strong>{" "}
                actually means in practice, not just as a talking point.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section id="features" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">6. Core Features, One by One</h2>
          <div className="space-y-3">
            {features.map((f) => (
              <Card key={f.name}>
                <CardHeader>
                  <CardTitle className="text-base">{f.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>{f.body}</p>
                  {f.code && (
                    <>
                      {f.codeFile && (
                        <p className="text-xs">
                          From <code className="rounded bg-muted px-1">{f.codeFile}</code>:
                        </p>
                      )}
                      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                        {f.code}
                      </pre>
                      {f.codeSummary && <p>{f.codeSummary}</p>}
                      {f.codeBreakdown && <SyntaxBreakdown items={f.codeBreakdown} />}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section id="faq" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">7. Likely Panel Questions, With Ready Answers</h2>
          <div className="space-y-3">
            {faqs.map((item) => (
              <Card key={item.q}>
                <CardHeader>
                  <CardTitle className="text-base">{item.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section id="limits" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">8. Limitations &amp; Possible Improvements</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {limitations.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Badge variant="outline" className="mt-0.5 h-5 shrink-0 px-1.5 text-[10px]">
                      note
                    </Badge>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            None of the above are hidden gaps &mdash; they&apos;re conscious
            trade-offs appropriate for a capstone-scoped system, each with a
            clear path forward if the project continues past thesis defense.
          </p>
        </section>

        <Separator />

        <section id="reviewer" className="scroll-mt-16 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">9. Reviewer Cheat Sheet</h2>
          <p className="text-sm text-muted-foreground">
            The concepts that come up most in conversation, explained the way
            you&apos;d actually say them out loud &mdash; not reworded code
            comments. Read this section once before a defense-prep session so
            it flows without needing to look anything up mid-explanation.
          </p>

          <Card className="border-sky-200 bg-sky-50/50">
            <CardHeader>
              <CardTitle className="text-base">
                The example that proves it: HTML input &rarr; TypeScript &rarr; Supabase &rarr; HTML output
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Step 1 &mdash; the HTML.</strong>{" "}
                The sign-in screen has this literal tag in{" "}
                <code className="rounded bg-muted px-1">src/app/login/page.tsx</code>:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`<input id="email" name="email" type="email" required />`}
              </pre>
              <p>
                That&apos;s pure HTML. It has no idea what a database is &mdash;
                it just sits there and waits for someone to type.
              </p>
              <SyntaxBreakdown items={inputLineBreakdown} />

              <p>
                <strong className="text-foreground">Step 2 &mdash; the TypeScript.</strong>{" "}
                When the form is submitted,{" "}
                <code className="rounded bg-muted px-1">src/app/login/actions.ts</code>{" "}
                runs:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`const email = formData.get("email") as string;
const password = formData.get("password") as string;
const { error } = await supabase.auth.signInWithPassword({ email, password });`}
              </pre>
              <p>
                This is the actual &ldquo;fetch&rdquo; &mdash; TypeScript
                reading what was typed into that HTML input, then making a
                real network call to Supabase.
              </p>
              <p>
                In plain terms: when someone submits the sign-in form, this
                function runs on the server. I pull the email and password
                straight out of the submitted form data, then hand both off
                to Supabase&apos;s own sign-in method &mdash; I&apos;m not
                writing any password-checking logic myself, Supabase handles
                that securely on its end. That&apos;s a real network call, so
                I use <code className="rounded bg-muted px-1">await</code>{" "}
                to pause the code until Supabase actually responds. What
                comes back includes an{" "}
                <code className="rounded bg-muted px-1">error</code> field,
                and that&apos;s the only piece I grab, because that&apos;s
                what tells me whether the login worked or not.
              </p>
              <SyntaxBreakdown items={loginLineBreakdown} />

              <p>
                <strong className="text-foreground">Step 3 &mdash; back to HTML, the other direction.</strong>{" "}
                On the Asset Registry,{" "}
                <code className="rounded bg-muted px-1">src/app/dashboard/assets/page.tsx</code>{" "}
                runs:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`const { data: assets } = await supabase.from("assets").select("*, categories(category_name)...");`}
              </pre>
              <p>
                In plain terms: here I&apos;m asking Supabase for every row
                in the assets table, and for each one, also pulling in its
                related category&apos;s name &mdash; one request instead of
                two separate queries. Since it&apos;s a network call, I wait
                for it with <code className="rounded bg-muted px-1">await</code>,
                and I grab just the data part of the response, naming it{" "}
                <code className="rounded bg-muted px-1">assets</code> so the
                rest of the page can use it directly.
              </p>
              <SyntaxBreakdown items={assetsQueryBreakdown} />
              <p>and then, further down the same file:</p>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`<TableCell>{asset.asset_name}</TableCell>`}
              </pre>
              <p>
                That second line <em>looks</em> like it&apos;s just sitting on
                the page as HTML. It isn&apos;t.{" "}
                <code className="rounded bg-muted px-1">asset.asset_name</code>{" "}
                is a live value that came out of the Supabase query a few
                lines above &mdash; every time that page loads, TypeScript
                asks the database fresh, and only then builds that{" "}
                <code className="rounded bg-muted px-1">&lt;td&gt;</code> tag
                with whatever the database currently says. Rename that asset
                in the database right now, and the very next page load shows
                the new name &mdash; nobody edited an HTML file.{" "}
                <strong className="text-foreground">
                  The HTML on that screen was never typed by a person;
                  TypeScript generated it, live, from Supabase, the moment the
                  page was requested.
                </strong>
              </p>
              <SyntaxBreakdown items={tableCellBreakdown} />
            </CardContent>
          </Card>

          <div className="space-y-3">
            {reviewerQAs.map((item) => (
              <Card key={item.q}>
                <CardHeader>
                  <CardTitle className="text-base">{item.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
