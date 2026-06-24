# AI Extraction

## STEP 08 Summary

STEP 08 adds the first backend-only AI extraction pipeline for stored documents.

It allows a protected admin API route to:

- load a stored document from Supabase Storage
- run OpenAI-based extraction for supported image files
- validate the AI output before trusting it
- save advisory results to `document_extractions`
- update the `documents` row to `extracted`
- write an `ai_extraction_run` audit log

This step remains document-first and does not create expense cases or approve accounting records.

## Supported File Types

- `image/jpeg`
- `image/png`
- `image/webp`

Current PDF handling is intentionally limited:

- `application/pdf` returns a safe warning result
- no OCR package or PDF conversion dependency is added in STEP 08

## API Endpoint

- `POST /api/admin/documents/:id/extract`

Request body:

```json
{
  "admin_secret": "optional-secret-when-configured"
}
```

Success response:

```json
{
  "document_id": "doc-id",
  "status": "extracted",
  "document_type": "receipt",
  "confidence_score": 0.92,
  "warnings": []
}
```

Failure behavior:

- returns `401` for an invalid `ADMIN_SECRET`
- returns `503` when required runtime env is missing
- returns `500` for other extraction failures without exposing secrets

## Required Env Vars

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DOCUMENTS_BUCKET`

Build should not require real values for these env vars. Missing values fail safely at runtime only.

## Current Limitations

- no batch extraction
- no automatic expense case matching
- no auto approval
- image-first support only
- PDF support is limited to a safe warning path
- extraction runs inline in the request path, so large files may eventually need a background job design

## Manual Test Steps

1. Upload a JPEG, PNG, or WEBP document through the existing admin upload flow.
2. Copy the returned `documentId`.
3. Send a `POST` request to `/api/admin/documents/{documentId}/extract`.
4. Include `{ "admin_secret": "..." }` when `ADMIN_SECRET` is configured.
5. Confirm the API returns `status = "extracted"` with a confidence score and warnings array.
6. Confirm `document_extractions` contains the advisory extraction record.
7. Confirm the `documents` row status becomes `extracted`.
8. Confirm an `audit_logs` row exists with `action = "ai_extraction_run"`.
