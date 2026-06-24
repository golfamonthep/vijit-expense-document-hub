import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAdminEnv } from "../env.ts";
import type { Database } from "../../types/database.ts";

let adminClient: SupabaseClient<Database> | undefined;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (adminClient) {
    return adminClient;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = requireSupabaseAdminEnv(
    "server-side Supabase repository access",
  );

  adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}
