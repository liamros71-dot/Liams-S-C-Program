import React, { useState } from "react";
import { Download, Upload, Trash2, FileJson } from "lucide-react";
import { exportAll, importAll, type ExportPayload } from "../lib/exportImport";
import { db } from "../lib/db";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, SectionTitle } from "../components/ui";

export default function SettingsPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setMessage(null);
    try {
      const payload = await exportAll();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `liams-sc-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Exported JSON file.");
    } catch (e: any) {
      setMessage(e?.message ?? "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(file: File, mode: "merge" | "replace") {
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ExportPayload;
      await importAll(payload, mode);
      setMessage(mode === "replace" ? "Imported (replaced existing data)." : "Imported (merged).");
    } catch (e: any) {
      setMessage(e?.message ?? "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resetAll() {
    if (!confirm("This will permanently delete all sessions on this device. Continue?")) return;
    setBusy(true);
    setMessage(null);
    try {
      await db.sessions.clear();
      setMessage("All sessions deleted.");
    } catch (e: any) {
      setMessage(e?.message ?? "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Backup & restore</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SectionTitle>Export</SectionTitle>
          <Button onClick={handleExport} disabled={busy}><Download size={16} /> Export JSON</Button>

          <SectionTitle>Import</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Merge into current data</Label>
              <Input
                type="file"
                accept="application/json"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f, "merge");
                }}
              />
              <div className="text-xs text-zinc-500">Adds/updates sessions by ID.</div>
            </div>

            <div className="space-y-2">
              <Label>Replace all current data</Label>
              <Input
                type="file"
                accept="application/json"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f, "replace");
                }}
              />
              <div className="text-xs text-zinc-500">Wipes then imports.</div>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <div className="flex items-center gap-2"><FileJson size={16} /> {message}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="danger" onClick={resetAll} disabled={busy}><Trash2 size={16} /> Delete all sessions on this device</Button>
          <div className="text-xs text-zinc-500">
            This only affects this device/browser storage. Export first if you want a backup.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap (optional upgrades)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-700 space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Session templates (pin your favourites)</li>
            <li>Rest timer</li>
            <li>Auto-populate last used weights for each exercise</li>
            <li>Cloud sync (Firebase/Supabase) if you want multi-device</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
