# Verification — 29 October 2026

## Passed

- TypeScript compilation and production build.
- All twelve public URLs return 200 with individual social metadata and no unresolved content placeholders.
- Chrome layouts at 390×844 and 768×1024 have no horizontal overflow; desktop checked at 1440×900.
- Mobile navigation opens/closes; comparison project switching updates images/title and keyboard arrow keys move the divider.
- A browser-submitted synthetic booking returns its saved reference.
- API booking with a generated test JPEG persists one photo row; the storage bucket is private.
- Anonymous CMS/photo access returns 403. Cross-origin booking submission is rejected. Past dates are rejected. Repeated request IDs return the existing reference.
- Database tests reject two accepted visits in the same window and keep content drafts private until publication. Test mutations were rolled back.
- All eight data tables have RLS and deny direct client access. Security advisors report only the intentional no-policy informational notices.

## Pending before handover

- Local Auth callback configured and the provider accepted an owner sign-in email request. Verify delivery and full signed-in CMS review; configure the final production origin/callback after deployment.
- Verify editor restrictions, content publishing/restoration and booking assignment through authenticated browser sessions.
- Browser file selection needs the Chrome extension’s “Allow access to file URLs” permission; API upload was verified independently.
- Connect GitHub to Vercel and verify the deployed flow after the user completes the commercial hosting plan setup.
- Agree real availability, price labels, privacy arrangements and notification delivery with the business before switching off test mode.

No booking emails are sent, appointments are not automatically confirmed, and no payment is taken. Two clearly marked synthetic requests remain available for owner review.

## Navigation/footer refinement — 30 October 2026

Full-screen navigation verified at 390×844 and desktop width: overlay matches the viewport, background scrolling is locked, keyboard focus wraps, Escape closes it and returns focus to the trigger. Navbar logo is white through a CSS filter and the duplicate written brand name is removed. Footer has service, project, contact and studio information links with no horizontal overflow at checked widths. Decorative Unicode ornaments are replaced with inline SVG. Opening/link stagger and closing animations respect reduced-motion preference.
