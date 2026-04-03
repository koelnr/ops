"use client"

import { useMemo, useState } from "react"
import type { Booking } from "@/lib/sheets/types"
import { BookingsTable } from "@/components/dashboard/bookings-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { FilterSelect } from "@/components/shared/filter-select"
import { EmptyState } from "@/components/shared/empty-state"

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

const VEHICLE_OPTIONS = [
  { label: "Sedan", value: "sedan" },
  { label: "SUV", value: "suv" },
  { label: "Hatchback", value: "hatchback" },
  { label: "Van", value: "van" },
  { label: "Truck", value: "truck" },
  { label: "Bike", value: "bike" },
]

const PACKAGE_OPTIONS = [
  { label: "Basic", value: "basic" },
  { label: "Standard", value: "standard" },
  { label: "Premium", value: "premium" },
  { label: "Custom", value: "custom" },
]

const PAYMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Partial", value: "partial" },
  { label: "Refunded", value: "refunded" },
]

interface BookingsViewProps {
  bookings: Booking[]
}

export function BookingsView({ bookings }: BookingsViewProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [pkg, setPkg] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return bookings.filter((b) => {
      if (status && b.status !== status) return false
      if (vehicle && b.vehicleType !== vehicle) return false
      if (pkg && b.servicePackage !== pkg) return false
      if (paymentStatus && b.paymentStatus !== paymentStatus) return false
      if (q) {
        return (
          b.customerName.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          (b.assignedWorker?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [bookings, search, status, vehicle, pkg, paymentStatus])

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-4">
      <PageHeader
        title="Bookings"
        description={`${bookings.length} total bookings`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search ID, customer, worker…"
          className="w-[260px]"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={vehicle}
          onChange={setVehicle}
          options={VEHICLE_OPTIONS}
          placeholder="All vehicles"
        />
        <FilterSelect
          value={pkg}
          onChange={setPkg}
          options={PACKAGE_OPTIONS}
          placeholder="All packages"
        />
        <FilterSelect
          value={paymentStatus}
          onChange={setPaymentStatus}
          options={PAYMENT_STATUS_OPTIONS}
          placeholder="Payment status"
        />
        {filtered.length !== bookings.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {bookings.length} shown
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No bookings match your filters." />
      ) : (
        <BookingsTable bookings={filtered} showDate />
      )}
    </div>
  )
}
