import assert from "node:assert/strict";
import test from "node:test";

import {
  validateExtractionResult,
  type ExtractionResult,
} from "../../lib/ai/extractionSchema.ts";

function buildValidExtraction(): ExtractionResult {
  return {
    document_type: "receipt",
    expense_date: "2026-06-24",
    payment_date: "2026-06-24",
    vendor: "Vijit Store",
    vendor_tax_id: "0105551234567",
    description: "Office supplies",
    amount_before_vat: 100,
    vat_amount: 7,
    withholding_tax: 0,
    net_amount: 107,
    currency: "THB",
    payment_method: "transfer",
    bank_name: "SCB",
    transfer_ref: "REF123",
    category_suggestion: "office_expense",
    confidence_score: 0.94,
    warnings: ["amount inferred from image"],
    extracted_text_summary: "Receipt from Vijit Store for office supplies.",
  };
}

test("validateExtractionResult accepts a fully valid extraction payload", () => {
  const result = validateExtractionResult(buildValidExtraction());

  assert.deepEqual(result.result, buildValidExtraction());
  assert.deepEqual(result.warnings, []);
});

test("validateExtractionResult normalizes missing optional fields to null", () => {
  const result = validateExtractionResult({
    document_type: "slip",
    currency: "THB",
    payment_method: "unknown",
    confidence_score: 0.51,
    warnings: [],
  });

  assert.deepEqual(result.result, {
    document_type: "slip",
    expense_date: null,
    payment_date: null,
    vendor: null,
    vendor_tax_id: null,
    description: null,
    amount_before_vat: null,
    vat_amount: null,
    withholding_tax: null,
    net_amount: null,
    currency: "THB",
    payment_method: "unknown",
    bank_name: null,
    transfer_ref: null,
    category_suggestion: null,
    confidence_score: 0.51,
    warnings: [],
    extracted_text_summary: null,
  });
});

test("validateExtractionResult rejects out-of-range confidence scores", () => {
  assert.throws(
    () =>
      validateExtractionResult({
        ...buildValidExtraction(),
        confidence_score: 1.2,
      }),
    /confidence_score/i,
  );
});

test("validateExtractionResult rejects unknown enum values", () => {
  assert.throws(
    () =>
      validateExtractionResult({
        ...buildValidExtraction(),
        document_type: "invoice",
      }),
    /document_type/i,
  );
});

test("validateExtractionResult preserves warnings and adds validation warnings for dropped fields", () => {
  const result = validateExtractionResult({
    ...buildValidExtraction(),
    vendor: 42,
    warnings: ["model uncertain about date"],
  });

  assert.equal(result.result.vendor, null);
  assert.deepEqual(result.result.warnings, ["model uncertain about date"]);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0] ?? "", /vendor/i);
});
