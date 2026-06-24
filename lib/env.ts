export class MissingServerEnvError extends Error {
  public readonly missingKeys: string[];

  constructor(missingKeys: string[], context?: string) {
    const scope = context ? ` for ${context}` : "";
    super(
      `Missing required server environment variables${scope}: ${missingKeys.join(
        ", ",
      )}. Update .env.example-backed local env values before calling this runtime path.`,
    );
    this.name = "MissingServerEnvError";
    this.missingKeys = missingKeys;
  }
}

type OptionalServerEnv = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  supabaseDocumentsBucket?: string;
  lineChannelSecret?: string;
  lineChannelAccessToken?: string;
  openAiApiKey?: string;
  adminSecret?: string;
};

function readEnvValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getOptionalServerEnv(): OptionalServerEnv {
  return {
    supabaseUrl: readEnvValue("SUPABASE_URL"),
    supabaseAnonKey: readEnvValue("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: readEnvValue("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseDocumentsBucket: readEnvValue("SUPABASE_DOCUMENTS_BUCKET"),
    lineChannelSecret: readEnvValue("LINE_CHANNEL_SECRET"),
    lineChannelAccessToken: readEnvValue("LINE_CHANNEL_ACCESS_TOKEN"),
    openAiApiKey: readEnvValue("OPENAI_API_KEY"),
    adminSecret: readEnvValue("ADMIN_SECRET"),
  };
}

export function hasSupabaseAdminEnv(): boolean {
  const env = getOptionalServerEnv();
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

export function requireSupabaseAdminEnv(context?: string): {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
} {
  const env = getOptionalServerEnv();
  const missingKeys = [
    !env.supabaseUrl ? "SUPABASE_URL" : null,
    !env.supabaseServiceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter((value): value is string => value !== null);

  if (missingKeys.length > 0) {
    throw new MissingServerEnvError(missingKeys, context);
  }

  const supabaseUrl = env.supabaseUrl!;
  const supabaseServiceRoleKey = env.supabaseServiceRoleKey!;

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
  };
}

export function getDocumentsBucket(): string {
  const env = getOptionalServerEnv();

  if (!env.supabaseDocumentsBucket) {
    throw new MissingServerEnvError(
      ["SUPABASE_DOCUMENTS_BUCKET"],
      "document storage access",
    );
  }

  return env.supabaseDocumentsBucket;
}

export function requireOpenAiApiKey(context?: string): string {
  const apiKey = getOptionalServerEnv().openAiApiKey;

  if (!apiKey) {
    throw new MissingServerEnvError(["OPENAI_API_KEY"], context ?? "OpenAI extraction");
  }

  return apiKey;
}
