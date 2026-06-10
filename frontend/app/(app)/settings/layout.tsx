import type { ReactNode } from "react";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SettingsTabs />
      {children}
    </div>
  );
}
