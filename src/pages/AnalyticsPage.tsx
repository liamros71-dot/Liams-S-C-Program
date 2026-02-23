import React, { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useSessions } from "../lib/useSessions";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Pill, SectionTitle } from "../components/ui";
import { e1rmEpley, round2 } from "../lib/utils";

type Point = {
  date: string;
  topSetKg: number;
  volume: number;
  e1rm: number;
  topVbt?: number;
};

export default function AnalyticsPage() {
  const { sessions, loading } = useSessions();
  const [exerciseName, setExerciseName] = useState("Back Squat");
  const [metric, setMetric] = useState<"topSetKg" | "volume" | "e1rm" | "topVbt">("topSetKg");

  const allExerciseNames = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      for (const ex of s.exercises) {
        if (ex.name.trim()) set.add(ex.name.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sessions]);

  const points: Point[] = useMemo(() => {
    const name = exerciseName.trim().toLowerCase();
    if (!name) return [];

    const out: Point[] = [];

    for (const sess of sessions) {
      for (const ex of sess.exercises) {
        if (ex.name.trim().toLowerCase() !== name) continue;

        let topSetKg = 0;
        let volume = 0;
        let e1rm = 0;
        let topVbt: number | undefined = undefined;

        for (const set of ex.sets) {
          const w = Number(set.weightKg) || 0;
          const r = Number(set.reps) || 0;
          volume += w * r;
          topSetKg = Math.max(topSetKg, w);

          e1rm = Math.max(e1rm, e1rmEpley(w, r));

          if (set.vbtMs !== undefined) {
            topVbt = topVbt === undefined ? set.vbtMs : Math.max(topVbt, set.vbtMs);
          }
        }

        out.push({
          date: sess.dateISO,
          topSetKg: round2(topSetKg),
          volume: round2(volume),
          e1rm: round2(e1rm),
          topVbt: topVbt === undefined ? undefined : round2(topVbt)
        });
      }
    }

    // chronological
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, exerciseName]);

  const hasVbt = points.some((p) => p.topVbt !== undefined);

  const metricLabel: Record<typeof metric, string> = {
    topSetKg: "Top set (kg)",
    volume: "Volume (kg·reps)",
    e1rm: "Estimated 1RM (kg)",
    topVbt: "Top velocity (m/s)"
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Exercise graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Exercise</Label>
              <Input
                list="exercise-names"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="Type or select…"
              />
              <datalist id="exercise-names">
                {allExerciseNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              <div className="mt-2 text-xs text-zinc-500">
                Tip: keep exercise names consistent (e.g., “Back Squat” vs “Squat”).
              </div>
            </div>
            <div>
              <Label>Metric</Label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={metric}
                onChange={(e) => setMetric(e.target.value as any)}
              >
                <option value="topSetKg">Top set (kg)</option>
                <option value="volume">Volume (kg·reps)</option>
                <option value="e1rm">Estimated 1RM (kg)</option>
                <option value="topVbt" disabled={!hasVbt}>Top velocity (m/s)</option>
              </select>
              {!hasVbt && (
                <div className="mt-2 text-xs text-zinc-500">
                  VBT metric will unlock once you log a velocity value for this exercise.
                </div>
              )}
            </div>
          </div>

          <SectionTitle>Trend</SectionTitle>
          <div className="h-72 w-full rounded-2xl border border-zinc-200 bg-white p-2">
            {loading ? (
              <div className="p-4 text-sm text-zinc-600">Loading…</div>
            ) : points.length === 0 ? (
              <div className="p-4 text-sm text-zinc-600">No data yet for “{exerciseName}”.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey={metric} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Pill>{metricLabel[metric]}</Pill>
            <Pill>{points.length} points</Pill>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What the metrics mean</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-700 space-y-2">
          <p><strong>Top set</strong>: highest weight you logged for the exercise that day.</p>
          <p><strong>Volume</strong>: sum of weight × reps across all sets (good for hypertrophy/tonnage trends).</p>
          <p><strong>Estimated 1RM</strong>: Epley-based estimate from your best set (trend tool, not gospel).</p>
          <p><strong>Top velocity</strong>: your highest logged m/s value (only if you enabled VBT for that exercise).</p>
        </CardContent>
      </Card>
    </div>
  );
}
