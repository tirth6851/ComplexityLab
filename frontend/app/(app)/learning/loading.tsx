export default function LearningLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-ds-lg bg-surface-panel" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-52 rounded-ds-xl bg-surface-panel" />
        ))}
      </div>
    </div>
  );
}
