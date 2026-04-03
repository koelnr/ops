"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Customer } from "@/lib/sheets/types";
import { formatCurrency, formatDate } from "@/lib/format";
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

interface CustomerColumnActions {
  onEdit: (customer: Customer) => void;
  isPending: boolean;
}

export function getCustomerColumns(actions: CustomerColumnActions): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: "customerId",
      header: "Customer ID",
      size: 112,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.customerId}</span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.customerName}</span>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">{row.original.phoneNumber}</span>
      ),
    },
    {
      accessorKey: "primaryArea",
      header: "Area",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.primaryArea || "—"}</span>
      ),
    },
    {
      accessorKey: "totalBookings",
      header: "Bookings",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-right block">{row.original.totalBookings}</span>
      ),
    },
    {
      accessorKey: "totalRevenue",
      header: "Revenue",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm font-medium text-right block">
          {row.original.totalRevenue > 0 ? formatCurrency(row.original.totalRevenue) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "lastBookingDate",
      header: "Last Booking",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.lastBookingDate)}</span>
      ),
    },
    {
      accessorKey: "subscriptionStatus",
      header: "Subscription",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.subscriptionStatus || "—"}</span>
      ),
    },
    {
      accessorKey: "preferredTimeSlot",
      header: "Preferred Slot",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.preferredTimeSlot || "—"}</span>
      ),
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const customer = row.original;
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
              <DropdownMenuItem onSelect={() => actions.onEdit(customer)}>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
