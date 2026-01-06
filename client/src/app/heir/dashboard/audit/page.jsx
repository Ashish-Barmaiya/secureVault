"use client";

import AuditLogViewer from "@/components/AuditLogViewer";

export default function HeirAuditPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
        <p className="text-slate-400">
          View a history of your activity as an heir.
        </p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
