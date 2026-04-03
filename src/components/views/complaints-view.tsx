"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Complaint } from "@/lib/sheets/types"
import { mutate } from "@/lib/mutate"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { FilterSelect } from "@/components/shared/filter-select"
import { EmptyState } from "@/components/shared/empty-state"
import { MoreHorizontal } from "lucide-react"

const FLAG_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "Escalated", value: "escalated" },
  { label: "Ignored", value: "ignored" },
]

interface ComplaintsViewProps {
  complaints: Complaint[]
}

export function ComplaintsView({ complaints }: ComplaintsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [flagFilter, setFlagFilter] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return complaints.filter((c) => {
      if (flagFilter && c.flag !== flagFilter) return false
      if (q) {
        return (
          c.description.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          c.bookingId.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [complaints, search, flagFilter])

  const unresolvedCount = complaints.filter(
    (c) => c.flag === "open" || c.flag === "escalated"
  ).length

  async function handleFlagUpdate(
    complaint: Complaint,
    flag: "open" | "resolved" | "escalated" | "ignored",
    successMsg: string
  ) {
    const body: Record<string, unknown> = { flag }
    if (flag === "resolved") {
      body.resolvedAt = new Date().toISOString().split("T")[0]
    }
    const result = await mutate(`/api/complaints/${complaint.id}`, body)
    if (result.ok) {
      toast.success(successMsg)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error ?? "Failed to update complaint")
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
      <PageHeader
        title="Complaints"
        description={`${complaints.length} total · ${unresolvedCount} unresolved`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search description, ID…"
          className="w-[260px]"
        />
        <FilterSelect
          value={flagFilter}
          onChange={setFlagFilter}
          options={FLAG_OPTIONS}
          placeholder="All statuses"
        />
        {filtered.length !== complaints.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {complaints.length} shown
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No complaints match your filters." />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Resolved</TableHead>
                <TableHead className="w-[48px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered
                .slice()
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-mono text-xs">{complaint.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{complaint.customerId}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{complaint.bookingId}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="text-sm truncate" title={complaint.description}>
                        {complaint.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={complaint.flag} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{complaint.createdAt}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{complaint.resolvedAt ?? "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={complaint.flag === "resolved"}
                            onSelect={() => handleFlagUpdate(complaint, "resolved", `Complaint ${complaint.id} marked resolved`)}
                          >
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={complaint.flag === "escalated"}
                            onSelect={() => handleFlagUpdate(complaint, "escalated", `Complaint ${complaint.id} escalated`)}
                          >
                            Escalate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={complaint.flag === "ignored"}
                            onSelect={() => handleFlagUpdate(complaint, "ignored", `Complaint ${complaint.id} ignored`)}
                          >
                            Ignore
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
