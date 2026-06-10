import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { ProfileForm } from "@/components/settings/profile-form";
import { getOrCreateProfile } from "@/lib/db/profiles";

export const metadata: Metadata = {
  title: "Profile settings · ComplexityLab",
};

export default async function ProfileSettingsPage() {
  const profile = await getOrCreateProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          How you appear in the lab and your analyzer defaults
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profile.ok ? (
          <ProfileForm profile={profile.data} />
        ) : (
          <ErrorState
            title="Could not load your profile"
            message={profile.error}
            hint="If the database hasn't been provisioned yet, apply supabase/migrations and check the Supabase env vars."
          />
        )}
      </CardContent>
    </Card>
  );
}
