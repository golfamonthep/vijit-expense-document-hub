# Web Upload Inbox

## STEP 07 Summary

STEP 07 adds a minimal web upload path for the document inbox.

Flow:

- authorized admin opens `/admin/upload`
- browser submits multipart form data to `POST /api/admin/documents/upload`
- server validates file size, MIME type, and temporary admin secret
- server stores the file in Supabase Storage
- server creates a `documents` row with `source_type = web_upload`
- server writes audit log action `web_document_uploaded`

## URLs

- Upload page: `/admin/upload`
- Documents placeholder: `/admin/documents`
- Upload API: `POST /api/admin/documents/upload`

## Supported File Types

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`
- `application/octet-stream` only when the filename extension safely maps to one of the supported types

## Required Environment Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DOCUMENTS_BUCKET`
- `ADMIN_SECRET` for production protection

Build does not require live secrets. Missing runtime storage env fails gracefully at request time.

## Storage Requirement

Uploads use the existing private document bucket from `SUPABASE_DOCUMENTS_BUCKET`.

Storage path format remains:

`companies/{companyId}/documents/{yyyy}/{mm}/{documentId}.{ext}`

## Current Limitations

- temporary protection uses a shared admin secret field instead of full authentication
- no OCR or AI extraction yet
- no review dashboard yet
- no document preview or signed URL UI yet
- uploaded notes are only captured in the upload audit payload for now

## Next Recommended Step

Build the document inbox review screen that lists stored documents with reviewer-safe metadata, status filtering, and server-side signed preview links.
