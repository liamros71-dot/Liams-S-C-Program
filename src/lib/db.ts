import Dexie, { type Table } from "dexie";
import type { Session, AppSettings } from "./types";

export class LiamsDb extends Dexie {
  sessions!: Table<Session, string>;
  settings!: Table<AppSettings & { id: string }, string>;

  constructor() {
    super("liams_sc_program_db");
    this.version(1).stores({
      sessions: "id, dateISO, name, updatedAt",
      settings: "id"
    });
  }
}

export const db = new LiamsDb();

export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.get("settings");
  if (!row) {
    const defaults: AppSettings = { units: "kg" };
    await db.settings.put({ id: "settings", ...defaults });
    return defaults;
  }
  const { id: _id, ...settings } = row;
  return settings;
}

export async function setSettings(next: AppSettings): Promise<void> {
  await db.settings.put({ id: "settings", ...next });
}
