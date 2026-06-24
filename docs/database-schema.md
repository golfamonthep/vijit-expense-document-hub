# Database Schema

## STEP 08 Impact

STEP 08 does not add a new migration or change the SQL schema baseline.

It reuses the existing document-first tables from the existing baseline:

- `companies`
- `documents`
- `document_extractions`
- `audit_logs`

## Tables Used By AI Extraction

### `documents`

The extraction pipeline now updates:

- `status = extracted`
- `document_type = {extracted type}` only when the AI result is not `unknown`

This step does not mark any document as matched, approved, or review-complete.

### `document_extractions`

STEP 08 writes one advisory extraction row per extraction run with:

- `document_id`
- `model_name`
- `raw_text`
- `extracted_payload`
- `confidence_score`
- `warnings`

### `audit_logs`

STEP 08 writes:

- `action = ai_extraction_run`
- `entity_type = document`
- `entity_id = {documentId}`
- payload summary including model name, extracted document type, confidence score, and warning count

## Storage Convention

Stored files remain in Supabase Storage and are read back from the existing `documents.storage_bucket` and `documents.storage_path` fields during extraction.

Path format remains:

`companies/{companyId}/documents/{yyyy}/{mm}/{documentId}.{ext}`

## Follow-Up Note

If future steps need extraction job state, retry tracking, reviewer assignment, or extracted field promotion into review tables, add those through a deliberate migration instead of overloading the current advisory extraction baseline.
