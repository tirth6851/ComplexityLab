# Phase 2 · Feature 1 — Save Flow Improvements (mandatory titles)

> **Complexity: S (~0.5 day).** No DB changes. Touches the analyzer/snippets
> save path + one new modal primitive. Ship this **first** — it improves every
> save and de-risks the larger features.

---

## Goal

Today `saveAnalysisAction` / `saveSnippetAction` auto-derive a title from the
first function name (`deriveTitle`). Replace the silent auto-title with an
explicit **Save dialog** that requires a user-confirmed title (prefilled with
the derived default, fully editable). Same change for snippets, which also get
an optional tags field.

**Decision (resolved):** keep `deriveTitle()` — it becomes the *prefill default*
in the dialog, not the stored value. The user always sees and confirms the title.

---

## UX flow

```
[Save analysis] button (SaveActions)
   └─► opens <SaveDialog> (modal)
         ├─ Title input  (required, prefilled = deriveTitle(code), autofocus, selected)
         ├─ (snippets only) Tags input (optional, comma-separated → string[])
         ├─ Read-only meta line: language · detected Big-O (analysis only)
         ├─ [Cancel]  [Save]   (Save disabled while title is empty/whitespace)
         └─ on submit → call existing server action with { title } added
```

- **Prefill + select-all** the derived title so Enter-to-accept is one keystroke.
- On success: close dialog, fire existing success toast, (analysis) optionally
  route to the new `/analyses/[id]`.
- On failure: keep dialog open, render the action's `error` string in an inline
  `role="alert"` region; do not close.

---

## Validation (must match server)

| Rule | Client (dialog) | Server (action) |
|---|---|---|
| Non-empty after `trim()` | disable Save | reject `"A title is required."` |
| Max length `TITLE_MAX_LENGTH` (200) | `maxLength` attr + counter | `.slice(0, 200)` (already in db layer) |
| Tags: split on `,`, trim, drop empties, max 8, each ≤ 32 chars | live | clamp server-side |

Server is the source of truth — the client checks are UX only.

---

## Accessibility & keyboard (hard requirements)

Build a reusable `components/ui/dialog.tsx` (see "New primitive" below) that the
consent gate can later adopt too. It must provide:

- `role="dialog"` `aria-modal="true"` `aria-labelledby` (title) `aria-describedby`.
- **Focus trap** within the dialog; **autofocus** the title input on open.
- **Escape** closes (= Cancel). **Enter** in the title input submits.
- **Focus return** to the triggering button on close.
- Backdrop click closes; backdrop has `aria-hidden`.
- Inline error uses `role="alert"` (assertive) so SR users hear validation fails.
- Respect `prefers-reduced-motion` for the open/close transition (tokens already
  define motion vars — see `DESIGN_HANDOFF.md`).

---

## Edge cases

- **Empty buffer:** Save button in `SaveActions` already disabled when no code;
  dialog never opens. Keep that guard.
- **Whitespace-only title:** treated as empty (trim) → Save disabled + server reject.
- **Unmount/route change while pending:** the action is fire-and-forget from the
  client; guard the post-await `setState` with the existing mounted-ref pattern
  used in `AnalyzerWorkbench` (abort/ignore late state writes).
- **Double submit:** disable Save + show pending spinner while the promise is in
  flight (mirror `ConfirmDeleteButton` pending pattern).
- **Rate limited:** action returns the limiter message → shown inline; dialog stays open.
- **Duplicate titles:** allowed (no uniqueness constraint) — by design.

---

## Files

**New**
- `frontend/components/ui/dialog.tsx` — generic accessible modal (focus trap,
  Escape, focus return, backdrop). Headless-ish: takes `open`, `onClose`,
  `title`, `children`, optional `initialFocusRef`.
- `frontend/components/analyzer/save-dialog.tsx` — composes `Dialog` + title/tags
  form; owns local form state; calls the passed `onSave(title, tags?)`.
- `frontend/tests/components/save-dialog.test.tsx`
- `frontend/tests/components/dialog.test.tsx`

**Modified**
- `frontend/components/analyzer/save-actions.tsx` — open `SaveDialog` instead of
  calling the action directly; pass `deriveTitle` default down (or compute in
  dialog from `code`). Wire success/error toasts.
- `frontend/app/(app)/analyzer/actions.ts` — add `title: string` to both action
  inputs; validate (non-empty trim); pass through to `createAnalysis` /
  `createSnippet` instead of calling `deriveTitle` inside the action. Keep
  `deriveTitle` exported for the client default.
- `frontend/app/(app)/snippets/*` — if snippets are saved from a list/editor,
  apply the same dialog. (Analyzer is the primary save surface today.)

**Unchanged:** `lib/db/analyses.ts`, `lib/db/snippets.ts` (already accept `title`
and clamp to `TITLE_MAX_LENGTH`).

---

## Tests

- Dialog: opens/closes, Escape closes, focus trap keeps Tab inside, focus returns
  to trigger, Enter submits, backdrop click closes.
- SaveDialog: Save disabled on empty/whitespace title; tags parsing (split/trim/
  cap); error string rendered in `role="alert"` on action failure; pending state
  disables Save.
- Action unit (extend existing `tests/integration/save-actions` mocks): rejects
  empty title before hitting the DB; passes user title (not derived) to the db fn.

---

## Out of scope (note as future)

- Editing the title of an already-saved analysis (would need an `updateAnalysis`
  db fn + action). Flag in ROADMAP; not required here.
