import {
  type ExtractionResult,
  validateExtractionResult,
} from "./extractionSchema.ts";
import { buildThaiAccountingExtractionPrompt } from "./prompts.ts";
import {
  callOpenAiForExtraction,
  type OpenAiExtractionResponse,
} from "./openaiClient.ts";

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type ExtractDocumentWithAIInput = {
  documentId: string;
  companyId: string;
  mimeType: string | null;
  fileName?: string | null;
  fileBuffer: Buffer;
};

export type ExtractDocumentWithAIResult = {
  extractionResult: ExtractionResult;
  modelName: string;
  warnings: string[];
  rawTextSummary: string | null;
};

export type ExtractDocumentWithAIDeps = {
  callOpenAiForExtraction: (input: {
    prompt: string;
    mimeType: string;
    fileName?: string | null;
    fileBuffer: Buffer;
  }) => Promise<OpenAiExtractionResponse>;
};

const defaultDeps: ExtractDocumentWithAIDeps = {
  callOpenAiForExtraction,
};

function buildUnsupportedPdfResult(): ExtractDocumentWithAIResult {
  const warning =
    "PDF extraction is not supported yet in STEP 08 without an existing lightweight text path.";

  return {
    modelName: "not_run_pdf_unsupported",
    warnings: [warning],
    rawTextSummary: null,
    extractionResult: {
      document_type: "pdf",
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
      confidence_score: 0,
      warnings: [warning],
      extracted_text_summary: null,
    },
  };
}

export async function extractDocumentWithAI(
  input: ExtractDocumentWithAIInput,
  deps: Partial<ExtractDocumentWithAIDeps> = {},
): Promise<ExtractDocumentWithAIResult> {
  const resolvedDeps = { ...defaultDeps, ...deps };
  const mimeType = input.mimeType?.trim().toLowerCase() ?? "";

  if (mimeType === "application/pdf") {
    return buildUnsupportedPdfResult();
  }

  if (!SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported document mime type for AI extraction: ${mimeType || "unknown"}.`);
  }

  const prompt = buildThaiAccountingExtractionPrompt({
    documentId: input.documentId,
    companyId: input.companyId,
    mimeType: input.mimeType,
    fileName: input.fileName,
  });

  const response = await resolvedDeps.callOpenAiForExtraction({
    prompt,
    mimeType,
    fileName: input.fileName,
    fileBuffer: input.fileBuffer,
  });

  let parsedOutput: unknown;
  try {
    parsedOutput = JSON.parse(response.outputText);
  } catch (error) {
    throw new Error(
      `Failed to parse OpenAI extraction JSON: ${error instanceof Error ? error.message : "unknown error"}.`,
    );
  }

  const validated = validateExtractionResult(parsedOutput);

  return {
    modelName: response.modelName,
    extractionResult: validated.result,
    warnings: [...validated.warnings, ...validated.result.warnings],
    rawTextSummary: validated.result.extracted_text_summary,
  };
}
