import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { GoogleAuthButton } from "@/components/ui/google-auth-button";

export const metadata: Metadata = {
  title: "Sign up · ComplexityLab",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start analyzing complexity in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <GoogleAuthButton mode="sign-up" />
    </AuthShell>
  );
}
