import React, { useMemo, useState } from "react";
import { Plus, Search, Trash2, Copy, CalendarDays } from "lucide-react";
import { v4 as uuid } from "uuid";
import { db } from "../lib/db";
import { todayISO, cn, safeNum } from "../lib/utils";
import { useSessions } from "../lib/useSessions";
import type { ExerciseEntry, Session, SetEntry } from "../lib/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Divider, Input, Label, Pill, SectionTitle, Textarea, Toggle } from "../components/ui";

export default function WorkoutPage() {
  const { sessions, loading } = useSessions();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => (s.name + " " + s.dateISO).toLowerCase().includes(q));
  }, [sessions, query]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return sessions.find((s) => s.id === selectedId) ?? null;
  }, [sessions, selectedId]);

  async function createSession() {
    const now = Date.now();
    const s: Session = {
      id: uuid(),
      name: "New Session",
      dateISO: todayISO(),
      exercises: [],
      createdAt: now,
      updatedAt: now
    };
    await db.sessions.add(s);
    setSelectedId(s.id);
  }

  async function duplicateSession(session: Session) {
    const now = Date.now();
    const copy: Session = {
      ...session,
      id: uuid(),
      name: session.name + " (copy)",
      dateISO: todayISO(),
      createdAt: now,
      updatedAt: now
    };
    await db.sessions.add(copy);
    setSelectedId(copy.id);
  }

  async function deleteSession(sessionId: string) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await db.sessions.delete(sessionId);
    if (selectedId === sessionId) setSelectedId(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card className="lg:sticky lg:top-4 h-fit">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
              <Input className="pl-9" placeholder="Search sessions..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button onClick={createSession}><Plus size={16} /> New</Button>
          </div>

          <div className="max-h-[55vh] overflow-auto rounded-2xl border border-zinc-200">
            {loading && <div className="p-3 text-sm text-zinc-600">Loading…</div>}
            {!loading && filtered.length === 0 && <div className="p-3 text-sm text-zinc-600">No sessions yet.</div>}
            <ul className="divide-y divide-zinc-200">
              {filtered.map((s) => (
                <li key={s.id} className={cn("p-3 hover:bg-zinc-50 cursor-pointer", selectedId === s.id && "bg-zinc-100")} onClick={() => setSelectedId(s.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {s.dateISO}</span>
                        <Pill>{s.exercises.length} ex</Pill>
                      </div>
                    </div>
                    <button
                      className="rounded-xl p-2 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSession(s);
                      }}
                      title="Duplicate"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-zinc-500">
            Tip: Duplicate a session to reuse a template.
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!selected && (
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-zinc-700">
                Select a session (or create one). Your data stays on-device and works offline.
              </div>
            </CardContent>
          </Card>
        )}

        {selected && <SessionEditor key={selected.id} session={selected} onDelete={() => deleteSession(selected.id)} />}
      </div>
    </div>
  );
}

function SessionEditor({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const [busy, setBusy] = useState(false);

  async function update(patch: Partial<Session>) {
    setBusy(true);
    await db.sessions.update(session.id, { ...patch, updatedAt: Date.now() });
    setBusy(false);
  }

  async function addExercise() {
    const ex: ExerciseEntry = {
      id: uuid(),
      name: "New Exercise",
      sets: []
    };
    await update({ exercises: [...session.exercises, ex] });
  }

  async function deleteExercise(exId: string) {
    const next = session.exercises.filter((e) => e.id !== exId);
    await update({ exercises: next });
  }

  async function moveExercise(exId: string, dir: -1 | 1) {
    const idx = session.exercises.findIndex((e) => e.id === exId);
    const next = [...session.exercises];
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= next.length) return;
    const [item] = next.splice(idx, 1);
    next.splice(j, 0, item);
    await update({ exercises: next });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle>Session details</CardTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={session.name} onChange={(e) => update({ name: e.target.value })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={session.dateISO} onChange={(e) => update({ dateISO: e.target.value })} />
              </div>
            </div>
            <div className="mt-3">
              <Label>Notes (optional)</Label>
              <Textarea value={session.note ?? ""} onChange={(e) => update({ note: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={addExercise}><Plus size={16} /> Add exercise</Button>
            <Button variant="danger" onClick={onDelete}><Trash2 size={16} /> Delete</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Divider />
          <div className="mt-4 space-y-4">
            {session.exercises.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
                Add your first exercise. You can optionally enable VBT per exercise.
              </div>
            )}
            {session.exercises.map((ex, i) => (
              <ExerciseEditor
                key={ex.id}
                ex={ex}
                index={i}
                canMoveUp={i > 0}
                canMoveDown={i < session.exercises.length - 1}
                onChange={async (next) => {
                  const arr = session.exercises.map((x) => (x.id === ex.id ? next : x));
                  await update({ exercises: arr });
                }}
                onDelete={() => deleteExercise(ex.id)}
                onMoveUp={() => moveExercise(ex.id, -1)}
                onMoveDown={() => moveExercise(ex.id, 1)}
              />
            ))}
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            {busy ? "Saving…" : "Saved automatically."}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ExerciseEditor({
  ex,
  index,
  onChange,
  onDelete,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown
}: {
  ex: ExerciseEntry;
  index: number;
  onChange: (next: ExerciseEntry) => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [showVbt, setShowVbt] = useState(false);

  function updateSet(setId: string, patch: Partial<SetEntry>) {
    const nextSets = ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s));
    onChange({ ...ex, sets: nextSets });
  }

  function addSet() {
    const s: SetEntry = { id: uuid(), reps: 5, weightKg: 0, completed: false };
    onChange({ ...ex, sets: [...ex.sets, s] });
  }

  function removeSet(setId: string) {
    onChange({ ...ex, sets: ex.sets.filter((s) => s.id !== setId) });
  }

  const headerPill = ex.category ? ex.category : `Exercise ${index + 1}`;

  return (
    <Card className="border-zinc-200">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Pill>{headerPill}</Pill>
            <span className="text-xs text-zinc-500">{ex.sets.length} sets</span>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Exercise name</Label>
              <Input value={ex.name} onChange={(e) => onChange({ ...ex, name: e.target.value })} />
            </div>
            <div>
              <Label>Category (optional)</Label>
              <Input value={ex.category ?? ""} placeholder="Lower / Upper / Accessories…" onChange={(e) => onChange({ ...ex, category: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <Label>Exercise note (optional)</Label>
            <Textarea value={ex.note ?? ""} onChange={(e) => onChange({ ...ex, note: e.target.value })} rows={2} />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Toggle checked={showVbt} onChange={setShowVbt} label="Enable VBT fields (m/s) for this exercise" />
            <Button variant="secondary" onClick={addSet}><Plus size={16} /> Add set</Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" disabled={!canMoveUp} onClick={onMoveUp} title="Move up">↑</Button>
          <Button variant="ghost" disabled={!canMoveDown} onClick={onMoveDown} title="Move down">↓</Button>
          <Button variant="danger" onClick={onDelete} title="Delete exercise"><Trash2 size={16} /></Button>
        </div>
      </CardHeader>

      <CardContent>
        <SectionTitle>Sets</SectionTitle>

        {ex.sets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
            Add a set to start logging.
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="p-2 text-left w-14">Set</th>
                  <th className="p-2 text-left">kg</th>
                  <th className="p-2 text-left">reps</th>
                  <th className="p-2 text-left">RPE</th>
                  {showVbt && <th className="p-2 text-left">m/s</th>}
                  <th className="p-2 text-left">Done</th>
                  <th className="p-2 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {ex.sets.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="p-2 font-medium">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        className="w-24 rounded-xl border border-zinc-200 px-2 py-1 outline-none focus:border-zinc-400"
                        inputMode="decimal"
                        value={String(s.weightKg)}
                        onChange={(e) => updateSet(s.id, { weightKg: safeNum(e.target.value) })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="w-20 rounded-xl border border-zinc-200 px-2 py-1 outline-none focus:border-zinc-400"
                        inputMode="numeric"
                        value={String(s.reps)}
                        onChange={(e) => updateSet(s.id, { reps: Math.max(0, Math.floor(safeNum(e.target.value))) })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="w-20 rounded-xl border border-zinc-200 px-2 py-1 outline-none focus:border-zinc-400"
                        inputMode="decimal"
                        placeholder="—"
                        value={s.rpe === undefined ? "" : String(s.rpe)}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          updateSet(s.id, { rpe: v === "" ? undefined : safeNum(v) });
                        }}
                      />
                    </td>
                    {showVbt && (
                      <td className="p-2">
                        <input
                          className="w-20 rounded-xl border border-zinc-200 px-2 py-1 outline-none focus:border-zinc-400"
                          inputMode="decimal"
                          placeholder="—"
                          value={s.vbtMs === undefined ? "" : String(s.vbtMs)}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            updateSet(s.id, { vbtMs: v === "" ? undefined : safeNum(v) });
                          }}
                        />
                      </td>
                    )}
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={!!s.completed}
                        onChange={(e) => updateSet(s.id, { completed: e.target.checked })}
                        className="h-5 w-5 accent-zinc-900"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        onClick={() => removeSet(s.id)}
                        title="Remove set"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-2 text-xs text-zinc-500">
          Quick math: volume = Σ(weight × reps). e1RM is estimated for trend graphs.
        </div>
      </CardContent>
    </Card>
  );
}
