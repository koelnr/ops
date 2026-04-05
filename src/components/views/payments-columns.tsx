"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ResolvedPayment } from "@/lib/domain";
import type { SelectOption } from "@/lib/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface PaymentColumnActions {
  onEdit: (payment: ResolvedPayment) => void;
  onSetPaymentStatus: (id: string, statusId: string) => void;
  onUpdateRef: (payment: ResolvedPayment) => void;
  onDelete: (payment: ResolvedPayment) => void;
  isPending: boolean;
  paymentStatusOptions: SelectOption[];
}

export function getPaymentColumns(
  actions: PaymentColumnActions,
): ColumnDef<ResolvedPayment>[] {
  return [
    {
      accessorKey: "payment_id",
      header: "Payment ID",
      size: 120,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.payment_id}</span>
      ),
    },
    {
      accessorKey: "booking_id",
      header: "Booking ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.booking_id}
        </span>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.customer_name || "—"}</span>
      ),
    },
    {
      accessorKey: "final_price",
      header: "Amount Due",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-right font-medium text-sm tabular-nums block">
          {formatCurrency(row.original.final_price)}
        </span>
      ),
    },
    {
      accessorKey: "amount_received",
      header: "Received",
      cell: ({ row }) => (
        <span className="text-right text-sm tabular-nums text-muted-foreground block">
          {formatCurrency(row.original.amount_received)}
        </span>
      ),
    },
    {
      accessorKey: "payment_mode_name",
      header: "Mode",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.payment_mode_name || "—"}</span>
      ),
    },
    {
      accessorKey: "payment_status_name",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.payment_status_name} />
      ),
    },
    {
      accessorKey: "payment_date",
      header: "Payment Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.payment_date)}
        </span>
      ),
    },
    {
      accessorKey: "upi_transaction_ref",
      header: "UPI Ref",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.upi_transaction_ref || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={actions.isPending}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.onEdit(payment)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Payment Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {actions.paymentStatusOptions.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      disabled={payment.payment_status_id === opt.value}
                      onSelect={() =>
                        actions.onSetPaymentStatus(
                          payment.payment_id,
                          opt.value,
                        )
                      }
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.onUpdateRef(payment)}>
                Update UPI Reference
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => actions.onDelete(payment)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
