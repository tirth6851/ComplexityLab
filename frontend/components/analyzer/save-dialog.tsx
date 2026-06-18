"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TITLE_MAX_LENGTH } from "@/lib/limits";

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called on form submit; dialog closes on ok=true, shows error on ok=false. */
  onSave: (title: string, tags?: string[]) => Promise<{ ok: boolean; error?: string }>;
  defaultTitle?: string;
  showTags?: boolean;
  language?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 8);
}

export function SaveDialog({
  open,
  onClose,
  onSave,
  defaultTitle = "",
  showTags = false,
  language,
  timeComplexity,
  spaceComplexity,
}: SaveDialogProps) {
  const [title, setTitle] = React.useState(defaultTitle);
  const [tagsRaw, setTagsRaw] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canSubmit = title.trim().length > 0 && !pending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    const tags = showTags ? parseTags(tagsRaw) : undefined;
    const result = await onSave(title.trim(), tags);
    if (!mountedRef.current) return;
    if (result.ok) {
      onClose();
    } else {
      setPending(false);
      setError(result.error ?? "Save failed — try again.");
    }
  }

  const meta = [
    language,
    timeComplexity && `Time: ${timeComplexity}`,
    spaceComplexity && `Space: ${spaceComplexity}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={showTags ? "Save snippet" : "Save analysis"}
      initialFocusRef={titleRef}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          ref={titleRef}
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          aria-required="true"
          disabled={pending}
          hint={`${title.length} / ${TITLE_MAX_LENGTH}`}
        />

        {showTags && (
          <Input
            label="Tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            disabled={pending}
            hint="Comma-separated, up to 8"
            placeholder="sorting, array, …"
          />
        )}

        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
