import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, ScanLine } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SnippetItem } from "@/components/snippets/snippet-item";
import { buttonClassName } from "@/components/ui/button";
import { listSnippets } from "@/lib/db/snippets";
import { deleteSnippetAction } from "./actions";

export const metadata: Metadata = {
  title: "Snippets · ComplexityLab",
};

export default async function SnippetsPage() {
  const res = await listSnippets(100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Snippets</CardTitle>
            <CardDescription>
              Reusable solutions saved from the analyzer
            </CardDescription>
          </div>
          <Link href="/analyzer" className={buttonClassName({ size: "sm" })}>
            <ScanLine className="h-3.5 w-3.5" aria-hidden />
            Open analyzer
          </Link>
        </CardHeader>
        <CardContent className="space-y-1">
          {!res.ok ? (
            <ErrorState
              title="Could not load snippets"
              message={res.error}
              hint="If the database hasn't been provisioned yet, apply supabase/migrations and check the Supabase env vars."
            />
          ) : res.data.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No snippets saved yet"
              description="Analyze code and hit “Save snippet” to keep solutions you want to reuse."
              action={
                <Link
                  href="/analyzer"
                  className={buttonClassName({ variant: "outline", size: "sm" })}
                >
                  <ScanLine className="h-3.5 w-3.5" aria-hidden />
                  Open analyzer
                </Link>
              }
            />
          ) : (
            res.data.map((s) => (
              <SnippetItem
                key={s.id}
                snippet={s}
                deleteAction={deleteSnippetAction.bind(null, s.id)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
