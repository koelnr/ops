"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Booking, Customer, Worker, BookingStatus } from "@/lib/domain";
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
  onEdit: (booking: Booking) => void;
  onAssign: (booking: Booking) => void;
  onSetBookingStatus: (id: string, statusId: string) => void;
  onDelete: (booking: Booking) => void;
  isPending: boolean;
  isAdmin: boolean;
  customerMap: Map<string, Customer>;
  workerMap: Map<string, Worker>;
  ctxMaps: {
    statuses: Map<string, BookingStatus>;
    timeSlots: Map<string, { label: string }>;
    areas: Map<string, { name: string }>;
  } | null;
  bookingStatusOptions: SelectOption[];
}

export function getBookingColumns(actions: BookingColumnActions): ColumnDef<Booking>[] {
  const columns: ColumnDef<Booking>[] = [
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
      accessorKey: "customer_id",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => {
        const customer = actions.customerMap.get(row.original.customer_id);
        return (
          <div>
            <div className="font-medium text-sm">{customer?.full_name ?? row.original.customer_id}</div>
            <div className="text-xs text-muted-foreground">{customer?.phone ?? ""}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "time_slot_id",
      header: "Time Slot",
      cell: ({ row }) => {
        const label = actions.ctxMaps?.timeSlots.get(row.original.time_slot_id)?.label ?? row.original.time_slot_id;
        return <span className="text-sm">{label || "—"}</span>;
      },
    },
    {
      accessorKey: "assigned_worker_id",
      header: "Worker",
      cell: ({ row }) => {
        const worker = actions.workerMap.get(row.original.assigned_worker_id);
        return <span className="text-sm">{worker?.worker_name ?? "—"}</span>;
      },
    },
    {
      accessorKey: "area_id",
      header: "Area",
      cell: ({ row }) => {
        const area = actions.ctxMaps?.areas.get(row.original.area_id);
        return <span className="text-sm text-muted-foreground">{area?.name ?? (row.original.area_id || "—")}</span>;
      },
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
      accessorKey: "booking_status_id",
      header: "Status",
      cell: ({ row }) => {
        const status = actions.ctxMaps?.statuses.get(row.original.booking_status_id);
        return <StatusBadge status={status?.label ?? row.original.booking_status_id} />;
      },
    },
  ];

  if (actions.isAdmin) {
    columns.push({
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const booking = row.original;
        const currentStatusLabel = actions.ctxMaps?.statuses.get(booking.booking_status_id)?.label;
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
                      disabled={booking.booking_status_id === opt.value || currentStatusLabel === opt.label}
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
