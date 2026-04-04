"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CustomerWithSummary } from "@/lib/domain";
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
  onEdit: (customer: CustomerWithSummary) => void;
  onDelete: (customer: CustomerWithSummary) => void;
  isPending: boolean;
  isAdmin: boolean;
}

export function getCustomerColumns(actions: CustomerColumnActions): ColumnDef<CustomerWithSummary>[] {
  const columns: ColumnDef<CustomerWithSummary>[] = [
    {
      accessorKey: "customer_id",
      header: "Customer ID",
      size: 112,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.customer_id}</span>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.full_name}</div>
          {row.original.isRepeat && (
            <span className="text-xs text-green-700 dark:text-green-400">Repeat</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: "areaName",
      header: "Area",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.areaName || "—"}</span>
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
      accessorKey: "lastVisit",
      header: "Last Booking",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastVisit ? formatDate(row.original.lastVisit) : "—"}
        </span>
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
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actions.isPending}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.onEdit(customer)}>Edit</DropdownMenuItem>
              {actions.isAdmin && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => actions.onDelete(customer)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
}
