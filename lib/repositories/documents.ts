import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  Document,
  DocumentStatus,
  DocumentType,
} from "@/types/database";

import {
  applyPagination,
  type PaginationInput,
  unwrapMany,
  unwrapMaybeSingle,
  unwrapSingle,
} from "./_shared";

export type CreateDocumentInput = {
  companyId: string;
  sourceType: Document["source_type"];
  sourceChannelId?: string | null;
  sourceUserId?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  storageBucket: string;
  storagePath: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  receivedAt?: string;
};

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("documents")
    .insert({
      company_id: input.companyId,
      source_type: input.sourceType,
      source_channel_id: input.sourceChannelId ?? null,
      source_user_id: input.sourceUserId ?? null,
      original_file_name: input.originalFileName ?? null,
      mime_type: input.mimeType ?? null,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      document_type: input.documentType ?? "unknown",
      status: input.status ?? "received",
      received_at: input.receivedAt ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to create document");
}

export async function getDocumentById(documentId: string): Promise<Document | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load document");
}

export type ListDocumentsByCompanyInput = PaginationInput & {
  companyId: string;
  status?: DocumentStatus;
  documentType?: DocumentType;
  sourceType?: Document["source_type"];
};

export async function listDocumentsByCompany(
  input: ListDocumentsByCompanyInput,
): Promise<Document[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("documents")
    .select("*")
    .eq("company_id", input.companyId)
    .order("received_at", { ascending: false });

  if (input.status) {
    query = query.eq("status", input.status);
  }

  if (input.documentType) {
    query = query.eq("document_type", input.documentType);
  }

  if (input.sourceType) {
    query = query.eq("source_type", input.sourceType);
  }

  query = applyPagination(query, input);

  const response = await query;
  return unwrapMany(response, "Failed to list documents by company");
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
): Promise<Document> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("documents")
    .update({ status })
    .eq("id", documentId)
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to update document status");
}

export async function updateDocumentType(
  documentId: string,
  documentType: DocumentType,
): Promise<Document> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("documents")
    .update({ document_type: documentType })
    .eq("id", documentId)
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to update document type");
}
