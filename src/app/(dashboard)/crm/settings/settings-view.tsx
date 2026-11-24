"use client";

import { useState } from "react";
import { Sliders, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCrmSettings } from "@/actions/crm";
import type { CrmSettings } from "@/types/crm";

export function SettingsView({ initialSettings }: { initialSettings: CrmSettings }) {
  const [settings, setSettings] = useState<CrmSettings>(initialSettings);
  const [newSource, setNewSource] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSource = () => {
    if (!newSource.trim()) return;
    if (settings.leadSources.includes(newSource.trim())) return;
    setSettings({
      ...settings,
      leadSources: [...settings.leadSources, newSource.trim()],
    });
    setNewSource("");
  };

  const handleRemoveSource = (src: string) => {
    setSettings({
      ...settings,
      leadSources: settings.leadSources.filter((s) => s !== src),
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateCrmSettings(settings as any);
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground">CRM System Settings</h2>
          <p className="text-muted-foreground mt-0.5">
            Configure pipeline stages, lead acquisition channels, and defaults
          </p>
        </div>
        <Button onClick={handleSave} size="sm" disabled={isSaving} className="gap-1.5">
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 p-3 text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="size-4" />
          CRM Settings updated successfully!
        </div>
      )}

      {/* Lead Sources Configuration */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Configured Lead Inflow Sources</h3>
        <p className="text-muted-foreground">
          Channel options selectable when capturing or importing new leads
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {settings.leadSources.map((source) => (
            <span
              key={source}
              className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
            >
              <span>{source}</span>
              <button
                type="button"
                onClick={() => handleRemoveSource(source)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 max-w-xs">
          <Input
            placeholder="Add new source (e.g. Instagram Ads)"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            className="h-8 text-xs"
          />
          <Button onClick={handleAddSource} size="sm" variant="outline" className="h-8 shrink-0">
            <Plus className="size-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Deal Pipeline Stages */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Pipeline Stages & Win Probability</h3>
        <p className="text-muted-foreground">Default stages and probabilities across deal kanban</p>

        <div className="divide-y divide-border/40 rounded-lg border">
          {settings.dealStages.map((st, idx) => (
            <div key={st.id} className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground font-bold">{idx + 1}.</span>
                <span className="font-semibold text-foreground">{st.label}</span>
              </div>
              <span className="font-mono text-muted-foreground">{st.probability}% Probability</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
