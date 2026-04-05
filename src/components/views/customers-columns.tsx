"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ResolvedCustomer } from "@/lib/domain";
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
  onEdit: (customer: ResolvedCustomer) => void;
  onDelete: (customer: ResolvedCustomer) => void;
  isPending: boolean;
  isAdmin: boolean;
}

export function getCustomerColumns(actions: CustomerColumnActions): ColumnDef<ResolvedCustomer>[] {
  const columns: ColumnDef<ResolvedCustomer>[] = [
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
          {row.original.is_repeat && (
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
      accessorKey: "area_name",
      header: "Area",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.area_name || "—"}</span>
      ),
    },
    {
      accessorKey: "total_bookings",
      header: "Bookings",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-right block">{row.original.total_bookings}</span>
      ),
    },
    {
      accessorKey: "total_revenue",
      header: "Revenue",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm font-medium text-right block">
          {row.original.total_revenue > 0 ? formatCurrency(row.original.total_revenue) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "last_visit",
      header: "Last Booking",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.last_visit ? formatDate(row.original.last_visit) : "—"}
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
