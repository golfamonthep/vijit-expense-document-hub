import assert from "node:assert/strict";
import test from "node:test";

import { extractDocumentWithAI } from "../../lib/ai/extractDocument.ts";

const imageInput = {
  documentId: "doc-123",
  companyId: "company-123",
  mimeType: "image/png",
  fileName: "receipt.png",
  fileBuffer: Buffer.from([1, 2, 3]),
};

test("extractDocumentWithAI parses and normalizes a valid image extraction response", async () => {
  const result = await extractDocumentWithAI(imageInput, {
    callOpenAiForExtraction: async () => ({
      modelName: "gpt-4.1-mini",
      outputText: JSON.stringify({
        document_type: "receipt",
        expense_date: "2026-06-24",
        payment_date: null,
        vendor: "Vendor A",
        vendor_tax_id: null,
        description: "Printer ink",
        amount_before_vat: 100,
        vat_amount: 7,
        withholding_tax: 0,
        net_amount: 107,
        currency: "THB",
        payment_method: "cash",
        bank_name: null,
        transfer_ref: null,
        category_suggestion: "office_expense",
        confidence_score: 0.92,
        warnings: [],
        extracted_text_summary: "Receipt for printer ink",
      }),
    }),
  });

  assert.equal(result.modelName, "gpt-4.1-mini");
  assert.equal(result.extractionResult.document_type, "receipt");
  assert.deepEqual(result.warnings, []);
});

test("extractDocumentWithAI throws a safe parse error for malformed JSON output", async () => {
  await assert.rejects(
    () =>
      extractDocumentWithAI(imageInput, {
        callOpenAiForExtraction: async () => ({
          modelName: "gpt-4.1-mini",
          outputText: "{not-json",
        }),
      }),
    /json/i,
  );
});

test("extractDocumentWithAI preserves model warnings and adds validation warnings", async () => {
  const result = await extractDocumentWithAI(imageInput, {
    callOpenAiForExtraction: async () => ({
      modelName: "gpt-4.1-mini",
      outputText: JSON.stringify({
        document_type: "receipt",
        currency: "THB",
        payment_method: "unknown",
        confidence_score: 0.64,
        warnings: ["model could not read vendor clearly"],
        vendor: 77,
      }),
    }),
  });

  assert.equal(result.extractionResult.vendor, null);
  assert.equal(result.warnings.length, 2);
  assert.match(result.warnings[0] ?? "", /vendor/i);
  assert.match(result.warnings[1] ?? "", /model could not read vendor clearly/i);
});

test("extractDocumentWithAI returns a safe warning result for unsupported pdf input", async () => {
  const result = await extractDocumentWithAI(
    {
      ...imageInput,
      mimeType: "application/pdf",
      fileName: "receipt.pdf",
    },
    {
      callOpenAiForExtraction: async () => {
        throw new Error("should not be called for unsupported pdf");
      },
    },
  );

  assert.equal(result.extractionResult.document_type, "pdf");
  assert.equal(result.extractionResult.currency, "THB");
  assert.equal(result.extractionResult.payment_method, "unknown");
  assert.equal(result.extractionResult.confidence_score, 0);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0] ?? "", /pdf/i);
});
