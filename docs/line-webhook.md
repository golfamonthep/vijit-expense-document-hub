# LINE Webhook

## Webhook URL

`https://YOUR_DOMAIN/api/line/webhook`

## Required Environment Variables

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DOCUMENTS_BUCKET`

These values are only required at runtime. `next build` should still work without real LINE or Supabase secrets.

## Local Testing

1. Expose your local app with a tunnel such as `ngrok` so LINE can reach `/api/line/webhook`.
2. Set local env values for `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DOCUMENTS_BUCKET` without committing `.env` files.
3. Configure the LINE Messaging API webhook URL to your tunnel URL plus `/api/line/webhook`.
4. Send test messages from LINE:
   - `#เธฃเธฒเธขเธเนเธฒเธข`
   - `#เธเธเธฃเธฒเธขเธเธฒเธฃ`
   - `help`
   - `เธงเธดเธเธตเนเธเน`
   - image upload
   - file upload

## What STEP 06 Supports

- Verifies the LINE webhook signature before business logic runs
- Parses webhook JSON safely
- Keeps the STEP 05 text command behavior intact
- Downloads LINE image and file message content by `messageId`
- Enforces a 10 MB max file size
- Uploads incoming binaries to Supabase Storage
- Creates `documents` rows using the document-first model
- Writes best-effort audit logs for receipt, success, and failure paths
- Replies with a short document id when saving succeeds
- Replies with a safe Thai configuration message when runtime storage settings are missing

## Intentionally Not Implemented Yet

- AI extraction
- dashboard or review UI
- web upload UI
- Word generation
- document-to-expense matching
- approval workflow
- Vercel environment variable changes

## Audit Logging Note

Webhook audit logging is best-effort. If Supabase admin env vars are missing, the route should still build and handled image or file events should still return `200` to LINE after signature verification.

## Secrets And Deployment

- Real secrets will be configured later in Vercel and must not be committed.
- Do not create or commit `.env` or `.env.local`.
- `SUPABASE_DOCUMENTS_BUCKET` should normally be set to `documents`.
- Heavy downstream processing can move to background jobs later; the current webhook remains a short Node.js runtime path compatible with Vercel.

## Current Limitation Summary

- No AI extraction yet
- No expense case matching yet
- No review dashboard yet

## Next Step

Add the next processing stage after intake, such as AI extraction or expense-case matching, while keeping documents as the root record.
