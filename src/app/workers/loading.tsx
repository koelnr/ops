function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
      <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
      <div className="h-4 w-16 rounded bg-muted animate-pulse" />
      <div className="h-4 w-16 rounded bg-muted animate-pulse" />
      <div className="h-4 w-16 rounded bg-muted animate-pulse" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
      <div className="h-6 w-20 rounded bg-muted animate-pulse" />
      <div className="h-4 w-56 rounded bg-muted/60 animate-pulse" />

      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-52 rounded-md border bg-muted/40 animate-pulse" />
        <div className="h-9 w-32 rounded-md border bg-muted/30 animate-pulse" />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-3">
          {[120, 80, 90, 100, 90, 90].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
