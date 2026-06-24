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

## Domain And Infrastructure

- `lib/documents/intake.ts`
  - shared document creation flow for LINE and web upload channels
- `lib/admin/webUpload.ts`
  - web upload validation constants and helper functions
- `lib/storage/documents.ts`
  - document storage path building and Supabase Storage upload/signed URL helpers
- `lib/repositories/documents.ts`
  - document repository access
- `lib/repositories/auditLogs.ts`
  - audit log repository access
- `lib/repositories/companies.ts`
  - default company lookup and bootstrap helper

## Tests

- `tests/documents/intake.test.ts`
  - shared intake behavior coverage for LINE and web upload
- `tests/admin/webUpload.test.ts`
  - upload validation and success payload helper coverage
