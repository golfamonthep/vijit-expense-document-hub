import "server-only";

import { addAuditLog } from "@/lib/repositories/auditLogs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ExpenseCase,
  ExpenseCaseStatus,
} from "@/types/database";

import {
  applyPagination,
  assertNonEmptyText,
  type PaginationInput,
  RepositoryError,
  unwrapMany,
  unwrapMaybeSingle,
  unwrapSingle,
} from "./_shared";

export type CreateExpenseCaseInput = {
  companyId: string;
  caseNo: string;
  month: string;
  status?: ExpenseCaseStatus;
  expenseDate?: string | null;
  description?: string | null;
  vendor?: string | null;
  amount?: number | null;
  vatAmount?: number | null;
  withholdingTax?: number | null;
  netAmount?: number | null;
  currency?: string;
  category?: string | null;
  paymentMethod?: string | null;
  bankName?: string | null;
  transferRef?: string | null;
  confidenceScore?: number | null;
  reviewerNote?: string | null;
  submittedByLineUserId?: string | null;
};

export async function createExpenseCase(
  input: CreateExpenseCaseInput,
): Promise<ExpenseCase> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_cases")
    .insert({
      company_id: input.companyId,
      case_no: input.caseNo,
      month: input.month,
      status: input.status ?? "inbox",
      expense_date: input.expenseDate ?? null,
      description: input.description ?? null,
      vendor: input.vendor ?? null,
      amount: input.amount ?? null,
      vat_amount: input.vatAmount ?? null,
      withholding_tax: input.withholdingTax ?? null,
      net_amount: input.netAmount ?? null,
      currency: input.currency ?? "THB",
      category: input.category ?? null,
      payment_method: input.paymentMethod ?? null,
      bank_name: input.bankName ?? null,
      transfer_ref: input.transferRef ?? null,
      confidence_score: input.confidenceScore ?? null,
      reviewer_note: input.reviewerNote ?? null,
      submitted_by_line_user_id: input.submittedByLineUserId ?? null,
      approved_by: null,
      approved_at: null,
      exported_at: null,
    })
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to create expense case");
}

export async function getExpenseCaseById(
  expenseCaseId: string,
): Promise<ExpenseCase | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_cases")
    .select("*")
    .eq("id", expenseCaseId)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load expense case");
}

export type ListExpenseCasesByMonthInput = PaginationInput & {
  companyId: string;
  month: string;
  status?: ExpenseCaseStatus;
};

export async function listExpenseCasesByMonth(
  input: ListExpenseCasesByMonthInput,
): Promise<ExpenseCase[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("expense_cases")
    .select("*")
    .eq("company_id", input.companyId)
    .eq("month", input.month)
    .order("created_at", { ascending: false });

  if (input.status) {
    query = query.eq("status", input.status);
  }

  query = applyPagination(query, input);

  const response = await query;
  return unwrapMany(response, "Failed to list expense cases by month");
}

export type UpdateExpenseCasePatch = Partial<{
  month: string;
  expenseDate: string | null;
  description: string | null;
  vendor: string | null;
  amount: number | null;
  vatAmount: number | null;
  withholdingTax: number | null;
  netAmount: number | null;
  currency: string;
  category: string | null;
  paymentMethod: string | null;
  bankName: string | null;
  transferRef: string | null;
  confidenceScore: number | null;
  reviewerNote: string | null;
  submittedByLineUserId: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  exportedAt: string | null;
}>;

export async function updateExpenseCase(
  expenseCaseId: string,
  patch: UpdateExpenseCasePatch,
): Promise<ExpenseCase> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_cases")
    .update({
      month: patch.month,
      expense_date: patch.expenseDate,
      description: patch.description,
      vendor: patch.vendor,
      amount: patch.amount,
      vat_amount: patch.vatAmount,
      withholding_tax: patch.withholdingTax,
      net_amount: patch.netAmount,
      currency: patch.currency,
      category: patch.category,
      payment_method: patch.paymentMethod,
      bank_name: patch.bankName,
      transfer_ref: patch.transferRef,
      confidence_score: patch.confidenceScore,
      reviewer_note: patch.reviewerNote,
      submitted_by_line_user_id: patch.submittedByLineUserId,
      approved_by: patch.approvedBy,
      approved_at: patch.approvedAt,
      exported_at: patch.exportedAt,
    })
    .eq("id", expenseCaseId)
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to update expense case");
}

export async function updateExpenseCaseStatus(
  expenseCaseId: string,
  status: ExpenseCaseStatus,
): Promise<ExpenseCase> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_cases")
    .update({ status })
    .eq("id", expenseCaseId)
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to update expense case status");
}

async function ensureExpenseCaseCanBeApproved(expenseCase: ExpenseCase): Promise<void> {
  if (expenseCase.status === "rejected" || expenseCase.status === "exported") {
    throw new RepositoryError(
      `Expense case ${expenseCase.id} cannot be approved from status ${expenseCase.status}.`,
    );
  }

  if (expenseCase.amount === null) {
    throw new RepositoryError("Expense case cannot be approved without amount.");
  }

  if (!expenseCase.expense_date) {
    throw new RepositoryError("Expense case cannot be approved without expense_date.");
  }

  assertNonEmptyText(expenseCase.description, "Expense case description");

  const supabase = getSupabaseAdminClient();
  const linkResponse = await supabase
    .from("expense_case_documents")
    .select("id", { count: "exact", head: true })
    .eq("expense_case_id", expenseCase.id);

  if (linkResponse.error) {
    throw new RepositoryError(
      `Failed to verify linked documents for expense case approval: ${linkResponse.error.message}`,
      linkResponse.error,
    );
  }

  if (!linkResponse.count || linkResponse.count < 1) {
    throw new RepositoryError(
      "Expense case cannot be approved without at least one linked document.",
    );
  }
}

export type ApproveExpenseCaseInput = {
  expenseCaseId: string;
  approvedBy: string;
  actorLineUserId?: string | null;
};

export async function approveExpenseCase(
  input: ApproveExpenseCaseInput,
): Promise<ExpenseCase> {
  const current = await getExpenseCaseById(input.expenseCaseId);
  if (!current) {
    throw new RepositoryError(`Expense case ${input.expenseCaseId} was not found.`);
  }

  await ensureExpenseCaseCanBeApproved(current);

  const approvedAt = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_cases")
    .update({
      status: "approved",
      approved_by: input.approvedBy,
      approved_at: approvedAt,
    })
    .eq("id", input.expenseCaseId)
    .select("*")
    .single();

  const approved = unwrapSingle(response, "Failed to approve expense case");

  await addAuditLog({
    companyId: approved.company_id,
    actorLineUserId: input.actorLineUserId ?? null,
    action: "expense_case.approved",
    entityType: "expense_case",
    entityId: approved.id,
    payload: {
      previous_status: current.status,
      next_status: approved.status,
      approved_by: input.approvedBy,
      approved_at: approvedAt,
    },
  });

  return approved;
}

export type RejectExpenseCaseInput = {
  expenseCaseId: string;
  actorLineUserId?: string | null;
  reviewerNote?: string | null;
};

export async function rejectExpenseCase(
  input: RejectExpenseCaseInput,
): Promise<ExpenseCase> {
  const current = await getExpenseCaseById(input.expenseCaseId);
  if (!current) {
    throw new RepositoryError(`Expense case ${input.expenseCaseId} was not found.`);
  }

  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("expense_cases")
    .update({
      status: "rejected",
      reviewer_note: input.reviewerNote ?? current.reviewer_note,
    })
    .eq("id", input.expenseCaseId)
    .select("*")
    .single();

  const rejected = unwrapSingle(response, "Failed to reject expense case");

  await addAuditLog({
    companyId: rejected.company_id,
    actorLineUserId: input.actorLineUserId ?? null,
    action: "expense_case.rejected",
    entityType: "expense_case",
    entityId: rejected.id,
    payload: {
      previous_status: current.status,
      next_status: rejected.status,
      reviewer_note: rejected.reviewer_note,
    },
  });

  return rejected;
}
