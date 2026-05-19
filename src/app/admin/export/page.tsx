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
        <h1 className="text-2xl font-bold text-amber-300 mb-1">
          Export &amp; Backup
        </h1>
        <p className="text-sm text-purple-400">
          Zieh ein Backup vor der Party (leerer Stand), einmal mittendrin und
          nach der Party.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileSpreadsheet size={16} /> CSV-Dateien
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CSV_FILES.map((f) => (
            <a
              key={f.href}
              href={f.href}
              className="flex items-center gap-2 rounded-xl border border-purple-700/60 bg-[#1a1030] px-4 py-3 text-sm text-purple-100 hover:border-amber-500/60 transition-colors"
            >
              <FileSpreadsheet size={16} className="text-amber-400" />
              {f.label}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileJson size={16} /> JSON-Dump
        </h2>
        <a
          href="/api/admin/export/dump.json"
          className="inline-flex items-center gap-2 rounded-xl border border-purple-700/60 bg-[#1a1030] px-4 py-3 text-sm text-purple-100 hover:border-amber-500/60 transition-colors"
        >
          <FileJson size={16} className="text-amber-400" />
          Komplette DB als JSON
        </a>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Archive size={16} /> Komplettes Backup
        </h2>
        <a
          href="/api/admin/export/backup.zip"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          <Archive size={20} />
          Komplettes Backup herunterladen
        </a>
        <p className="text-xs text-purple-500 mt-2">
          Enthält <code>dump.json</code>, eine konsistente Kopie der Datenbank
          (<code>db/app.db</code>) und alle Bilder.
        </p>
      </section>
    </div>
  );
}
