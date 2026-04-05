import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLookupContext } from "@/lib/sheets/lookups";

export default async function LookupsPage() {
  const ctx = await getLookupContext().catch(() => null);

  if (!ctx) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Failed to load lookups.
      </div>
    );
  }

  const sections: {
    title: string;
    items: { id: string; label: string; sub?: string }[];
  }[] = [
    {
      title: "Areas",
      items: [...ctx.areas.values()].map((a) => ({
        id: a.area_id,
        label: a.name,
      })),
    },
    {
      title: "Services",
      items: [...ctx.services.values()].map((s) => ({
        id: s.service_id,
        label: s.name,
        sub: s.category,
      })),
    },
    {
      title: "Vehicle Types",
      items: [...ctx.vehicleTypes.values()].map((v) => ({
        id: v.vehicle_type_id,
        label: v.name,
      })),
    },
    {
      title: "Time Slots",
      items: [...ctx.timeSlots.values()].map((t) => ({
        id: t.time_slot_id,
        label: t.label,
        sub: `${t.start_time}–${t.end_time}`,
      })),
    },
    {
      title: "Booking Statuses",
      items: [...ctx.bookingStatuses.values()].map((s) => ({
        id: s.booking_status_id,
        label: s.label,
      })),
    },
    {
      title: "Payment Statuses",
      items: [...ctx.paymentStatuses.values()].map((s) => ({
        id: s.payment_status_id,
        label: s.label,
      })),
    },
    {
      title: "Payment Modes",
      items: [...ctx.paymentModes.values()].map((m) => ({
        id: m.payment_mode_id,
        label: m.label,
      })),
    },
    {
      title: "Lead Sources",
      items: [...ctx.leadSources.values()].map((s) => ({
        id: s.source_id,
        label: s.label,
      })),
    },
    {
      title: "Complaint Types",
      items: [...ctx.complaintTypes.values()].map((t) => ({
        id: t.complaint_type_id,
        label: t.label,
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Lookup Tables</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Read-only view. Edit values directly in the Google Sheet.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(({ title, items }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                {title}
                <Badge variant="outline" className="text-xs font-normal">
                  {items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground">No entries</p>
              ) : (
                <div className="space-y-1">
                  {items.map(({ id, label, sub }) => (
                    <div
                      key={id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span>{label}</span>
                        {sub && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({sub})
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
