import type { Json } from "../../types/database.ts";

export const DOCUMENT_TYPE_VALUES = [
  "unknown",
  "slip",
  "receipt",
  "tax_invoice",
  "cash_bill",
  "utility_bill",
  "order_screenshot",
  "pdf",
  "text_note",
  "other",
] as const;

export const PAYMENT_METHOD_VALUES = [
  "transfer",
  "cash",
  "credit_card",
  "shopee",
  "lazada",
  "tiktok",
  "utility_bill",
  "unknown",
] as const;

export type ExtractionDocumentType = (typeof DOCUMENT_TYPE_VALUES)[number];
export type ExtractionPaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export type ExtractionResult = {
  document_type: ExtractionDocumentType;
  expense_date: string | null;
  payment_date: string | null;
  vendor: string | null;
  vendor_tax_id: string | null;
  description: string | null;
  amount_before_vat: number | null;
  vat_amount: number | null;
  withholding_tax: number | null;
  net_amount: number | null;
  currency: "THB";
  payment_method: ExtractionPaymentMethod;
  bank_name: string | null;
  transfer_ref: string | null;
  category_suggestion: string | null;
  confidence_score: number;
  warnings: string[];
  extracted_text_summary: string | null;
};

type ValidationResult = {
  result: ExtractionResult;
  warnings: string[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireEnumValue<TValue extends readonly string[]>(
  rawValue: unknown,
  label: string,
  allowedValues: TValue,
): TValue[number] {
  if (typeof rawValue !== "string" || !allowedValues.includes(rawValue)) {
    throw new Error(
      `${label} must be one of: ${allowedValues.join(", ")}.`,
    );
  }

  return rawValue;
}

function requireConfidenceScore(rawValue: unknown): number {
  if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
    throw new Error("confidence_score must be a number.");
  }

  if (rawValue < 0 || rawValue > 1) {
    throw new Error("confidence_score must be between 0 and 1.");
  }

  return rawValue;
}

function normalizeNullableString(
  rawValue: unknown,
  label: string,
  warnings: string[],
): string | null {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }

  if (typeof rawValue === "string") {
    return rawValue.trim() || null;
  }

  warnings.push(`${label} was dropped because the model returned a non-string value.`);
  return null;
}

function normalizeNullableNumber(
  rawValue: unknown,
  label: string,
  warnings: string[],
): number | null {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return null;
  }

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue;
  }

  warnings.push(`${label} was dropped because the model returned a non-number value.`);
  return null;
}

function normalizeNullableDate(
  rawValue: unknown,
  label: string,
  warnings: string[],
): string | null {
  const normalized = normalizeNullableString(rawValue, label, warnings);
  if (!normalized) {
    return null;
  }

  if (!DATE_PATTERN.test(normalized)) {
    warnings.push(`${label} was dropped because it did not match YYYY-MM-DD.`);
    return null;
  }

  return normalized;
}

function normalizeWarnings(rawValue: unknown): string[] {
  if (rawValue === undefined || rawValue === null) {
    return [];
  }

  if (!Array.isArray(rawValue)) {
    throw new Error("warnings must be an array of strings.");
  }

  return rawValue
    .filter((warning): warning is string => typeof warning === "string")
    .map((warning) => warning.trim())
    .filter(Boolean);
}

export function getExtractionResultJsonSchema(): Json {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "document_type",
      "expense_date",
      "payment_date",
      "vendor",
      "vendor_tax_id",
      "description",
      "amount_before_vat",
      "vat_amount",
      "withholding_tax",
      "net_amount",
      "currency",
      "payment_method",
      "bank_name",
      "transfer_ref",
      "category_suggestion",
      "confidence_score",
      "warnings",
      "extracted_text_summary",
    ],
    properties: {
      document_type: { type: "string", enum: [...DOCUMENT_TYPE_VALUES] },
      expense_date: { anyOf: [{ type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, { type: "null" }] },
      payment_date: { anyOf: [{ type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, { type: "null" }] },
      vendor: { anyOf: [{ type: "string" }, { type: "null" }] },
      vendor_tax_id: { anyOf: [{ type: "string" }, { type: "null" }] },
      description: { anyOf: [{ type: "string" }, { type: "null" }] },
      amount_before_vat: { anyOf: [{ type: "number" }, { type: "null" }] },
      vat_amount: { anyOf: [{ type: "number" }, { type: "null" }] },
      withholding_tax: { anyOf: [{ type: "number" }, { type: "null" }] },
      net_amount: { anyOf: [{ type: "number" }, { type: "null" }] },
      currency: { type: "string", enum: ["THB"] },
      payment_method: { type: "string", enum: [...PAYMENT_METHOD_VALUES] },
      bank_name: { anyOf: [{ type: "string" }, { type: "null" }] },
      transfer_ref: { anyOf: [{ type: "string" }, { type: "null" }] },
      category_suggestion: { anyOf: [{ type: "string" }, { type: "null" }] },
      confidence_score: { type: "number", minimum: 0, maximum: 1 },
      warnings: {
        type: "array",
        items: { type: "string" },
      },
      extracted_text_summary: { anyOf: [{ type: "string" }, { type: "null" }] },
    },
  };
}

export function validateExtractionResult(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    throw new Error("AI extraction output must be a JSON object.");
  }

  const warnings: string[] = [];
  const modelWarnings = normalizeWarnings(input.warnings);

  const result: ExtractionResult = {
    document_type: requireEnumValue(
      input.document_type,
      "document_type",
      DOCUMENT_TYPE_VALUES,
    ),
    expense_date: normalizeNullableDate(input.expense_date, "expense_date", warnings),
    payment_date: normalizeNullableDate(input.payment_date, "payment_date", warnings),
    vendor: normalizeNullableString(input.vendor, "vendor", warnings),
    vendor_tax_id: normalizeNullableString(input.vendor_tax_id, "vendor_tax_id", warnings),
    description: normalizeNullableString(input.description, "description", warnings),
    amount_before_vat: normalizeNullableNumber(
      input.amount_before_vat,
      "amount_before_vat",
      warnings,
    ),
    vat_amount: normalizeNullableNumber(input.vat_amount, "vat_amount", warnings),
    withholding_tax: normalizeNullableNumber(
      input.withholding_tax,
      "withholding_tax",
      warnings,
    ),
    net_amount: normalizeNullableNumber(input.net_amount, "net_amount", warnings),
    currency: requireEnumValue(input.currency ?? "THB", "currency", ["THB"] as const),
    payment_method: requireEnumValue(
      input.payment_method,
      "payment_method",
      PAYMENT_METHOD_VALUES,
    ),
    bank_name: normalizeNullableString(input.bank_name, "bank_name", warnings),
    transfer_ref: normalizeNullableString(input.transfer_ref, "transfer_ref", warnings),
    category_suggestion: normalizeNullableString(
      input.category_suggestion,
      "category_suggestion",
      warnings,
    ),
    confidence_score: requireConfidenceScore(input.confidence_score),
    warnings: modelWarnings,
    extracted_text_summary: normalizeNullableString(
      input.extracted_text_summary,
      "extracted_text_summary",
      warnings,
    ),
  };

  return {
    result,
    warnings,
  };
}
