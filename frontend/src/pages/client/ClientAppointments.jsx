import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Check, Clock } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Calendar } from "../../components/ui/calendar.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { appointmentsAPI } from "../../utils/api.js";
const TIME_SLOTS = [
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
];

const SERVICES = ["Consultation", "Installation", "Maintenance", "Repair", "Inspection"];

const formatDate = (value) =>
  value.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function ClientAppointments() {
  const { user } = useAuth();
  const [date, setDate] = useState();
  const [timeSlot, setTimeSlot] = useState("");
  const [service, setService] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState(TIME_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);

  const handleDateSelect = (nextDate) => {
    setDate(nextDate);
    setTimeSlot("");
    if (!nextDate) {
      setAvailableSlots(TIME_SLOTS);
    }
  };

  useEffect(() => {
    if (!date) {
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const dateKey = date.toISOString().slice(0, 10);
        const response = await appointmentsAPI.getAvailableSlots(dateKey);
        setAvailableSlots(response.data.data || []);
      } catch (error) {
        console.error("Error loading available slots:", error);
        setAvailableSlots(TIME_SLOTS);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [date]);

  useEffect(() => {
    const fetchBlockedAndBookedDates = async () => {
      try {
        const [blockedRes, bookedRes] = await Promise.all([
          appointmentsAPI.getBlockedDates(),
          appointmentsAPI.getFullyBookedDates()
        ]);
        const blocked = (blockedRes.data.data || []);
        const booked = (bookedRes.data.data || []).map((dateValue) => `${dateValue}`);
        
        setUnavailableDates([...blocked, ...booked]);
      } catch (error) {
        console.error("Error loading date information:", error);
      }
    };

    fetchBlockedAndBookedDates();
  }, []);

  const isDateUnavailable = (checkDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      return true;
    }

    const checkDateKey = checkDate.toISOString().slice(0, 10);
    return unavailableDates.includes(checkDateKey);
  };

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!date || !timeSlot || !service || !name || !email || !phone) {
    toast.error("Please fill in all required fields");
    return;
  }

  try {
    const appointmentData = {
      customerId: user?.id, // Link appointment to current user
      date,
      timeSlot,
      service,
      notes,
      contactInfo: {
        name,
        email,
        phone,
        address: user?.address || ""
      }
    };

    const response = await appointmentsAPI.create(appointmentData);

    toast.success("Appointment booked successfully!");

    // reset form
    handleDateSelect(undefined);
    setTimeSlot("");
    setService("");
    setPhone(user?.phone || "");
    setNotes("");

  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || "Failed to book appointment");
  }
};
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">Book an Appointment</h2>
        <p className="text-gray-600">Schedule a consultation or service appointment</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Details</CardTitle>
                <CardDescription>Select date, time, and service type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Appointment Date *</Label>
                  <div className="flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      disabled={isDateUnavailable}
                      modifiers={{
                        unavailable: (date) => {
                          const checkDateKey = date.toISOString().slice(0, 10);
                          return unavailableDates.includes(checkDateKey);
                        }
                      }}
                      modifiersClassNames={{
                        unavailable: "bg-red-50 text-red-700 line-through opacity-80",
                      }}
                    />
                  </div>
                  {date && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected date: <strong>{formatDate(date)}</strong>
                    </p>
                  )}
                  <Alert className="bg-blue-50 border-blue-200 mt-2 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <AlertDescription className="text-blue-800 text-sm">
                      Dates with strikethrough are unavailable for booking.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot *</Label>
                  <Select value={timeSlot} onValueChange={(value) => {
                    if (availableSlots.includes(value)) {
                      setTimeSlot(value);
                    }
                  }}>
                    <SelectTrigger id="timeSlot">
                      <SelectValue placeholder={loadingSlots ? "Loading slots..." : "Select a time slot"} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => {
                        const slotAvailable = availableSlots.includes(slot);
                        return (
                          <SelectItem
                            key={slot}
                            value={slot}
                            disabled={!slotAvailable}
                            className={slotAvailable ? "" : "text-gray-400 line-through opacity-60"}
                          >
                            {slot}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {date && availableSlots.length === 0 && (
                    <p className="text-sm text-red-600">No available slots for this date.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service Type *</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>We will use this to confirm your appointment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Juan Dela Cruz"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09XX XXX XXXX"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any specific concerns or requirements..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full">
              Confirm Appointment
            </Button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:block xl:space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Available Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TIME_SLOTS.map((slot) => {
                  const slotAvailable = availableSlots.includes(slot);
                  return (
                    <div
                      key={slot}
                      className={`flex items-center gap-2 text-sm ${slotAvailable ? "text-blue-800" : "text-gray-500 line-through opacity-70"}`}
                    >
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{slot}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Services</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {SERVICES.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> All appointments are subject to availability.
                You will receive a confirmation email within 24 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
