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
            hint="This is usually temporary — please refresh in a moment. If it keeps happening, the data service may be down."
          />
        )}
      </CardContent>
    </Card>
  );
}
