"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoloPulseLoader } from "@/components/ui/holo-pulse-loader";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateProfileAction } from "@/app/(app)/settings/actions";
import { LANGUAGES } from "@/lib/analysis/languages";
import type { Profile } from "@/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = React.useState(
    profile.displayName ?? "",
  );
  const [preferredLanguage, setPreferredLanguage] = React.useState(
    profile.preferredLanguage,
  );
  const [state, setState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "saving") return;
    setState("saving");
    setError(null);
    const res = await updateProfileAction({ displayName, preferredLanguage });
    if (res.ok) {
      setState("saved");
      timerRef.current = setTimeout(() => setState("idle"), 2500);
    } else {
      setState("error");
      setError(res.error ?? "Could not save your profile.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="How should the lab greet you?"
        maxLength={80}
        hint="Shown on your dashboard. Leave empty to use your Google name."
      />

      <Select
        label="Preferred language"
        value={preferredLanguage}
        onChange={(e) => setPreferredLanguage(e.target.value)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </Select>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={state === "saving"}>
          {state === "saved" && <Check className="h-4 w-4" aria-hidden />}
          {state === "saving" && (
            <HoloPulseLoader
              label="Saving profile"
              size="sm"
              className="w-auto [&>p]:sr-only"
            />
          )}
          {state === "saving"
            ? "Saving…"
            : state === "saved"
              ? "Saved"
              : "Save changes"}
        </Button>
        <span role="status" aria-live="polite" className="text-xs">
          {state === "saved" && <span className="text-primary">Profile saved.</span>}
          {state === "error" && <span className="text-destructive">{error}</span>}
        </span>
      </div>
    </form>
  );
}
