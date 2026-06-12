import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ReportExport, ReportExportType } from "@/types/database";

import { unwrapMany, unwrapSingle } from "./_shared";

export type CreateReportExportInput = {
  accountingReportId: string;
  exportType: ReportExportType;
  storageBucket?: string | null;
  storagePath?: string | null;
  externalUrl?: string | null;
};

export async function createReportExport(
  input: CreateReportExportInput,
): Promise<ReportExport> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("report_exports")
    .insert({
      accounting_report_id: input.accountingReportId,
      export_type: input.exportType,
      storage_bucket: input.storageBucket ?? null,
      storage_path: input.storagePath ?? null,
      external_url: input.externalUrl ?? null,
    })
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to create report export");
}

export async function listReportExports(reportId: string): Promise<ReportExport[]> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("report_exports")
    .select("*")
    .eq("accounting_report_id", reportId)
    .order("created_at", { ascending: false });

  return unwrapMany(response, "Failed to list report exports");
}

