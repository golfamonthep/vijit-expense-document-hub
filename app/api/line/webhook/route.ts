import { NextResponse } from "next/server";

import { createDocumentFromLineMessage } from "../../../../lib/documents/intake";
import { MissingServerEnvError } from "../../../../lib/env";
import { replyMessage } from "../../../../lib/line/client";
import { downloadLineMessageContent } from "../../../../lib/line/content";
import type { LineWebhookBody } from "../../../../lib/line/types";
import { createLineWebhookHandler } from "../../../../lib/line/webhook";
import { verifyLineSignature } from "../../../../lib/line/verifySignature";
import { addAuditLog } from "../../../../lib/repositories/auditLogs";
import { getDefaultCompany } from "../../../../lib/repositories/companies";
import type { Json } from "../../../../types/database";

export const runtime = "nodejs";

function isLineWebhookBody(value: unknown): value is LineWebhookBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeBody = value as Partial<LineWebhookBody>;
  return Array.isArray(maybeBody.events);
}

async function resolveDefaultCompanyId(): Promise<string | null> {
  try {
    const company = await getDefaultCompany();
    return company?.id ?? null;
  } catch (error) {
    if (error instanceof MissingServerEnvError) {
      return null;
    }

    console.error(
      "Failed to resolve default company for LINE webhook audit logging:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function addAuditLogSafely(input: {
  action: string;
  actorLineUserId?: string | null;
  companyId?: string | null;
  entityType?: string;
  entityId?: string | null;
  payload?: { [key: string]: Json | undefined };
}): Promise<void> {
  try {
    await addAuditLog({
      companyId: input.companyId ?? null,
      actorLineUserId: input.actorLineUserId ?? null,
      action: input.action,
      entityType: input.entityType ?? "line_webhook_event",
      entityId: input.entityId ?? null,
      payload: input.payload ?? {},
    });
  } catch (error) {
    if (error instanceof MissingServerEnvError) {
      return;
    }

    console.error(
      "Failed to write LINE webhook audit log:",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature)) {
    await addAuditLogSafely({
      action: "line_webhook_invalid_signature",
      payload: {
        signaturePresent: Boolean(signature),
      },
    });

    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!isLineWebhookBody(parsedBody)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const companyId = await resolveDefaultCompanyId();

  await addAuditLogSafely({
    action: "line_webhook_received",
    companyId,
    payload: {
      destination: parsedBody.destination ?? null,
      eventCount: parsedBody.events.length,
    },
  });

  const handler = createLineWebhookHandler({
    replyMessage,
    getDefaultCompanyId: resolveDefaultCompanyId,
    downloadLineMessageContent,
    createDocumentFromLineMessage,
    addAuditLog: addAuditLogSafely,
  });

  for (const event of parsedBody.events) {
    await handler.handleMessageEvent(event);
  }

  return NextResponse.json({ ok: true });
}
