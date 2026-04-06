import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCustomers,
  getVehicles,
  getBookings,
  getPayments,
  getComplaints,
  getLookupContext,
  getWorkers,
} from "@/lib/db/adapters";
import {
  getBookingAmountPaid,
  buildCustomerWithSummary,
  getBookingResolvedView,
} from "@/lib/selectors";
import { formatCurrency, formatDate } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = ["bookings", "vehicles", "payments", "complaints"] as const;
type Tab = (typeof TABS)[number];

export default async function CustomerDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: Tab = (TABS.includes(tab as Tab) ? tab : "bookings") as Tab;

  const [customers, vehicles, bookings, payments, complaints, workers, ctx] =
    await Promise.all([
      getCustomers().catch(() => []),
      getVehicles().catch(() => []),
      getBookings().catch(() => []),
      getPayments().catch(() => []),
      getComplaints().catch(() => []),
      getWorkers().catch(() => []),
      getLookupContext().catch(() => null),
    ]);

  const customer = customers.find((c) => c.customer_id === id);
  if (!customer) notFound();

  if (!ctx) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Failed to load lookup data.
      </div>
    );
  }

  const summary = buildCustomerWithSummary(customer, bookings, payments, ctx);
  const customerVehicles = vehicles.filter((v) => v.customer_id === id);
  const customerBookings = bookings
    .filter((b) => b.customer_id === id)
    .sort((a, b) => b.service_date.localeCompare(a.service_date));
  const customerPayments = payments.filter((p) =>
    customerBookings.some((b) => b.booking_id === p.booking_id),
  );
  const customerComplaints = complaints.filter((c) =>
    customerBookings.some((b) => b.booking_id === c.booking_id),
  );

  const tabLinks = TABS.map((t) => ({
    label: t.charAt(0).toUpperCase() + t.slice(1),
    href: `/customers/${id}?tab=${t}`,
    value: t,
    count:
      t === "bookings"
        ? customerBookings.length
        : t === "vehicles"
          ? customerVehicles.length
          : t === "payments"
            ? customerPayments.length
            : customerComplaints.length,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{customer.full_name}</h1>
            {summary.isRepeat && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
              >
                Repeat
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {customer.customer_id}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/bookings/new?customer_id=${id}`}>New Booking</Link>
        </Button>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1 hover:text-foreground text-muted-foreground"
            >
              <Phone className="h-3 w-3" />
              {customer.phone}
            </a>
            {customer.secondary_phone && (
              <a
                href={`tel:${customer.secondary_phone}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {customer.secondary_phone}
              </a>
            )}
            {summary.areaName && (
              <div className="text-muted-foreground">{summary.areaName}</div>
            )}
            {customer.full_address && (
              <div className="text-xs text-muted-foreground">
                {customer.full_address}
              </div>
            )}
            {customer.landmark && (
              <div className="text-xs text-muted-foreground">
                Near {customer.landmark}
              </div>
            )}
            {customer.google_maps_link && (
              <a
                href={customer.google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <MapPin className="h-3 w-3" />
                Maps
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="text-2xl font-semibold tabular-nums">
              {summary.totalBookings}
            </div>
            {summary.lastVisit && (
              <div className="text-xs text-muted-foreground">
                Last: {formatDate(summary.lastVisit)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="text-2xl font-semibold tabular-nums">
              {formatCurrency(summary.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              lifetime collected
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabLinks.map(({ label, href, value, count }) => (
          <Link
            key={value}
            href={href}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {count > 0 && (
              <span className="text-xs rounded-full bg-muted px-1.5">
                {count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "bookings" &&
        (customerBookings.length === 0 ? (
          <EmptyState message="No bookings yet" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerBookings.map((b) => {
                  const bPayments = payments.filter(
                    (p) => p.booking_id === b.booking_id,
                  );
                  const paid = getBookingAmountPaid(bPayments);
                  const status = ctx.bookingStatuses.get(b.booking_status_id);
                  const slot = ctx.timeSlots.get(b.time_slot_id);
                  return (
                    <TableRow key={b.booking_id}>
                      <TableCell>
                        <Link
                          href={`/bookings/${b.booking_id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {formatDate(b.service_date)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {slot?.label ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={status?.label ?? b.booking_status_id}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatCurrency(b.final_price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {formatCurrency(paid)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}

      {activeTab === "vehicles" &&
        (customerVehicles.length === 0 ? (
          <EmptyState message="No vehicles on file" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customerVehicles.map((v) => {
              const vType = ctx.vehicleTypes.get(v.vehicle_type_id);
              return (
                <Card key={v.vehicle_id}>
                  <CardContent className="pt-4 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {v.car_model}
                        {v.brand ? ` (${v.brand})` : ""}
                      </div>
                      {v.is_primary_vehicle && (
                        <Badge variant="outline" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    {v.registration_number && (
                      <div className="font-mono text-xs text-muted-foreground">
                        {v.registration_number}
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      {[v.color, vType?.name].filter(Boolean).join(" · ")}
                    </div>
                    {v.parking_notes && (
                      <div className="text-xs text-muted-foreground">
                        {v.parking_notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}

      {activeTab === "payments" &&
        (customerPayments.length === 0 ? (
          <EmptyState message="No payments recorded" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPayments.map((p) => {
                  const mode = ctx.paymentModes.get(p.payment_mode_id);
                  const status = ctx.paymentStatuses.get(p.payment_status_id);
                  return (
                    <TableRow key={p.payment_id}>
                      <TableCell className="text-sm">
                        {p.payment_date ? formatDate(p.payment_date) : "—"}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/bookings/${p.booking_id}`}
                          className="font-mono text-xs hover:underline text-muted-foreground"
                        >
                          {p.booking_id}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mode?.label ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={status?.label ?? p.payment_status_id}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {formatCurrency(p.amount_received)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}

      {activeTab === "complaints" &&
        (customerComplaints.length === 0 ? (
          <EmptyState message="No complaints" />
        ) : (
          <div className="space-y-3">
            {customerComplaints.map((c) => {
              const type = ctx.complaintTypes.get(c.complaint_type_id);
              return (
                <Card key={c.complaint_id}>
                  <CardContent className="pt-4 space-y-1.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">
                          {type?.label ?? c.complaint_type_id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(c.complaint_date)}
                        </div>
                      </div>
                      <StatusBadge status={c.resolution_status} />
                    </div>
                    {c.details && (
                      <p className="text-muted-foreground">{c.details}</p>
                    )}
                    {c.resolution_notes && (
                      <p className="text-xs text-muted-foreground border-t pt-1.5">
                        Resolution: {c.resolution_notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
    </div>
  );
}
