# Manual Repository Verification

Use this checklist after `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured locally.

## 1. Environment

- Add local values for:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Keep secrets out of git-tracked files.

## 2. Seed Baseline

- Ensure the schema migration and `supabase/seed.sql` have been applied.
- Confirm the default company exists in `public.companies`.

## 3. Quick Runtime Smoke Test

Use a temporary server-only script, route handler, or REPL to import:

```ts
import {
  ensureDefaultCompany,
  upsertLineUser,
  createDocument,
  createDocumentExtraction,
  createExpenseCase,
  linkDocumentToExpenseCase,
  approveExpenseCase,
  createAccountingReport,
  markReportGenerated,
  listAuditLogsByCompany,
} from "@/lib/repositories";
```

## 4. Suggested Verification Flow

1. Call `ensureDefaultCompany()` and confirm it returns one company row.
2. Call `upsertLineUser()` with a test `lineUserId`.
3. Call `createDocument()` for that company.
4. Call `createDocumentExtraction()` for the document.
5. Call `createExpenseCase()` with `amount`, `expenseDate`, and `description`.
6. Call `linkDocumentToExpenseCase()` for the created case and document.
7. Call `approveExpenseCase()`.
Expected:
- approval succeeds
- returned status is `approved`
- an audit log row is written
8. Call `createAccountingReport()` and then `markReportGenerated()`.
Expected:
- report status becomes `generated`
- an audit log row is written

## 5. Negative Approval Checks

Confirm `approveExpenseCase()` rejects when any of these are missing:

- `amount`
- `expense_date`
- `description`
- at least one linked document

Also confirm approval rejects when the case status is:

- `rejected`
- `exported`

## 6. Query Verification

- `listDocumentsByCompany()` should filter by `status`, `documentType`, and `sourceType`.
- `listExpenseCasesByMonth()` should filter by `companyId`, `month`, and optional `status`.
- `listAccountingReportsByMonth()` should filter by `companyId`, `month`, and optional `status`.
- `listAuditLogsForEntity()` and `listAuditLogsByCompany()` should return descending `created_at` order.
