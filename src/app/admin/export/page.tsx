import type { Metadata } from "next";
import { FileSpreadsheet, FileJson, Archive } from "lucide-react";

export const metadata: Metadata = { title: "Export – Admin" };

const CSV_FILES = [
  { href: "/api/admin/export/orders.csv", label: "Bestellungen (CSV)" },
  { href: "/api/admin/export/order-items.csv", label: "Items (CSV)" },
  { href: "/api/admin/export/events.csv", label: "Events (CSV)" },
  { href: "/api/admin/export/cocktails.csv", label: "Cocktails (CSV)" },
];

export default function ExportPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-admin-ink mb-1">
          Export &amp; Backup
        </h1>
        <p className="text-sm text-admin-muted">
          Zieh ein Backup vor der Party (leerer Stand), einmal mittendrin und
          nach der Party.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-admin-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileSpreadsheet size={16} /> CSV-Dateien
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CSV_FILES.map((f) => (
            <a
              key={f.href}
              href={f.href}
              className="flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-3 text-sm text-admin-ink shadow-sm hover:border-accent/50 hover:shadow-md transition-colors"
            >
              <FileSpreadsheet size={16} className="text-accent" />
              {f.label}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-admin-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileJson size={16} /> JSON-Dump
        </h2>
        <a
          href="/api/admin/export/dump.json"
          className="inline-flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-3 text-sm text-admin-ink shadow-sm hover:border-accent/50 hover:shadow-md transition-colors"
        >
          <FileJson size={16} className="text-accent" />
          Komplette DB als JSON
        </a>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-admin-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Archive size={16} /> Komplettes Backup
        </h2>
        <a
          href="/api/admin/export/backup.zip"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-fg hover:bg-accent-hover shadow-sm transition-colors"
        >
          <Archive size={20} />
          Komplettes Backup herunterladen
        </a>
        <p className="text-xs text-admin-muted mt-2">
          Enthält <code>dump.json</code>, eine konsistente Kopie der Datenbank
          (<code>db/app.db</code>) und alle Bilder.
        </p>
      </section>
    </div>
  );
}
