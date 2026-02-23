import { db } from "./db";
import type { Session, AppSettings } from "./types";

export type ExportPayload = {
  version: 1;
  exportedAt: number;
  sessions: Session[];
  settings: AppSettings;
};

export async function exportAll(): Promise<ExportPayload> {
  const sessions = await db.sessions.toArray();
  const settingsRow = await db.settings.get("settings");
  const settings: AppSettings = settingsRow ? ({ units: settingsRow.units } as AppSettings) : { units: "kg" };

  return {
    version: 1,
    exportedAt: Date.now(),
    sessions,
    settings
  };
}

export async function importAll(payload: ExportPayload, mode: "merge" | "replace"): Promise<void> {
  if (payload.version !== 1) throw new Error("Unsupported export version.");

  await db.transaction("rw", db.sessions, db.settings, async () => {
    if (mode === "replace") {
      await db.sessions.clear();
    }
    // Upsert sessions
    for (const s of payload.sessions) {
      await db.sessions.put(s);
    }
    await db.settings.put({ id: "settings", ...payload.settings });
  });
}
