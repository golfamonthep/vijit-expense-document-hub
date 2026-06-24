import { getSupabaseAdminClient } from "../supabase/server.ts";
import type { AuditLog, Json } from "../../types/database.ts";

import {
  applyPagination,
  type PaginationInput,
  unwrapMany,
  unwrapSingle,
} from "./_shared.ts";

export type AddAuditLogInput = {
  companyId?: string | null;
  actorLineUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Json;
};

export async function addAuditLog(input: AddAuditLogInput): Promise<AuditLog> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase
    .from("audit_logs")
    .insert({
      company_id: input.companyId ?? null,
      actor_line_user_id: input.actorLineUserId ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      payload: input.payload ?? {},
    })
    .select("*")
    .single();

  return unwrapSingle(response, "Failed to add audit log");
}

export type ListAuditLogsForEntityInput = PaginationInput & {
  entityType: string;
  entityId: string;
};

export async function listAuditLogsForEntity(
  input: ListAuditLogsForEntityInput,
): Promise<AuditLog[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .order("created_at", { ascending: false });

  query = applyPagination(query, input);

  const response = await query;
  return unwrapMany(response, "Failed to list audit logs for entity");
}

export type ListAuditLogsByCompanyInput = PaginationInput & {
  companyId: string;
  entityType?: string;
  action?: string;
};

export async function listAuditLogsByCompany(
  input: ListAuditLogsByCompanyInput,
): Promise<AuditLog[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("company_id", input.companyId)
    .order("created_at", { ascending: false });

  if (input.entityType) {
    query = query.eq("entity_type", input.entityType);
  }

  if (input.action) {
    query = query.eq("action", input.action);
  }

  query = applyPagination(query, input);

  const response = await query;
  return unwrapMany(response, "Failed to list audit logs by company");
}
