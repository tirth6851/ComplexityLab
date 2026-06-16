import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AuthShell } from "@/components/layout/auth-shell";
import { GoogleAuthButton } from "@/components/ui/google-auth-button";

export const metadata: Metadata = {
  title: "Sign in · ComplexityLab",
};

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your ComplexityLab workspace"
      footer={
        <>
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <GoogleAuthButton mode="sign-in" />
    </AuthShell>
  );
}
