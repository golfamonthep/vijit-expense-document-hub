import Link from "next/link";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { getDefaultCompany } from "@/lib/repositories/companies";
import { listDocumentsByCompany } from "@/lib/repositories/documents";

export default async function AdminDocumentsPage() {
  if (!hasSupabaseAdminEnv()) {
    return (
      <main className="page-shell">
        <section className="panel admin-panel">
          <p className="eyebrow">Document Inbox</p>
          <h1>Admin documents</h1>
          <p className="subtle-text">
            Runtime Supabase storage env is not configured yet, so this page is
            showing a safe placeholder.
          </p>
          <Link href="/admin/upload" className="text-link">
            Go to upload page
          </Link>
        </section>
      </main>
    );
  }

  const company = await getDefaultCompany();
  const documents = company
    ? await listDocumentsByCompany({ companyId: company.id, limit: 10 })
    : [];

  return (
    <main className="page-shell">
      <section className="panel admin-panel">
        <p className="eyebrow">Document Inbox</p>
        <h1>Recent documents</h1>
        <p className="subtle-text">
          This is a lightweight placeholder for the future review dashboard.
        </p>
        <Link href="/admin/upload" className="text-link">
          Upload a new document
        </Link>
        {documents.length === 0 ? (
          <p className="subtle-text">No documents found yet.</p>
        ) : (
          <ul className="document-list">
            {documents.map((document) => (
              <li key={document.id} className="document-item">
                <strong>{document.original_file_name ?? document.id}</strong>
                <span>{document.document_type}</span>
                <span>{document.status}</span>
                <span>{new Date(document.received_at).toLocaleString("en-US")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
