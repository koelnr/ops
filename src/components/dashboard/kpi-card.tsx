import { Card, CardContent } from "@/components/ui/card"

interface KpiCardProps {
  label: string
  value: string | number
  sublabel?: string
}

export function KpiCard({ label, value, sublabel }: KpiCardProps) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums leading-none">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  )
}
