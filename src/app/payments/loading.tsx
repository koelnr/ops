export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
      <div className="h-7 w-36 rounded bg-muted animate-pulse" />
      <div className="h-4 w-48 rounded bg-muted/60 animate-pulse" />
      <div className="h-9 w-full rounded-md border bg-muted/30 animate-pulse" />
      <div className="h-64 rounded-md border bg-muted/20 animate-pulse" />
    </div>
  )
}
