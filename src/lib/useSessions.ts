import { useEffect, useMemo, useState } from "react";
import { db } from "./db";
import type { Session } from "./types";

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const rows = await db.sessions.orderBy("dateISO").reverse().toArray();
    setSessions(rows);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 800); // light polling to keep it simple
    return () => clearInterval(id);
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, Session>();
    sessions.forEach((s) => m.set(s.id, s));
    return m;
  }, [sessions]);

  return { sessions, byId, loading, refresh };
}
