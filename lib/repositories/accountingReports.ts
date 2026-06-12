import "server-only";

import { addAuditLog } from "@/lib/repositories/auditLogs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AccountingReport,
  AccountingReportStatus,
  AccountingReportType,
} from "@/types/database";

import {
  applyPagination,
  type PaginationInput,
  RepositoryError,
  unwrapMany,
  unwrapMaybeSingle,
  unwrapSingle,
} from "./_shared";

export type CreateAccountingReportInput = {
  companyId: string;
  month: string;
  reportType: AccountingReportType;
  status?: AccountingReportStatus;
  storageBucket?: string | null;
  storagePath?: string | null;
  generatedBy?: string | null;
  generatedAt?: string | null;
};

export async function createAccountingReport(
  input: CreateAccountingReportInput,
): Promise<AccountingReport> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("accounting_reports")
    .insert({
      company_id: input.companyId,
      month: input.month,
      report_type: input.reportType,
      status: input.status ?? "draft",
      storage_bucket: input.storageBucket ?? null,
      storage_path: input.storagePath ?? null,
      generated_by: input.generatedBy ?? null,
      generated_at: input.generatedAt ?? null,
    })
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to create accounting report");
}

export type UpdateAccountingReportInput = {
  reportId: string;
  month?: string;
  reportType?: AccountingReportType;
  status?: AccountingReportStatus;
  storageBucket?: string | null;
  storagePath?: string | null;
  generatedBy?: string | null;
  generatedAt?: string | null;
};

export async function updateAccountingReport(
  input: UpdateAccountingReportInput,
): Promise<AccountingReport> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("accounting_reports")
    .update({
      month: input.month,
      report_type: input.reportType,
      status: input.status,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      generated_by: input.generatedBy,
      generated_at: input.generatedAt,
    })
    .eq("id", input.reportId)
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to update accounting report");
}

export async function getAccountingReportById(
  reportId: string,
): Promise<AccountingReport | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("accounting_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load accounting report");
}

export type ListAccountingReportsByMonthInput = PaginationInput & {
  companyId: string;
  month: string;
  status?: AccountingReportStatus;
};

export async function listAccountingReportsByMonth(
  input: ListAccountingReportsByMonthInput,
): Promise<AccountingReport[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("accounting_reports")
    .select("*")
    .eq("company_id", input.companyId)
    .eq("month", input.month)
    .order("created_at", { ascending: false });

  if (input.status) {
    query = query.eq("status", input.status);
  }

  query = applyPagination(query, input);

  const response = await query;
  return unwrapMany(response, "Failed to list accounting reports by month");
}

export type MarkReportGeneratedInput = {
  reportId: string;
  generatedBy?: string | null;
  actorLineUserId?: string | null;
  storageBucket?: string | null;
  storagePath?: string | null;
};

export async function markReportGenerated(
  input: MarkReportGeneratedInput,
): Promise<AccountingReport> {
  const current = await getAccountingReportById(input.reportId);
  if (!current) {
    throw new RepositoryError(`Accounting report ${input.reportId} was not found.`);
  }

  const generatedAt = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("accounting_reports")
    .update({
      status: "generated",
      generated_by: input.generatedBy ?? current.generated_by,
      generated_at: generatedAt,
      storage_bucket: input.storageBucket ?? current.storage_bucket,
      storage_path: input.storagePath ?? current.storage_path,
    })
    .eq("id", input.reportId)
    .select("*")
    .single();

  const report = unwrapSingle(response, "Failed to mark accounting report generated");

  await addAuditLog({
    companyId: report.company_id,
    actorLineUserId: input.actorLineUserId ?? null,
    action: "accounting_report.generated",
    entityType: "accounting_report",
    entityId: report.id,
    payload: {
      previous_status: current.status,
      next_status: report.status,
      generated_by: report.generated_by,
      generated_at: generatedAt,
    },
  });

  return report;
}
