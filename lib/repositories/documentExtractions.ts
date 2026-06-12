import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { DocumentExtraction, Json } from "@/types/database";

import { unwrapMany, unwrapMaybeSingle, unwrapSingle } from "./_shared";

export type CreateDocumentExtractionInput = {
  documentId: string;
  modelName: string;
  rawText?: string | null;
  extractedPayload?: Json;
  confidenceScore?: number | null;
  warnings?: Json;
};

export async function createDocumentExtraction(
  input: CreateDocumentExtractionInput,
): Promise<DocumentExtraction> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("document_extractions")
    .insert({
      document_id: input.documentId,
      model_name: input.modelName,
      raw_text: input.rawText ?? null,
      extracted_payload: input.extractedPayload ?? {},
      confidence_score: input.confidenceScore ?? null,
      warnings: input.warnings ?? [],
    })
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to create document extraction");
}

export async function getLatestExtractionForDocument(
  documentId: string,
): Promise<DocumentExtraction | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("document_extractions")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load latest extraction");
}

export async function listExtractionsForDocument(
  documentId: string,
): Promise<DocumentExtraction[]> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("document_extractions")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });

  return unwrapMany(response, "Failed to list document extractions");
}

