import React, { useMemo, useState } from "react";
import { BarChart3, Dumbbell, Settings } from "lucide-react";
import { cn } from "./lib/utils";
import WorkoutPage from "./pages/WorkoutPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";

type Tab = "workout" | "analytics" | "settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("workout");

  const header = useMemo(() => {
    if (tab === "workout") return { title: "Liam's S&C Program", subtitle: "Log sessions fast. Stay consistent." };
    if (tab === "analytics") return { title: "Progress", subtitle: "Trends across load, volume & e1RM." };
    return { title: "Settings", subtitle: "Export, import, preferences." };
  }, [tab]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{header.title}</h1>
              <p className="text-sm text-zinc-600">{header.subtitle}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">Offline-ready</span>
            </div>
          </div>
        </div>

        {tab === "workout" && <WorkoutPage />}
        {tab === "analytics" && <AnalyticsPage />}
        {tab === "settings" && <SettingsPage />}

      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
          <TabButton active={tab === "workout"} onClick={() => setTab("workout")} icon={<Dumbbell size={18} />} label="Workout" />
          <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")} icon={<BarChart3 size={18} />} label="Progress" />
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings size={18} />} label="Settings" />
        </div>
      </nav>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-medium",
        active ? "text-zinc-900" : "text-zinc-500"
      )}
      aria-current={active ? "page" : undefined}
    >
      <div className={cn("rounded-xl p-2", active ? "bg-zinc-100" : "bg-transparent")}>{icon}</div>
      {label}
    </button>
  );
}
