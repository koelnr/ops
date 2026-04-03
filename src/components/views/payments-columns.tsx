"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Payment } from "@/lib/sheets/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface PaymentColumnActions {
  onEdit: (payment: Payment) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onUpdateRef: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
  isPending: boolean;
}

export function getPaymentColumns(actions: PaymentColumnActions): ColumnDef<Payment>[] {
  return [
    {
      accessorKey: "paymentId",
      header: "Payment ID",
      size: 120,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.paymentId}</span>
      ),
    },
    {
      accessorKey: "bookingId",
      header: "Booking ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.bookingId}</span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.customerName}</span>
      ),
    },
    {
      accessorKey: "amountDue",
      header: "Amount Due",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-right font-medium text-sm tabular-nums block">
          {formatCurrency(row.original.amountDue)}
        </span>
      ),
    },
    {
      accessorKey: "amountReceived",
      header: "Received",
      cell: ({ row }) => (
        <span className="text-right text-sm tabular-nums text-muted-foreground block">
          {formatCurrency(row.original.amountReceived)}
        </span>
      ),
    },
    {
      accessorKey: "paymentMode",
      header: "Mode",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.paymentMode}</span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} />,
    },
    {
      accessorKey: "paymentDate",
      header: "Payment Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.paymentDate)}</span>
      ),
    },
    {
      accessorKey: "upiTransactionRef",
      header: "UPI Ref",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.upiTransactionRef || "—"}</span>
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
              <DropdownMenuItem onSelect={() => actions.onEdit(payment)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                disabled={payment.paymentStatus === "Paid"}
                onSelect={() => actions.onStatusUpdate(payment.paymentId, "Paid")}
              >
                Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={payment.paymentStatus === "Partially Paid"}
                onSelect={() => actions.onStatusUpdate(payment.paymentId, "Partially Paid")}
              >
                Mark as Partially Paid
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={payment.paymentStatus === "Pending"}
                onSelect={() => actions.onStatusUpdate(payment.paymentId, "Pending")}
              >
                Mark as Pending
              </DropdownMenuItem>
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
