import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AuthShell } from "@/components/layout/auth-shell";
import { GoogleAuthButton } from "@/components/ui/google-auth-button";

export const metadata: Metadata = {
  title: "Sign up · ComplexityLab",
};

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
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
