import assert from "node:assert/strict";
import test from "node:test";

import { buildDocumentStoragePath } from "../../lib/storage/documents.ts";

test("buildDocumentStoragePath uses company, year, month, and extension", () => {
  const path = buildDocumentStoragePath({
    companyId: "company-123",
    documentId: "doc-456",
    extension: ".pdf",
    receivedAt: "2026-06-24T10:30:00.000Z",
  });

  assert.equal(path, "companies/company-123/documents/2026/06/doc-456.pdf");
});
