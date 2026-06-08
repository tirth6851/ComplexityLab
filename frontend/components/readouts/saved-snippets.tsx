import { Bookmark } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { savedSnippets } from "@/lib/mock-data";

export function SavedSnippets() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved snippets</CardTitle>
        <CardDescription>Reusable solutions you have starred</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {savedSnippets.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Bookmark className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.language} · {s.savedAt}
                </p>
              </div>
            </div>
            <div className="hidden shrink-0 gap-1.5 sm:flex">
              {s.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
