# Invoice Studio

A small invoice app for Igor, built from the PRD and Database Schema in `docs/`.

The local app is built. Publishing was attempted but the environment could not reach the hosting Git service, so the planned hosted URL is not yet live. The supplied Supabase migration and redirect settings were confirmed by Igor.

## What works

- Supabase email/password registration, login, logout and password reset.
- One business profile per account, saved customers and customer archiving.
- Standard and advance invoices with editable drafts and reusable customer details.
- Decimal quantities, prices and tax rates; totals calculated again in PostgreSQL.
- Atomic invoice numbering, locked issued invoices, paid/cancelled states and overdue indicators.
- Invoice duplication with a new number assigned only when the copy is issued.
- Downloadable A4 PDFs with embedded fonts, tax breakdowns, repeated table headers and page numbers.
- Search, filters, pagination and a responsive interface.
- A clearly labelled sample workspace held only in memory. It never writes sample data to Supabase.

## Start on your computer

1. Install Node.js 22.13 or later (Node 24 LTS is suitable), Git and VS Code.
2. Open this folder in VS Code, then open its terminal.
3. Run `npm ci`.
4. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key.
5. Apply the database migration described below if you have not already done so.
6. Run `npm run dev:next` and open the address printed in the terminal.

The normal Next.js development server uses port 3000. `npm run dev` uses the included Vinext development adapter on port 5173. Your app source works with either.

## Supabase setup

The current project was connected using Igor's supplied project URL and public publishable key. These are in the ignored local `.env.local`, not in the source repository or source ZIP. Re-enter them when moving the project.

1. Open your Supabase project → SQL Editor.
2. Run `supabase/migrations/202609230001_invoice_studio.sql` **once**. Igor has already confirmed running this initial migration in the connected project.
3. Open Authentication → URL Configuration. Set Site URL to your deployed app URL, and add redirect URLs for:
   - `http://localhost:3000/**` for Next.js local development.
   - `http://127.0.0.1:5173/**` for the portable preview.
   - `https://igors-invoice-studio.nt3dvizualizacijos.chatgpt.site/**` for the planned private deployment.
4. Keep email confirmation enabled and create your account through the app. Confirm the email, then sign in.
5. For public use, configure your own SMTP service in Supabase. Its default email service is limited and may restrict recipients or throttle signups.

### Google login

To enable the `Continue with Google` button:

1. In Google Cloud Console, create an OAuth 2.0 Web application client.
2. Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as an authorized redirect URI.
3. In Supabase, open Authentication -> Providers -> Google, enable it, and enter the Google client ID and secret.
4. Keep the app URLs above in Supabase Authentication -> URL Configuration.

Google login is separate from Gmail sending; this connection only authenticates the user with their Google account.

Only the project URL and **publishable/anon** key belong in frontend environment settings. Never use a service-role key, secret key or database password. Public keys are bundled into the browser app by design. The database requires authenticated identity and authorizes every action.

## How the data is protected

The six application tables live in the separate `invoice_studio` schema. They have row-level security enabled, no direct anonymous/authenticated table grants, and no permissive policies. Public `studio_*` RPC functions are the only application interface. They use a fixed empty search path and derive the owner from `auth.uid()`. Financial writes lock the invoice row and run in a transaction. The browser never chooses the owner or official totals.

This differs from exposing tables directly through the Supabase API: keep the private schema unexposed. The app does not require a server secret. Authentication credentials and sessions are managed by Supabase Auth. Final invoice party details are frozen snapshots. Account deletion, credit notes and partial payments are intentionally outside this MVP.

## Files to learn first

| File | Purpose |
| --- | --- |
| `app/page.tsx` | App entry point |
| `components/studio.tsx` | Workspace, navigation and actions |
| `components/auth-screen.tsx` | Supabase account screens |
| `components/invoice-editor.tsx` | Invoice form |
| `components/invoice-detail.tsx` | Invoice preview and actions |
| `app/studio.css` | Visual design and responsive rules |
| `lib/invoice.ts` | Decimal calculations and draft defaults |
| `lib/pdf.ts` | A4 PDF layout and downloads |
| `lib/supabase.ts` | Public connection and RPC calls |
| `supabase/migrations/` | Database tables and secure operations |
| `tests/` | Calculation and database integrity checks |

`components/ui` contains reusable interface primitives. `scripts` includes development/build helpers. `.openai/hosting.json` is used by the current private Sites host; you do not need it for another host.

## Checks and production builds

```sh
npm run typecheck
npm test
npm run build:next
```

Next.js exports the static frontend into `out/`. Host that folder on any static host with HTTPS. Supabase remains the authentication/database backend; no local Node server is needed for the deployed app.

The desktop environment used to build this project restricts child processes, so a portable single-process build is also provided:

```sh
npm run build:portable
npm run preview
```

This builds the same React app and CSS to `out/` and serves it on port 5173. It does not use SSR. Normal Next.js and Vinext flows remain available for your own computer.

## Move to GitHub

1. Extract the source ZIP, open its folder in VS Code and run `git init` if it is not already a repository.
2. Create an empty private GitHub repository.
3. Use VS Code Source Control → Publish to GitHub, or add the new repository as a Git remote and push.
4. Keep `.env.local`, `node_modules`, `out`, `.next` and `.sites-runtime` out of Git; the included `.gitignore` already does this.
5. On another computer, clone the repository, run `npm ci`, create `.env.local`, then run `npm run dev:next`.

For another hosting provider, use `npm run build:next` and publish `out/`; add the two `NEXT_PUBLIC_SUPABASE_*` environment values before building. Update Supabase's redirect URLs for the new domain. Your data stays in Supabase, so moving the frontend does not require exporting invoices.

## Scope and verification

Currencies are EUR, USD and GBP, all with two decimal minor units. The application day uses Europe/Vilnius. Prices are tax-exclusive; tax is calculated per line using round half up. Status tracking is manual. Downloads use saved, authorized invoice data and client-side PDF generation; PDFs are not stored publicly.

The dashboard currently loads the owner's invoice set and paginates it in the browser, suitable for this small MVP. Add server-side pagination before large-scale use. No audit-history ledger is included. Confirm invoice wording and tax requirements for the intended country before using the app for official accounting.

Automated checks cover SQL migration application, ownership isolation, forbidden direct access, statuses, numbering retry behavior, immutable issued invoices, decimal calculations and duplication. The live backend rejects anonymous calls as expected. Email delivery, real-account signup/login and hosted password recovery should be checked with your own account; automated checks do not claim to verify them.

References: [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords), [Supabase database security](https://supabase.com/docs/guides/database/postgres/row-level-security).
