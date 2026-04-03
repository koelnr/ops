"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Booking } from "@/lib/sheets/types"
import { mutate } from "@/lib/mutate"
import { formatDate } from "@/lib/format"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { FilterSelect } from "@/components/shared/filter-select"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/dashboard/status-badge"
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MoreHorizontal } from "lucide-react"

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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [pkg, setPkg] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")

  // Assign worker dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null)
  const [workerName, setWorkerName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  async function handleMutate(id: string, body: Record<string, unknown>, successMsg: string) {
    const result = await mutate(`/api/bookings/${id}`, body)
    if (result.ok) {
      toast.success(successMsg)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error ?? "Failed to update booking")
    }
  }

  async function handleAssignWorker() {
    if (!assignTarget || !workerName.trim()) return
    setIsSubmitting(true)
    const result = await mutate(`/api/bookings/${assignTarget.id}`, {
      assignedWorker: workerName.trim(),
    })
    setIsSubmitting(false)
    if (result.ok) {
      toast.success(`Worker assigned to ${assignTarget.id}`)
      setAssignDialogOpen(false)
      setWorkerName("")
      setAssignTarget(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error ?? "Failed to assign worker")
    }
  }

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
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Booking ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Assigned Worker</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-[48px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(booking.date)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{booking.customerName}</div>
                    <div className="text-xs text-muted-foreground">{booking.customerId}</div>
                  </TableCell>
                  <TableCell className="text-sm">{booking.timeSlot ?? "—"}</TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">{booking.servicePackage}</span>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">{booking.vehicleType}</span>
                  </TableCell>
                  <TableCell className="text-sm">{booking.assignedWorker ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={booking.paymentStatus} />
                  </TableCell>
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
                          onSelect={() => {
                            setAssignTarget(booking)
                            setWorkerName(booking.assignedWorker ?? "")
                            setAssignDialogOpen(true)
                          }}
                        >
                          Assign Worker
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(["pending", "confirmed", "in_progress", "completed", "cancelled"] as const).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                disabled={booking.status === s}
                                onSelect={() => handleMutate(booking.id, { status: s }, `Status updated to ${s.replace("_", " ")}`)}
                              >
                                <span className="capitalize">{s.replace("_", " ")}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Payment Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(["pending", "paid", "partial", "refunded"] as const).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                disabled={booking.paymentStatus === s}
                                onSelect={() => handleMutate(booking.id, { paymentStatus: s }, `Payment marked as ${s}`)}
                              >
                                <span className="capitalize">{s}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="worker-name">Worker Name</Label>
            <Input
              id="worker-name"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="Enter worker name"
              onKeyDown={(e) => e.key === "Enter" && handleAssignWorker()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignWorker} disabled={isSubmitting || !workerName.trim()}>
              {isSubmitting ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
