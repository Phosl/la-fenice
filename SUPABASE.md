# Supabase rollout

The website works in email-only mode when Supabase variables are absent. The
timestamped migration adds inquiry persistence, managed bilingual content and a
private media bucket; it has **not** been applied to any remote project.

The public website now ships static `en`, `it`, `de` and `ru` dictionaries. The
existing migration deliberately still accepts only `en` and `it`; it was not
changed during the four-language rollout. Add German and Russian database
constraints, policies and migration tests only in the later Supabase phase.

## Deploy order

1. Configure and verify the Resend sending domain, then set
   `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL` and `INQUIRY_TO_EMAIL`.
2. Test the migration locally with `supabase db reset` (or against a disposable
   branch), including anon, viewer, editor and admin roles.
3. Apply `supabase/migrations/20260731120000_inquiries_content_media.sql` using
   the normal reviewed migration workflow.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in the server runtime.
   The service-role key must never use a `NEXT_PUBLIC_` prefix.
5. Promote the first administrator explicitly in the SQL editor or another
   service-role-only workflow, substituting the real Auth user UUID:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = '00000000-0000-0000-0000-000000000000';
   ```

New Auth users are always `viewer`; there is no browser policy that permits
self-promotion. Admins alone can read inquiry PII. Editors and admins can manage
content/media, while anonymous users can read only published records.

The `site-media` bucket is private. Reads are allowed only for objects linked to
a published `media_assets` row; serve them through Supabase's authenticated
download flow or server-generated signed URLs. Static content remains the site
fallback until the second-phase reader is enabled.

If the migration is not yet present, inquiry email delivery remains active and
the persistence adapter logs only `{scope, operation, resource, code,
requestId}`. Apply the migration and reload when codes such as `PGRST205` or
`42P01` appear. Logs intentionally exclude names, email addresses, phone
numbers, message text, tokens, cookies, SQL and IP addresses.
