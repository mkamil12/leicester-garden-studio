# Deployment & handover

GitHub source: `mkamil12/leicester-garden-studio`.
Supabase project: `zgztpbkjickoivadhivu`, London region, organisation selected by the user.
Vercel intended project: `mma-garden-studio`, Kamil workspace.

## Environment

Vercel needs only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (the verified stable website URL)

The Supabase Edge Function uses the platform’s built-in server credential. It is not copied into Vercel. The studio owner allowlist is in the function; the owner can add separate editor/admin accounts through the team screen. Every request rechecks membership.

## Database

Apply the committed migration in `supabase/migrations/`, deploy `supabase/functions/garden-api/`, and verify security advisers. The `garden-photos` bucket is private. Public visitors cannot directly read bookings, membership, audit data or photos.

Add the actual Vercel origin and `/auth/callback` redirect URL in Supabase Auth settings. Use an approved SMTP provider for client/team auth delivery when required by Supabase limits. An owner sign-in request can send an authentication email; booking requests do not send notifications in this version.

## Preview and production

The preview is deliberately `noindex` with a discreet footer notice. The top concept banner is removed. Generated hero imagery is distinguished from real company project photos. Keep test mode enabled until the business accepts the proposal and authorises real data collection.

The Vercel account was observed on Hobby during setup. Vercel restricts commercial use to Pro/Enterprise; the user must choose and complete any paid upgrade before this commercial sales preview is deployed there. No plan purchase is authorised or executed by this repository.

## Acceptance

Test desktop, phone and tablet layouts, the comparison slider, project switching, mobile navigation, service pages and sharing images. Submit a synthetic request with a test image; check the database record and private storage object. Verify anonymous admin/photo access is rejected, the owner can review it, a second accepted visit in the same window is rejected, editor publication is forbidden, and public content changes only after publish. Test restoration and agree a backup/export process before handover.
