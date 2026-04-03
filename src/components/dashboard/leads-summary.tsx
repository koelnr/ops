import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "@/lib/sheets/types"
import { classifyFollowUpStatus, classifyConversionStatus } from "@/lib/lead-utils"
import { formatDate } from "@/lib/format"
import { StatusBadge } from "@/components/dashboard/status-badge"

interface FunnelStatProps {
  label: string
  value: number
  color: string
}

function FunnelStat({ label, value, color }: FunnelStatProps) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1.5 text-2xl font-semibold tabular-nums leading-none ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

interface LeadsSummaryProps {
  leads: Lead[]
}

export function LeadsSummary({ leads }: LeadsSummaryProps) {
  const total = leads.length
  const contacted = leads.filter((l) => classifyFollowUpStatus(l.followUpStatus) === "contacted").length
  const converted = leads.filter((l) => classifyConversionStatus(l.conversionStatus) === "converted").length
  const pendingFollowUp = leads.filter((l) => classifyFollowUpStatus(l.followUpStatus) === "pending").length

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.leadDate).getTime() - new Date(a.leadDate).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FunnelStat label="Total Leads" value={total} color="" />
        <FunnelStat label="Contacted" value={contacted} color="text-blue-600 dark:text-blue-400" />
        <FunnelStat label="Converted" value={converted} color="text-green-600 dark:text-green-400" />
        <FunnelStat label="Pending Follow-up" value={pendingFollowUp} color="text-yellow-600 dark:text-yellow-500" />
      </div>

      {recentLeads.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Follow-Up</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLeads.map((lead) => (
                <TableRow key={`${lead.leadDate}-${lead.prospectName}`}>
                  <TableCell className="font-medium text-sm">{lead.prospectName}</TableCell>
                  <TableCell className="text-sm font-mono">{lead.phoneNumber}</TableCell>
                  <TableCell className="text-sm">{lead.leadSource}</TableCell>
                  <TableCell>
                    <StatusBadge status={lead.followUpStatus} />
                  </TableCell>
                  <TableCell>
                    {lead.conversionStatus ? (
                      <StatusBadge status={lead.conversionStatus} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(lead.leadDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No leads found.
          </div>
        </div>
      )}
    </div>
  )
}
