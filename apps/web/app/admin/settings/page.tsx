"use client";

import { useState } from "react";

type RecoveryMode = "off" | "track_only" | "allocate_recovery";

type RecoveryBasis = "revenue" | "gross_profit";

type SettingsState = {
  recoveryMode: RecoveryMode;
  recoveryBasis: RecoveryBasis;
  targetMargin: number;
};

const DEFAULT_SETTINGS: SettingsState = {
  recoveryMode: "track_only",
  recoveryBasis: "revenue",
  targetMargin: 0.35
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    console.log("SnapSell: save settings", settings);
    setMessage("Settings saved (mock). Worker endpoint wiring pending.");
  }

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Admin settings</h2>
        <p className="text-sm text-slate-500">
          Configure pallet recovery behaviour and default pricing targets. These values feed the Worker API and UI
          suggestions documented in the channel sync & recovery brief.
        </p>
      </header>

      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <section className="space-y-4 rounded border border-slate-200 p-4">
        <h3 className="text-lg font-medium">Pallet recovery</h3>
        <label className="block text-sm font-medium text-slate-700">Recovery mode</label>
        <select
          className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
          value={settings.recoveryMode}
          onChange={(ev) => update("recoveryMode", ev.target.value as RecoveryMode)}
        >
          <option value="off">Off</option>
          <option value="track_only">Track only</option>
          <option value="allocate_recovery">Allocate recovery memo</option>
        </select>

        <label className="block text-sm font-medium text-slate-700">Recovery basis</label>
        <select
          className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
          value={settings.recoveryBasis}
          onChange={(ev) => update("recoveryBasis", ev.target.value as RecoveryBasis)}
        >
          <option value="revenue">Revenue</option>
          <option value="gross_profit">Gross profit</option>
        </select>
      </section>

      <section className="space-y-4 rounded border border-slate-200 p-4">
        <h3 className="text-lg font-medium">Pricing signals</h3>
        <label className="block text-sm font-medium text-slate-700">Default target margin %</label>
        <input
          type="number"
          className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
          step={0.01}
          value={settings.targetMargin}
          onChange={(ev) => update("targetMargin", Number(ev.target.value))}
        />
        <p className="text-xs text-slate-500">
          Used when suggesting prices from unit COGS (price = COGS / (1 - margin)). Variants can override this per-item.
        </p>
      </section>

      <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700" onClick={save}>
        Save settings
      </button>
    </main>
  );
}
