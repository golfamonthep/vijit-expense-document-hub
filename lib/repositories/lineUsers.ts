import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { LineUser, LineUserRole } from "@/types/database";

import { unwrapMaybeSingle, unwrapSingle } from "./_shared";

export async function getLineUserByLineUserId(
  lineUserId: string,
): Promise<LineUser | null> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("line_users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  return unwrapMaybeSingle(response, "Failed to load line user");
}

export type UpsertLineUserInput = {
  lineUserId: string;
  companyId?: string | null;
  displayName?: string | null;
  role?: LineUserRole;
};

export async function upsertLineUser(input: UpsertLineUserInput): Promise<LineUser> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("line_users")
    .upsert(
      {
        line_user_id: input.lineUserId,
        company_id: input.companyId ?? null,
        display_name: input.displayName ?? null,
        role: input.role ?? "staff",
      },
      { onConflict: "line_user_id" },
    )
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to upsert line user");
}

export async function updateLineUserRole(
  lineUserId: string,
  role: LineUserRole,
): Promise<LineUser> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("line_users")
    .update({ role })
    .eq("line_user_id", lineUserId)
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to update line user role");
}

