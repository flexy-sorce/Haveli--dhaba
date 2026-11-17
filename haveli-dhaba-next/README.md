# Haveli Dhaba (Next.js + Supabase)

Public website, booking forms, and an admin panel (bookings, menu, gallery, settings).

**Honest status:** all code is written, but it has NOT been installed, built or run against a real Supabase project (the authoring environment had no network). Expect to fix small issues on first `npm run build`. Without Supabase variables the public site still renders from bundled defaults, but booking forms will show an error rather than a false success.

## Features
- Public site (`src/components/SiteClient.tsx`): hero, highlights, about, menu with search and tabs, family and kids, gallery with lightbox, rating, venue enquiry, contact and map, Instagram, footer, Book a Table dialog.
- Online food ordering at `/order` with delivery/takeaway, server-calculated totals, COD, optional verified Razorpay UPI, tracking, and admin status management.
- Content comes from Supabase (`src/lib/content.ts`), falling back to `src/data/defaults.ts`. Prices stay hidden until an admin enters one.
- Bookings: forms POST to `/api/bookings` (server-side zod validation, IST past-date check, honeypot, 3-per-10-min limit per phone, duplicate check). Success is shown only after the insert returns. Status is always `pending`. Admin must set `confirmed`.
- Admin (`/admin`): bookings (filter, search, status, private notes), menu CRUD with optional prices, gallery upload/caption/reorder/delete, website settings.

## Setup
1. Create a Supabase project. Authentication > Providers > Email: **disable "Allow new users to sign up"**.
2. SQL editor, run in order: `supabase/migrations/0001_init.sql`, `0002_seed_menu.sql`, `0003_online_orders.sql`, then `0004_order_payment_hardening.sql`. The menu seed contains dish names only; it deliberately does not invent prices. The final migration ties Razorpay payment orders to their local order and requires delivery orders to have an address.
3. Authentication > Users > Add user (admin email and strong password), then run:
   `insert into admin_profiles(id) select id from auth.users where email='YOU@example.com';`
4. `cp .env.example .env.local` and fill the URL, anon key and service-role key (Project Settings > API). The service-role key is server-only. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` only when a Razorpay account is configured for UPI; otherwise UPI is clearly disabled and COD remains available.
5. `npm install && npm run build && npm run dev`, then open `/` and `/admin/login`.

## Security model
- `table_bookings` and `venue_enquiries` have no anon policies; the browser can neither read nor write them. Only the server API (service role) inserts.
- Admin = a row in `admin_profiles`. Checked in middleware (login redirect), every admin page and server action, and by RLS (`is_admin()`).
- Gallery bucket: public read, admin-only write, JPG/PNG/WebP up to 5 MB.
- The service-role client lives in `src/lib/supabase/service.ts` (`server-only`), imported only by the API route.

## Test checklist after setup
Save at least one confirmed menu price and optional photo URL in `/admin/menu`, set the delivery fee in `/admin/settings`, then add it from `/order`. Confirm the server-calculated subtotal and delivery fee, place a COD order, track it with order number + phone, and update it from `/admin/orders`. With both Razorpay variables configured, test UPI in Razorpay test mode and confirm the order is marked paid only after signature verification. Also submit both existing booking forms and confirm rows appear in `/admin/bookings`; try a second identical booking (should be refused); log in with a non-admin user (should be bounced); upload a gallery image.

## Deploy (Netlify, free)
Push this project to a GitHub repo, then Netlify > Add new site > Import from Git. `netlify.toml` sets the build command and Node 20; Netlify detects Next.js automatically. Before the first deploy add these environment variables in Site configuration > Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (values from Supabase Project Settings > API). Redeploy after changing any variable.
