export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 rounded bg-muted" />
        <div className="h-4 w-96 rounded bg-muted" />
        <div className="grid gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 rounded-lg border border-border bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
