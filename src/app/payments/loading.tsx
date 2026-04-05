function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-muted animate-pulse"
          style={{ flex: i === 0 ? "0 0 100px" : i === 3 ? "0 0 80px" : 1 }}
        />
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
      <div className="h-6 w-24 rounded bg-muted animate-pulse" />
      <div className="h-4 w-48 rounded bg-muted/60 animate-pulse" />

      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-72 rounded-md border bg-muted/40 animate-pulse" />
        <div className="h-9 w-32 rounded-md border bg-muted/30 animate-pulse" />
        <div className="h-9 w-32 rounded-md border bg-muted/30 animate-pulse" />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-3">
          {[100, 100, 100, 80, 80, 80, 90, 100].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded bg-muted animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} cols={8} />
        ))}
      </div>
    </div>
  );
}
