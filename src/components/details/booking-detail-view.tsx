"use client";

import Link from "next/link";
import type { BookingResolvedView, Complaint } from "@/lib/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

interface BookingDetailViewProps {
  view: BookingResolvedView;
  complaints: Complaint[];
}

export function BookingDetailView({
  view,
  complaints,
}: BookingDetailViewProps) {
  const {
    booking,
    customer,
    vehicle,
    worker,
    areaName,
    timeSlotLabel,
    bookingStatusLabel,
    services,
    payments,
    amountPaid,
    amountDue,
  } = view;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold font-mono">
              {booking.booking_id}
            </h1>
            <StatusBadge status={bookingStatusLabel} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(booking.service_date)}
            {timeSlotLabel ? ` · ${timeSlotLabel}` : ""}
            {areaName ? ` · ${areaName}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            {formatCurrency(booking.final_price)}
          </div>
          <div className="text-xs text-muted-foreground">
            Paid: {formatCurrency(amountPaid)} · Due:{" "}
            {formatCurrency(amountDue)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {customer ? (
              <>
                <div className="font-medium">{customer.full_name}</div>
                <div className="text-muted-foreground">{customer.phone}</div>
                {customer.secondary_phone && (
                  <div className="text-muted-foreground">
                    {customer.secondary_phone}
                  </div>
                )}
                {customer.full_address && (
                  <div className="text-muted-foreground">
                    {customer.full_address}
                  </div>
                )}
                {customer.landmark && (
                  <div className="text-muted-foreground text-xs">
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
              </>
            ) : (
              <span className="text-muted-foreground">No customer data</span>
            )}
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {vehicle ? (
              <>
                <div className="font-medium">
                  {vehicle.car_model}
                  {vehicle.brand ? ` (${vehicle.brand})` : ""}
                </div>
                {vehicle.registration_number && (
                  <div className="text-muted-foreground font-mono">
                    {vehicle.registration_number}
                  </div>
                )}
                {vehicle.color && (
                  <div className="text-muted-foreground">{vehicle.color}</div>
                )}
                {vehicle.parking_notes && (
                  <div className="text-xs text-muted-foreground">
                    {vehicle.parking_notes}
                  </div>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">No vehicle data</span>
            )}
          </CardContent>
        </Card>

        {/* Worker */}
        {worker && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Assigned Worker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{worker.worker_name}</div>
              <div className="text-muted-foreground">{worker.phone}</div>
              <div className="text-xs text-muted-foreground">
                {worker.status}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price</span>
              <span className="tabular-nums">
                {formatCurrency(booking.base_price)}
              </span>
            </div>
            {booking.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums text-red-600">
                  −{formatCurrency(booking.discount_amount)}
                </span>
              </div>
            )}
            {booking.addon_total > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Add-ons</span>
                <span className="tabular-nums">
                  +{formatCurrency(booking.addon_total)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Final Price</span>
              <span className="tabular-nums">
                {formatCurrency(booking.final_price)}
              </span>
            </div>
            {booking.notes && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                {booking.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {services.map((s) => (
                <div
                  key={s.booking_service_id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{s.serviceName}</span>
                    {s.quantity > 1 && (
                      <span className="text-muted-foreground ml-2">
                        ×{s.quantity}
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums">
                    {formatCurrency(s.line_total)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments */}
      {payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Payments</span>
              <span
                className={`text-xs font-normal ${amountDue === 0 ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"}`}
              >
                {amountDue === 0
                  ? "Fully paid"
                  : `${formatCurrency(amountDue)} outstanding`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {payments.map((p) => (
                <div
                  key={p.payment_id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {p.payment_id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(p.payment_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular-nums font-medium">
                      {formatCurrency(p.amount_received)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.payment_status_id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Complaints */}
      {complaints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Complaints ({complaints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {complaints.map((c) => (
                <div key={c.complaint_id} className="py-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.complaint_id}
                    </span>
                    <StatusBadge status={c.resolution_status} />
                  </div>
                  <p className="text-sm">{c.details}</p>
                  {c.resolution_notes && (
                    <p className="text-xs text-muted-foreground">
                      Resolution: {c.resolution_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
