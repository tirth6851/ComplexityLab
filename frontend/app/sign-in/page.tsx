import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { GoogleAuthButton } from "@/components/ui/google-auth-button";

export const metadata: Metadata = {
  title: "Sign in · ComplexityLab",
};

export default function SignInPage() {
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
