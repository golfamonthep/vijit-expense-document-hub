# Project State

## Current Status

- STEP 06 baseline already handled LINE document intake into Supabase Storage and `documents`
- STEP 07 now adds web upload intake through the admin app
- STEP 08 now adds backend AI extraction for stored documents through an admin API route

## STEP 08 Completed Work

- added shared AI extraction schema validation in `lib/ai/extractionSchema.ts`
- added Thai accounting extraction prompt and OpenAI client wrapper
- added `extractDocumentWithAI()` for image-first extraction and safe PDF fallback
- added `runDocumentExtraction(documentId)` pipeline on top of the repository and storage layers
- added `POST /api/admin/documents/[id]/extract`
- reused the temporary `ADMIN_SECRET` protection pattern for the extraction route
- added AI extraction docs and updated intelligence files

## Known Limitations

- admin protection is temporary and secret-based, not a full login system
- runtime upload still requires Supabase storage env to be configured
- AI extraction currently supports JPEG, PNG, and WEBP only
- PDF extraction is limited to a safe warning path
- no extraction UI, matching, review, or preview workflow yet

## Connected Services

- GitHub repository is connected
- Vercel project is connected to GitHub and may deploy automatically on push
- production secrets are still expected to be configured later

## Next Recommended Step

Implement the first human review flow on top of extracted documents, including private preview access, extraction result display, and reviewer-controlled field correction before any matching or approval logic.
