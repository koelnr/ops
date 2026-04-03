"use client"

import { useMemo, useState } from "react"
import type { Complaint } from "@/lib/sheets/types"
import { ComplaintsTable } from "@/components/dashboard/complaints-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { FilterSelect } from "@/components/shared/filter-select"
import { EmptyState } from "@/components/shared/empty-state"

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
        <ComplaintsTable complaints={filtered} limit={Infinity} />
      )}
    </div>
  )
}
