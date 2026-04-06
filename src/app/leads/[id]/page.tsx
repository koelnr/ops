import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { LeadConvertStepper } from "@/components/forms/lead-convert-stepper";
import {
  getLeads,
  getCustomers,
  getBookings,
  getWorkers,
  getLookupContext,
} from "@/lib/db/adapters";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { formatDate } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;

  const [leads, customers, bookings, workers, ctx] = await Promise.all([
    getLeads().catch(() => []),
    getCustomers().catch(() => []),
    getBookings().catch(() => []),
    getWorkers().catch(() => []),
    getLookupContext().catch(() => null),
  ]);

  const lead = leads.find((l) => l.lead_id === id);
  if (!lead) notFound();

  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;
  const areaName = ctx?.areas.get(lead.area_id)?.name ?? lead.area_id;
  const serviceName =
    ctx?.services.get(lead.interested_service_id)?.name ??
    lead.interested_service_id;
  const sourceLabel =
    ctx?.leadSources.get(lead.source_id)?.label ?? lead.source_id;

  const convertedCustomer = lead.converted_customer_id
    ? customers.find((c) => c.customer_id === lead.converted_customer_id)
    : null;
  const convertedBooking = lead.converted_booking_id
    ? bookings.find((b) => b.booking_id === lead.converted_booking_id)
    : null;

  const isConverted = lead.conversion_status.toLowerCase() === "converted";
  const workerOptions = workers.map((w) => ({
    value: w.worker_id,
    label: w.worker_name,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leads">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{lead.prospect_name}</h1>
            <StatusBadge status={lead.follow_up_status} />
            <StatusBadge status={lead.conversion_status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {lead.lead_id}
          </p>
        </div>
        {!isConverted && options && (
          <LeadConvertStepper
            leadId={lead.lead_id}
            prospectName={lead.prospect_name}
            prospectPhone={lead.phone}
            existingCustomers={customers}
            areaOptions={options.areas}
            vehicleTypeOptions={options.vehicleTypes}
            timeSlotOptions={options.timeSlots}
            statusOptions={options.bookingStatuses}
            workerOptions={workerOptions}
          />
        )}
      </div>

      {/* Lead Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="font-medium">{lead.prospect_name}</div>
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-3 w-3" />
              {lead.phone}
            </a>
            {areaName && (
              <div className="text-muted-foreground">{areaName}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{lead.lead_date ? formatDate(lead.lead_date) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Interest</span>
              <span>{serviceName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <span>{sourceLabel || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {lead.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {lead.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conversion Result */}
      {isConverted && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">
              Converted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {convertedCustomer && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Customer</span>
                <Link
                  href={`/customers/${convertedCustomer.customer_id}`}
                  className="font-medium hover:underline"
                >
                  {convertedCustomer.full_name}
                </Link>
              </div>
            )}
            {convertedBooking && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking</span>
                <Link
                  href={`/bookings/${convertedBooking.booking_id}`}
                  className="font-mono text-xs hover:underline"
                >
                  {convertedBooking.booking_id}
                </Link>
              </div>
            )}
            {!convertedCustomer && lead.converted_customer_id && (
              <div className="text-muted-foreground text-xs">
                Customer ID: {lead.converted_customer_id}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
