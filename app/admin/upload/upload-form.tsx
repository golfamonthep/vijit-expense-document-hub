"use client";

import { useState } from "react";

import type { DocumentType } from "@/types/database";

type UploadFormProps = {
  adminSecretConfigured: boolean;
  documentTypes: DocumentType[];
};

type UploadState =
  | {
      kind: "idle";
    }
  | {
      kind: "success";
      message: string;
      warning?: string;
    }
  | {
      kind: "error";
      message: string;
    };

export function UploadForm({
  adminSecretConfigured,
  documentTypes,
}: UploadFormProps) {
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setState({ kind: "idle" });

    const response = await fetch("/api/admin/documents/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      message?: string;
      documentId?: string;
      originalFileName?: string;
      warning?: string;
    };

    if (!response.ok || !payload.ok) {
      setState({
        kind: "error",
        message: payload.message ?? "Upload failed. Please try again.",
      });
      setIsSubmitting(false);
      return;
    }

    setState({
      kind: "success",
      message: `Uploaded ${payload.originalFileName ?? "document"} successfully.`,
      warning: payload.warning,
    });
    setIsSubmitting(false);
  }

  return (
    <form action={handleSubmit} className="admin-form">
      <label className="field">
        <span>Admin secret</span>
        <input
          type="password"
          name="admin_secret"
          placeholder={adminSecretConfigured ? "Required in protected environments" : "Optional in local/dev"}
          autoComplete="off"
        />
      </label>

      <label className="field">
        <span>Evidence file</span>
        <input type="file" name="file" required />
      </label>

      <label className="field">
        <span>Document type</span>
        <select name="document_type" defaultValue="unknown">
          {documentTypes.map((documentType) => (
            <option key={documentType} value={documentType}>
              {documentType}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Note</span>
        <textarea
          name="note"
          rows={4}
          placeholder="Optional note for this upload"
        />
      </label>

      <button type="submit" className="button" disabled={isSubmitting}>
        {isSubmitting ? "Uploading..." : "Upload document"}
      </button>

      {state.kind === "success" ? (
        <p className="status success">
          {state.message}
          {state.warning ? ` ${state.warning}` : ""}
        </p>
      ) : null}

      {state.kind === "error" ? (
        <p className="status error">{state.message}</p>
      ) : null}
    </form>
  );
}
