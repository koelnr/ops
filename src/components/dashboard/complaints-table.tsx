import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Complaint } from "@/lib/sheets/types"
import { StatusBadge } from "./status-badge"

interface ComplaintsTableProps {
  complaints: Complaint[]
  limit?: number
}

export function ComplaintsTable({ complaints, limit = 10 }: ComplaintsTableProps) {
  if (complaints.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No complaints on record.
        </div>
      </div>
    )
  }

  const sorted = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">ID</TableHead>
            <TableHead>Customer ID</TableHead>
            <TableHead>Booking ID</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((complaint) => (
            <TableRow key={complaint.id}>
              <TableCell className="font-mono text-xs">{complaint.id}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{complaint.customerId}</TableCell>
              <TableCell className="font-mono text-xs">{complaint.bookingId}</TableCell>
              <TableCell className="max-w-[280px]">
                <p className="text-sm truncate" title={complaint.description}>
                  {complaint.description}
                </p>
              </TableCell>
              <TableCell>
                <StatusBadge status={complaint.flag} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{complaint.createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
