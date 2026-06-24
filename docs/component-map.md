# Component Map

## App Routes

- `app/page.tsx`
  - base scaffold landing page
- `app/admin/page.tsx`
  - admin entry page with links to upload and document inbox
- `app/admin/upload/page.tsx`
  - server-rendered admin upload page
- `app/admin/upload/upload-form.tsx`
  - client upload form that submits multipart data to the admin upload API
- `app/admin/documents/page.tsx`
  - lightweight recent-documents placeholder page
- `app/api/line/webhook/route.ts`
  - LINE intake route from STEP 06
- `app/api/admin/documents/upload/route.ts`
  - web upload intake route from STEP 07
- `app/api/admin/documents/[id]/extract/route.ts`
  - protected admin API route that runs STEP 08 AI extraction for one stored document

## Domain And Infrastructure

- `lib/documents/intake.ts`
  - shared document creation flow for LINE and web upload channels
- `lib/documents/extractionPipeline.ts`
  - server-side STEP 08 orchestration for file download, AI extraction, extraction persistence, document updates, and audit logging
- `lib/admin/webUpload.ts`
  - web upload validation constants and helper functions
- `lib/storage/documents.ts`
  - document storage path building and Supabase Storage upload/download/signed URL helpers
- `lib/repositories/documents.ts`
  - document repository access
- `lib/repositories/documentExtractions.ts`
  - advisory extraction repository access
- `lib/repositories/auditLogs.ts`
  - audit log repository access
- `lib/repositories/companies.ts`
  - default company lookup and bootstrap helper
- `lib/ai/extractionSchema.ts`
  - shared STEP 08 extraction types, JSON schema, and validation logic
- `lib/ai/prompts.ts`
  - Thai accounting extraction prompt builder
- `lib/ai/openaiClient.ts`
  - minimal OpenAI Responses API wrapper for image extraction
- `lib/ai/extractDocument.ts`
  - image-first AI extraction service with safe PDF fallback

## Tests

- `tests/documents/intake.test.ts`
  - shared intake behavior coverage for LINE and web upload
- `tests/admin/webUpload.test.ts`
  - upload validation and success payload helper coverage
- `tests/ai/extractionSchema.test.ts`
  - extraction schema validation coverage
- `tests/ai/extractDocument.test.ts`
  - AI extraction normalization and PDF fallback coverage
- `tests/documents/extractionPipeline.test.ts`
  - end-to-end pipeline orchestration coverage with mocked dependencies
- `tests/admin/documentExtractRoute.test.ts`
  - admin extraction route success and failure response coverage
