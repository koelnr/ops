"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { create } from "@/lib/mutate";
import type { Customer, SelectOption } from "@/lib/domain";

interface LeadConvertStepperProps {
  leadId: string;
  prospectName: string;
  prospectPhone: string;
  existingCustomers: Customer[];
  areaOptions: SelectOption[];
  vehicleTypeOptions: SelectOption[];
  timeSlotOptions: SelectOption[];
  statusOptions: SelectOption[];
  workerOptions: SelectOption[];
}

type Step = "customer" | "vehicle" | "booking" | "confirm";

interface CustomerForm {
  mode: "existing" | "new";
  existingId: string;
  full_name: string;
  phone: string;
  area_id: string;
  full_address: string;
}

interface VehicleForm {
  mode: "skip" | "new";
  car_model: string;
  brand: string;
  vehicle_type_id: string;
  registration_number: string;
  color: string;
}

interface BookingForm {
  mode: "skip" | "create";
  service_date: string;
  time_slot_id: string;
  booking_status_id: string;
  assigned_worker_id: string;
  base_price: string;
  final_price: string;
  area_id: string;
}

export function LeadConvertStepper({
  leadId,
  prospectName,
  prospectPhone,
  existingCustomers,
  areaOptions,
  vehicleTypeOptions,
  timeSlotOptions,
  statusOptions,
  workerOptions,
}: LeadConvertStepperProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("customer");
  const [loading, setLoading] = useState(false);

  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    mode: "new",
    existingId: "",
    full_name: prospectName,
    phone: prospectPhone,
    area_id: "",
    full_address: "",
  });

  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({
    mode: "skip",
    car_model: "",
    brand: "",
    vehicle_type_id: "",
    registration_number: "",
    color: "",
  });

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    mode: "skip",
    service_date: new Date().toISOString().split("T")[0],
    time_slot_id: "",
    booking_status_id: "",
    assigned_worker_id: "",
    base_price: "",
    final_price: "",
    area_id: "",
  });

  const steps: Step[] = ["customer", "vehicle", "booking", "confirm"];
  const stepIndex = steps.indexOf(step);

  const stepLabels: Record<Step, string> = {
    customer: "1. Customer",
    vehicle: "2. Vehicle",
    booking: "3. Booking",
    confirm: "4. Confirm",
  };

  function next() {
    setStep(steps[stepIndex + 1]);
  }

  function back() {
    setStep(steps[stepIndex - 1]);
  }

  const customerValid =
    customerForm.mode === "existing"
      ? !!customerForm.existingId
      : !!customerForm.full_name && !!customerForm.phone;

  const vehicleValid =
    vehicleForm.mode === "skip" ||
    (!!vehicleForm.car_model && !!vehicleForm.vehicle_type_id);

  const bookingValid =
    bookingForm.mode === "skip" ||
    (!!bookingForm.service_date &&
      !!bookingForm.time_slot_id &&
      !!bookingForm.booking_status_id);

  async function handleConvert() {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};

      if (customerForm.mode === "existing") {
        body.customer = { existing_customer_id: customerForm.existingId };
      } else {
        body.customer = {
          full_name: customerForm.full_name,
          phone: customerForm.phone,
          area_id: customerForm.area_id,
          full_address: customerForm.full_address,
        };
      }

      if (vehicleForm.mode === "new") {
        body.vehicle = {
          car_model: vehicleForm.car_model,
          brand: vehicleForm.brand,
          vehicle_type_id: vehicleForm.vehicle_type_id,
          registration_number: vehicleForm.registration_number,
          color: vehicleForm.color,
        };
      }

      if (bookingForm.mode === "create") {
        body.booking = {
          service_date: bookingForm.service_date,
          time_slot_id: bookingForm.time_slot_id,
          booking_status_id: bookingForm.booking_status_id,
          assigned_worker_id: bookingForm.assigned_worker_id,
          base_price: parseFloat(bookingForm.base_price) || 0,
          final_price:
            parseFloat(bookingForm.final_price) ||
            parseFloat(bookingForm.base_price) ||
            0,
          area_id: bookingForm.area_id,
        };
      }

      const result = await create(`/api/leads/${leadId}/convert`, body);
      if (result.ok) {
        toast.success("Lead converted successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Conversion failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Convert Lead</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert Lead</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1 text-xs flex-wrap">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`px-2 py-0.5 rounded ${
                s === step
                  ? "bg-foreground text-background"
                  : i < stepIndex
                    ? "text-muted-foreground line-through"
                    : "text-muted-foreground"
              }`}
            >
              {stepLabels[s]}
            </span>
          ))}
        </div>

        {/* Step: Customer */}
        {step === "customer" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["new", "existing"] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={customerForm.mode === m ? "default" : "outline"}
                  onClick={() => setCustomerForm((f) => ({ ...f, mode: m }))}
                  type="button"
                >
                  {m === "new" ? "New Customer" : "Existing Customer"}
                </Button>
              ))}
            </div>

            {customerForm.mode === "existing" ? (
              <div className="space-y-1.5">
                <Label htmlFor="existing-customer">Customer</Label>
                <Select
                  id="existing-customer"
                  value={customerForm.existingId}
                  onChange={(e) =>
                    setCustomerForm((f) => ({
                      ...f,
                      existingId: e.target.value,
                    }))
                  }
                >
                  <option value="">Search customers…</option>
                  {existingCustomers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.full_name} — {c.phone}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Name</Label>
                  <Input
                    id="c-name"
                    value={customerForm.full_name}
                    onChange={(e) =>
                      setCustomerForm((f) => ({
                        ...f,
                        full_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input
                    id="c-phone"
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-area">Area</Label>
                  <Select
                    id="c-area"
                    value={customerForm.area_id}
                    onChange={(e) =>
                      setCustomerForm((f) => ({
                        ...f,
                        area_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select area</option>
                    {areaOptions.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-address">Address</Label>
                  <Input
                    id="c-address"
                    value={customerForm.full_address}
                    onChange={(e) =>
                      setCustomerForm((f) => ({
                        ...f,
                        full_address: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={next} disabled={!customerValid} type="button">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step: Vehicle */}
        {step === "vehicle" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["skip", "new"] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={vehicleForm.mode === m ? "default" : "outline"}
                  onClick={() => setVehicleForm((f) => ({ ...f, mode: m }))}
                  type="button"
                >
                  {m === "skip" ? "Skip" : "Add Vehicle"}
                </Button>
              ))}
            </div>

            {vehicleForm.mode === "new" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-model">Model</Label>
                    <Input
                      id="v-model"
                      value={vehicleForm.car_model}
                      onChange={(e) =>
                        setVehicleForm((f) => ({
                          ...f,
                          car_model: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-brand">Brand</Label>
                    <Input
                      id="v-brand"
                      value={vehicleForm.brand}
                      onChange={(e) =>
                        setVehicleForm((f) => ({ ...f, brand: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-reg">Reg. No.</Label>
                    <Input
                      id="v-reg"
                      value={vehicleForm.registration_number}
                      onChange={(e) =>
                        setVehicleForm((f) => ({
                          ...f,
                          registration_number: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-color">Color</Label>
                    <Input
                      id="v-color"
                      value={vehicleForm.color}
                      onChange={(e) =>
                        setVehicleForm((f) => ({ ...f, color: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="v-type">Vehicle Type</Label>
                  <Select
                    id="v-type"
                    value={vehicleForm.vehicle_type_id}
                    onChange={(e) =>
                      setVehicleForm((f) => ({
                        ...f,
                        vehicle_type_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select type</option>
                    {vehicleTypeOptions.map((vt) => (
                      <option key={vt.value} value={vt.value}>
                        {vt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={back} type="button">
                Back
              </Button>
              <Button onClick={next} disabled={!vehicleValid} type="button">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step: Booking */}
        {step === "booking" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["skip", "create"] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={bookingForm.mode === m ? "default" : "outline"}
                  onClick={() => setBookingForm((f) => ({ ...f, mode: m }))}
                  type="button"
                >
                  {m === "skip" ? "Skip" : "Create Booking"}
                </Button>
              ))}
            </div>

            {bookingForm.mode === "create" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="b-date">Service Date</Label>
                    <Input
                      id="b-date"
                      type="date"
                      value={bookingForm.service_date}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          service_date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-slot">Time Slot</Label>
                    <Select
                      id="b-slot"
                      value={bookingForm.time_slot_id}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          time_slot_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select slot</option>
                      {timeSlotOptions.map((ts) => (
                        <option key={ts.value} value={ts.value}>
                          {ts.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="b-status">Status</Label>
                    <Select
                      id="b-status"
                      value={bookingForm.booking_status_id}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          booking_status_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select status</option>
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-worker">Worker</Label>
                    <Select
                      id="b-worker"
                      value={bookingForm.assigned_worker_id}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          assigned_worker_id: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select worker</option>
                      {workerOptions.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="b-base">Base Price (₹)</Label>
                    <Input
                      id="b-base"
                      type="number"
                      min={0}
                      value={bookingForm.base_price}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          base_price: e.target.value,
                          final_price: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-final">Final Price (₹)</Label>
                    <Input
                      id="b-final"
                      type="number"
                      min={0}
                      value={bookingForm.final_price}
                      onChange={(e) =>
                        setBookingForm((f) => ({
                          ...f,
                          final_price: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-area">Area</Label>
                  <Select
                    id="b-area"
                    value={bookingForm.area_id}
                    onChange={(e) =>
                      setBookingForm((f) => ({ ...f, area_id: e.target.value }))
                    }
                  >
                    <option value="">Select area</option>
                    {areaOptions.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={back} type="button">
                Back
              </Button>
              <Button onClick={next} disabled={!bookingValid} type="button">
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-md border divide-y text-sm">
              <div className="px-3 py-2.5">
                <div className="text-xs text-muted-foreground mb-1">
                  Customer
                </div>
                <div className="font-medium">
                  {customerForm.mode === "existing"
                    ? (existingCustomers.find(
                        (c) => c.customer_id === customerForm.existingId,
                      )?.full_name ?? customerForm.existingId)
                    : customerForm.full_name}
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-xs text-muted-foreground mb-1">
                  Vehicle
                </div>
                <div>
                  {vehicleForm.mode === "skip"
                    ? "—"
                    : `${vehicleForm.car_model} ${vehicleForm.brand}`.trim()}
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="text-xs text-muted-foreground mb-1">
                  Booking
                </div>
                <div>
                  {bookingForm.mode === "skip"
                    ? "—"
                    : `${bookingForm.service_date} · ₹${bookingForm.final_price || bookingForm.base_price || "0"}`}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={back} type="button">
                Back
              </Button>
              <Button onClick={handleConvert} disabled={loading} type="button">
                {loading ? "Converting…" : "Confirm & Convert"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
