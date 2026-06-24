import { NextResponse } from "next/server.js";

import { validateAdminUploadSecret } from "../../../../../../lib/admin/webUpload.ts";
import {
  MissingServerEnvError,
  getOptionalServerEnv,
} from "../../../../../../lib/env.ts";
import { runDocumentExtraction } from "../../../../../../lib/documents/extractionPipeline.ts";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AdminDocumentExtractRouteDeps = {
  getEnv: typeof getOptionalServerEnv;
  validateAdminSecret: typeof validateAdminUploadSecret;
  runDocumentExtraction: typeof runDocumentExtraction;
};

const defaultDeps: AdminDocumentExtractRouteDeps = {
  getEnv: getOptionalServerEnv,
  validateAdminSecret: validateAdminUploadSecret,
  runDocumentExtraction,
};

function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ ok: false, error, message }, { status });
}

async function readAdminSecret(request: Request): Promise<string> {
  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return "";
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    throw new Error("invalid_json");
  }

  if (!parsedBody || typeof parsedBody !== "object") {
    return "";
  }

  return String((parsedBody as { admin_secret?: unknown }).admin_secret ?? "");
}

export function createAdminDocumentExtractHandler(
  deps: Partial<AdminDocumentExtractRouteDeps> = {},
) {
  const resolvedDeps = { ...defaultDeps, ...deps };

  return async function handleAdminDocumentExtract(
    request: Request,
    context: RouteContext,
  ) {
    let adminSecretValue = "";

    try {
      adminSecretValue = await readAdminSecret(request);
    } catch (error) {
      if (error instanceof Error && error.message === "invalid_json") {
        return jsonError(400, "invalid_json", "Invalid JSON request body.");
      }

      throw error;
    }

    const env = resolvedDeps.getEnv();
    const secretValidation = resolvedDeps.validateAdminSecret({
      configuredSecret: env.adminSecret,
      submittedSecret: adminSecretValue,
    });

    if (!secretValidation.ok) {
      return jsonError(
        secretValidation.status,
        secretValidation.error,
        secretValidation.message,
      );
    }

    const { id } = await context.params;

    try {
      const result = await resolvedDeps.runDocumentExtraction(id);

      return NextResponse.json({
        document_id: result.document.id,
        status: result.document.status,
        document_type: result.document.document_type,
        confidence_score: result.extraction.confidence_score,
        warnings: result.warnings,
      });
    } catch (error) {
      if (error instanceof MissingServerEnvError) {
        return jsonError(503, "extraction_not_configured", error.message);
      }

      console.error(
        "Failed to run admin document extraction:",
        error instanceof Error ? error.message : error,
      );
      return jsonError(500, "extraction_failed", "Unable to run AI extraction.");
    }
  };
}

export const POST = createAdminDocumentExtractHandler();
