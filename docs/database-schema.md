# Database Schema

## STEP 07 Impact

STEP 07 does not add a new migration or change the SQL schema baseline.

It reuses the existing document-first tables from STEP 06:

- `companies`
- `documents`
- `audit_logs`

## Tables Used By Web Upload

### `documents`

Web uploads create rows with:

- `company_id`
- `source_type = web_upload`
- `source_channel_id = admin_upload`
- `source_user_id = null`
- `original_file_name`
- `mime_type`
- `storage_bucket`
- `storage_path`
- `document_type`
- `status = received`
- `received_at`

### `audit_logs`

Web uploads write:

- `action = web_document_uploaded`
- `entity_type = document`
- `entity_id = {documentId}`
- payload summary including source type, channel, storage target, document type, and optional note

## Storage Convention

Uploaded files stay in Supabase Storage and are referenced from `documents`.

Path format:

`companies/{companyId}/documents/{yyyy}/{mm}/{documentId}.{ext}`

## Follow-Up Note

If future steps need reviewer assignment, uploader identity, or richer web-note persistence, that should be introduced deliberately with a schema migration instead of overloading the current intake baseline.
