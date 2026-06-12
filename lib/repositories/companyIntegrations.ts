import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  CompanyIntegration,
  CompanyIntegrationStatus,
  CompanyIntegrationType,
  Json,
} from "@/types/database";

import { unwrapMaybeSingle, unwrapSingle } from "./_shared";

export async function getCompanyIntegration(
  companyId: string,
  integrationType: CompanyIntegrationType,
): Promise<CompanyIntegration | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("company_integrations")
    .select("*")
    .eq("company_id", companyId)
    .eq("integration_type", integrationType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load company integration");
}

export type UpsertCompanyIntegrationInput = {
  companyId: string;
  integrationType: CompanyIntegrationType;
  config?: Json;
  status?: CompanyIntegrationStatus;
};

export async function upsertCompanyIntegration(
  input: UpsertCompanyIntegrationInput,
): Promise<CompanyIntegration> {
  const existing = await getCompanyIntegration(input.companyId, input.integrationType);
  const supabase = getSupabaseAdminClient();

  if (existing) {
    const updateResponse = await supabase
      .from("company_integrations")
      .update({
        config: input.config ?? existing.config,
        status: input.status ?? existing.status,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    return unwrapSingle(updateResponse, "Failed to update company integration");
  }

  const insertResponse = await supabase
    .from("company_integrations")
    .insert({
      company_id: input.companyId,
      integration_type: input.integrationType,
      config: input.config ?? {},
      status: input.status ?? "inactive",
    })
    .select("*")
    .single();

  return unwrapSingle(insertResponse, "Failed to create company integration");
}

export type UpdateCompanyIntegrationStatusInput = {
  companyId: string;
  integrationType: CompanyIntegrationType;
  status: CompanyIntegrationStatus;
};

export async function updateCompanyIntegrationStatus(
  input: UpdateCompanyIntegrationStatusInput,
): Promise<CompanyIntegration> {
  const existing = await getCompanyIntegration(input.companyId, input.integrationType);
  if (!existing) {
    throw new Error(
      `Company integration ${input.integrationType} for company ${input.companyId} was not found.`,
    );
  }

  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("company_integrations")
    .update({ status: input.status })
    .eq("id", existing.id)
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to update company integration status");
}

