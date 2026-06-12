import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Company } from "@/types/database";

import { unwrapMaybeSingle, unwrapSingle } from "./_shared";

const DEFAULT_COMPANY_NAME = "บริษัท วิจิตรโอสถ จำกัด";

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load company by id");
}

export async function getDefaultCompany(): Promise<Company | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load default company");
}

export async function ensureDefaultCompany(): Promise<Company> {
  const existing = await getDefaultCompany();
  if (existing) {
    return existing;
  }

  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("companies")
    .insert({
      name: DEFAULT_COMPANY_NAME,
      tax_id: null,
      default_currency: "THB",
    })
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to create default company");
}
