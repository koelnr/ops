"use client"

import { useMemo, useState } from "react"
import type { Payment } from "@/lib/sheets/types"
import { PaymentsTable } from "@/components/dashboard/payments-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { FilterSelect } from "@/components/shared/filter-select"
import { EmptyState } from "@/components/shared/empty-state"

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Partial", value: "partial" },
  { label: "Refunded", value: "refunded" },
]

const MODE_OPTIONS = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Online", value: "online" },
]

interface PaymentsViewProps {
  payments: Payment[]
}

export function PaymentsView({ payments }: PaymentsViewProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [mode, setMode] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return payments.filter((p) => {
      if (status && p.status !== status) return false
      if (mode && p.mode !== mode) return false
      if (q) {
        return (
          p.id.toLowerCase().includes(q) ||
          p.bookingId.toLowerCase().includes(q) ||
          p.customerId.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [payments, search, status, mode])

  const pendingCount = payments.filter(
    (p) => p.status === "pending" || p.status === "partial"
  ).length

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
      <PageHeader
        title="Payments"
        description={`${payments.length} total · ${pendingCount} pending or partial`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search ID, booking ID, customer…"
          className="w-[280px]"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
          placeholder="All modes"
        />
        {filtered.length !== payments.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {payments.length} shown
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No payments match your filters." />
      ) : (
        <PaymentsTable payments={filtered} />
      )}
    </div>
  )
}
