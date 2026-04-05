"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ResolvedBooking } from "@/lib/domain";
import type { SelectOption } from "@/lib/domain";
import { formatDate, formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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

interface BookingColumnActions {
  onEdit: (booking: ResolvedBooking) => void;
  onAssign: (booking: ResolvedBooking) => void;
  onSetBookingStatus: (id: string, statusId: string) => void;
  onDelete: (booking: ResolvedBooking) => void;
  isPending: boolean;
  isAdmin: boolean;
  bookingStatusOptions: SelectOption[];
}

export function getBookingColumns(actions: BookingColumnActions): ColumnDef<ResolvedBooking>[] {
  const columns: ColumnDef<ResolvedBooking>[] = [
    {
      accessorKey: "booking_id",
      header: "Booking ID",
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs">{row.original.booking_id}</span>
          <Link href={`/bookings/${row.original.booking_id}`} className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "service_date",
      header: "Service Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.service_date)}</span>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.customer_name || "—"}</div>
          <div className="text-xs text-muted-foreground">{row.original.phone}</div>
        </div>
      ),
    },
    {
      accessorKey: "time_slot_label",
      header: "Time Slot",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.time_slot_label || "—"}</span>
      ),
    },
    {
      accessorKey: "worker_name",
      header: "Worker",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.worker_name || "—"}</span>
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
      accessorKey: "final_price",
      header: "Price",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm font-medium">
          {row.original.final_price > 0 ? formatCurrency(row.original.final_price) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "booking_status_name",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.booking_status_name || row.original.booking_status_id} />
      ),
    },
  ];

  if (actions.isAdmin) {
    columns.push({
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const booking = row.original;
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
              <DropdownMenuItem onSelect={() => actions.onEdit(booking)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.onAssign(booking)}>Assign Worker</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Booking Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {actions.bookingStatusOptions.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      disabled={booking.booking_status_id === opt.value}
                      onSelect={() => actions.onSetBookingStatus(booking.booking_id, opt.value)}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => actions.onDelete(booking)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
