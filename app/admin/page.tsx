import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="page-shell">
      <section className="panel admin-panel">
        <p className="eyebrow">Admin</p>
        <h1>Admin workspace</h1>
        <p>
          This route is reserved for dashboard, review, approval, and reporting
          tools in later phases.
        </p>
        <nav className="admin-links">
          <Link href="/admin/upload" className="text-link">
            Open web upload inbox
          </Link>
          <Link href="/admin/documents" className="text-link">
            View document inbox placeholder
          </Link>
        </nav>
      </section>
    </main>
  );
}
