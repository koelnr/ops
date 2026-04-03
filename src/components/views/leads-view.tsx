"use client"

import { useMemo, useState } from "react"
import type { Lead } from "@/lib/sheets/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { FilterSelect } from "@/components/shared/filter-select"
import { EmptyState } from "@/components/shared/empty-state"

interface LeadsViewProps {
  leads: Lead[]
}

export function LeadsView({ leads }: LeadsViewProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")

  const statusOptions = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.status).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }))
  }, [leads])

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.source).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }))
  }, [leads])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false
      if (sourceFilter && l.source !== sourceFilter) return false
      if (q) {
        return (
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.notes?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [leads, search, statusFilter, sourceFilter])

  const pendingCount = leads.filter((l) => {
    const s = l.status.toLowerCase()
    return s.includes("pending") || s.includes("new") || s.includes("fresh") || s.includes("follow")
  }).length

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
      <PageHeader
        title="Leads"
        description={`${leads.length} total · ${pendingCount} pending follow-up`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone…"
          className="w-[240px]"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="All statuses"
        />
        <FilterSelect
          value={sourceFilter}
          onChange={setSourceFilter}
          options={sourceOptions}
          placeholder="All sources"
        />
        {filtered.length !== leads.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {leads.length} shown
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No leads match your filters." />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const isPending = (() => {
                  const s = lead.status.toLowerCase()
                  return s.includes("pending") || s.includes("new") || s.includes("fresh") || s.includes("follow")
                })()
                return (
                  <TableRow key={lead.id} className={isPending ? "bg-yellow-50/50 dark:bg-yellow-900/10" : undefined}>
                    <TableCell className="font-mono text-xs">{lead.id}</TableCell>
                    <TableCell className="font-medium text-sm">{lead.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.phone}</TableCell>
                    <TableCell className="text-sm">{lead.source}</TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.createdAt}</TableCell>
                    <TableCell className="max-w-[240px]">
                      <p className="text-xs text-muted-foreground truncate" title={lead.notes ?? undefined}>
                        {lead.notes ?? "—"}
                      </p>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
