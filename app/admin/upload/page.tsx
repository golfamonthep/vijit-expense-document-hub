import { UploadForm } from "./upload-form";

import { WEB_UPLOAD_DOCUMENT_TYPES } from "@/lib/admin/webUpload";
import { getOptionalServerEnv } from "@/lib/env";

export default function AdminUploadPage() {
  const env = getOptionalServerEnv();

  return (
    <main className="page-shell">
      <section className="panel admin-panel">
        <p className="eyebrow">Admin Upload</p>
        <h1>Web Upload Inbox</h1>
        <p className="helper-text">
          อัปโหลดสลิป ใบเสร็จ บิล หรือภาพคำสั่งซื้อ เพื่อบันทึกเข้า Document Inbox
        </p>
        <p className="subtle-text">
          Files stay private by default and are stored server-side before any
          later extraction or review work.
        </p>
        {!env.adminSecret ? (
          <p className="status warning">
            `ADMIN_SECRET` is not configured, so this page only has temporary
            local/dev protection.
          </p>
        ) : null}
        <UploadForm
          adminSecretConfigured={Boolean(env.adminSecret)}
          documentTypes={WEB_UPLOAD_DOCUMENT_TYPES}
        />
      </section>
    </main>
  );
}
