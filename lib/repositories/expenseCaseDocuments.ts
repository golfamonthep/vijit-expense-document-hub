import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  Document,
  ExpenseCase,
  ExpenseCaseDocument,
  ExpenseCaseDocumentRole,
} from "@/types/database";

import { unwrapMany, unwrapSingle } from "./_shared";

export type LinkDocumentToExpenseCaseInput = {
  expenseCaseId: string;
  documentId: string;
  role?: ExpenseCaseDocumentRole;
  pageOrder?: number;
};

export async function linkDocumentToExpenseCase(
  input: LinkDocumentToExpenseCaseInput,
): Promise<ExpenseCaseDocument> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_case_documents")
    .upsert(
      {
        expense_case_id: input.expenseCaseId,
        document_id: input.documentId,
        role: input.role ?? "supporting_doc",
        page_order: input.pageOrder ?? 0,
      },
      { onConflict: "expense_case_id,document_id" },
    )
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to link document to expense case");
}

export async function unlinkDocumentFromExpenseCase(
  expenseCaseId: string,
  documentId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_case_documents")
    .delete()
    .eq("expense_case_id", expenseCaseId)
    .eq("document_id", documentId);

  if (response.error) {
    throw new Error(`Failed to unlink document from expense case: ${response.error.message}`);
  }
}

export async function listDocumentsForExpenseCase(
  expenseCaseId: string,
): Promise<Document[]> {
  const supabase = getSupabaseAdminClient();
  const linkResponse = await supabase
    .from("expense_case_documents")
    .select("document_id")
    .eq("expense_case_id", expenseCaseId)
    .order("page_order", { ascending: true });

  const links = unwrapMany(linkResponse, "Failed to list expense case document links");
  const documentIds = links.map((link) => link.document_id);

  if (documentIds.length === 0) {
    return [];
  }

  const documentResponse = await supabase
    .from("documents")
    .select("*")
    .in("id", documentIds);

  const documents = unwrapMany(documentResponse, "Failed to list documents for expense case");

  return documentIds
    .map((documentId) => documents.find((document) => document.id === documentId) ?? null)
    .filter((document): document is Document => document !== null);
}

export async function listExpenseCasesForDocument(
  documentId: string,
): Promise<ExpenseCase[]> {
  const supabase = getSupabaseAdminClient();
  const linkResponse = await supabase
    .from("expense_case_documents")
    .select("expense_case_id")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });

  const links = unwrapMany(linkResponse, "Failed to list document expense case links");
  const expenseCaseIds = links.map((link) => link.expense_case_id);

  if (expenseCaseIds.length === 0) {
    return [];
  }

  const caseResponse = await supabase
    .from("expense_cases")
    .select("*")
    .in("id", expenseCaseIds);

  const expenseCases = unwrapMany(caseResponse, "Failed to list expense cases for document");

  return expenseCaseIds
    .map((expenseCaseId) => expenseCases.find((expenseCase) => expenseCase.id === expenseCaseId) ?? null)
    .filter((expenseCase): expenseCase is ExpenseCase => expenseCase !== null);
}

