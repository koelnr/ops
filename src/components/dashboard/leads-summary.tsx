import { Card, CardContent } from "@/components/ui/card";

interface FunnelStatProps {
  label: string;
  value: number;
  color: string;
}

function FunnelStat({ label, value, color }: FunnelStatProps) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-1.5 text-2xl font-semibold tabular-nums leading-none ${color}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

interface LeadsSummaryProps {
  stats: {
    pending: number;
    contacted: number;
    converted: number;
    lost: number;
  };
  total: number;
}

export function LeadsSummary({ stats, total }: LeadsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <FunnelStat label="Total Leads" value={total} color="" />
      <FunnelStat
        label="Contacted"
        value={stats.contacted}
        color="text-blue-600 dark:text-blue-400"
      />
      <FunnelStat
        label="Converted"
        value={stats.converted}
        color="text-green-600 dark:text-green-400"
      />
      <FunnelStat
        label="Pending Follow-up"
        value={stats.pending}
        color="text-yellow-600 dark:text-yellow-500"
      />
    </div>
  );
}
