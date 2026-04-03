"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Payment } from "@/lib/sheets/types"
import { mutate } from "@/lib/mutate"
import { formatCurrency, formatDate } from "@/lib/format"
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [mode, setMode] = useState("")

  // Reference dialog state
  const [refDialogOpen, setRefDialogOpen] = useState(false)
  const [refTarget, setRefTarget] = useState<Payment | null>(null)
  const [reference, setReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  async function handleStatusUpdate(
    id: string,
    newStatus: string,
    reference?: string
  ) {
    const body: Record<string, unknown> = { status: newStatus }
    if (reference) body.reference = reference
    const result = await mutate(`/api/payments/${id}`, body)
    if (result.ok) {
      toast.success(`Payment marked as ${newStatus}`)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error ?? "Failed to update payment")
    }
  }

  async function handleUpdateReference() {
    if (!refTarget) return
    setIsSubmitting(true)
    const result = await mutate(`/api/payments/${refTarget.id}`, {
      status: refTarget.status,
      reference: reference.trim(),
    })
    setIsSubmitting(false)
    if (result.ok) {
      toast.success("Reference updated")
      setRefDialogOpen(false)
      setReference("")
      setRefTarget(null)
      startTransition(() => router.refresh())
    } else {
      toast.error(result.error ?? "Failed to update reference")
    }
  }

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
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Payment ID</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="w-[48px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{payment.bookingId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{payment.customerId}</TableCell>
                  <TableCell className="text-right font-medium text-sm">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="text-sm capitalize">{payment.mode.replace("_", " ")}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(payment.date)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{payment.reference ?? "—"}</TableCell>
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
                          disabled={payment.status === "paid"}
                          onSelect={() => handleStatusUpdate(payment.id, "paid")}
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={payment.status === "partial"}
                          onSelect={() => handleStatusUpdate(payment.id, "partial")}
                        >
                          Mark as Partial
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={payment.status === "pending"}
                          onSelect={() => handleStatusUpdate(payment.id, "pending")}
                        >
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => {
                            setRefTarget(payment)
                            setReference(payment.reference ?? "")
                            setRefDialogOpen(true)
                          }}
                        >
                          Update Reference
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

      <Dialog open={refDialogOpen} onOpenChange={setRefDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Reference</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Transaction ID</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI-123456789"
              onKeyDown={(e) => e.key === "Enter" && handleUpdateReference()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateReference} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
