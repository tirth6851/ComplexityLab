export default function DsaCoachLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-ds-md bg-surface-panel" />
        <div className="space-y-1">
          <div className="h-3 w-32 rounded bg-surface-panel" />
          <div className="h-5 w-24 rounded bg-surface-panel" />
        </div>
      </div>
      <div className="h-[58vh] rounded-ds-xl bg-surface-panel" />
      <div className="h-16 rounded-ds-lg bg-surface-panel" />
    </div>
  );
}
