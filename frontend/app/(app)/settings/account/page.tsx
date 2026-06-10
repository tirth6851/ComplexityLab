import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DangerZone } from "@/components/settings/danger-zone";

export const metadata: Metadata = {
  title: "Account settings · ComplexityLab",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="cx-label">{label}</span>
      <span className="truncate text-sm text-ink-primary">{value}</span>
    </div>
  );
}

export default async function AccountSettingsPage() {
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "—";
  const name = user?.fullName ?? user?.firstName ?? "—";
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Sign-in is handled by Google via Clerk. Use the account menu in the
            top bar to manage email and security.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--border-subtle)]">
          <Row label="Name" value={name} />
          <Row label="Email" value={email} />
          <Row label="Member since" value={joined} />
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="cx-label">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="cx-label">Session</span>
            <SignOutButton redirectUrl="/">
              <Button variant="outline" size="sm">
                Sign out
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Irreversible actions live here.</CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  );
}
