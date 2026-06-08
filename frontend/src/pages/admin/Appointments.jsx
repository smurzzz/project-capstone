import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Mail, MapPin, Phone, UserRound, Wrench } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Calendar } from "../../components/ui/calendar.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { appointmentsAPI } from "../../utils/api.js";

const statusColors = {
  Scheduled: "bg-yellow-100 text-yellow-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchAppointments() {
    try {
      const response = await appointmentsAPI.getAll();
      setAppointmentsList(response.data.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedAppointment || !newStatus) return;

    try {
      await appointmentsAPI.updateStatus(selectedAppointment._id, newStatus);
      toast.success("Appointment status updated");
      setDialogOpen(false);
      setSelectedAppointment(null);
      setNewStatus("");
      fetchAppointments();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  const getCustomerName = (appointment) => appointment.contactInfo?.name || appointment.customerId?.name || "Unknown Customer";
  const getCustomerEmail = (appointment) => appointment.contactInfo?.email || appointment.customerId?.contactInfo?.email || "N/A";
  const getPhone = (appointment) => appointment.contactInfo?.phone || appointment.customerId?.contactInfo?.phone || "N/A";
  const getLocation = (appointment) => appointment.customerId?.contactInfo?.address || "No address provided";
  const getService = (appointment) => appointment.service || appointment.serviceType || "Electrical Service";
  const getDateValue = (appointment) => appointment.date?.split("T")[0] || "";
  const getDisplayDate = (appointment) =>
    appointment.date ? new Date(appointment.date).toLocaleDateString() : "N/A";
  const getDisplayTime = (appointment) => appointment.timeSlot || appointment.time || "N/A";
  const getAppointmentId = (appointment) => `APT-${appointment._id?.slice(-6).toUpperCase() || "000000"}`;

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointmentsList.filter((appointment) => getDateValue(appointment) === today);
  const upcomingAppointments = appointmentsList.filter(
    (appointment) => appointment.date && new Date(appointment.date) > new Date() && appointment.status !== "Cancelled"
  );

  if (loading) {
    return <div className="p-6">Loading appointments...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Appointment Scheduling</h1>
        <p className="text-gray-500">Manage customer appointments and schedules</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Today's Appointments" value={todayAppointments.length} />
        <Stat title="Upcoming" value={upcomingAppointments.length} />
        <Stat title="Pending" value={appointmentsList.filter((a) => a.status === "Scheduled").length} />
        <Stat title="Completed" value={appointmentsList.filter((a) => a.status === "Completed").length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="mx-auto rounded-2xl border border-gray-300 bg-gray-2cd00 text-center"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointmentsList.map((appointment) => (
                <button
                  key={appointment._id}
                  type="button"
                  className="w-full rounded-2xl border border-gray-300 bg-white p-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setNewStatus(appointment.status || "Scheduled");
                    setDialogOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3>{getCustomerName(appointment)}</h3>
                        <Badge className={statusColors[appointment.status] || "bg-gray-100 text-gray-700"}>
                          {appointment.status || "Unknown"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{getService(appointment)}</p>
                    </div>
                    <span className="text-sm text-gray-500">{getAppointmentId(appointment)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{getDisplayDate(appointment)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{getDisplayTime(appointment)}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{getLocation(appointment)}</span>
                    </div>
                  </div>
                </button>
              ))}
              {appointmentsList.length === 0 && (
                <div className="py-8 text-center text-gray-500">No appointments found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto bg-white p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <CalendarIcon className="h-5 w-5" />
              </span>
              Appointment Details
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
              <div className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Appointment</p>
                      <p className="mt-1 text-2xl font-bold text-slate-950">{getAppointmentId(selectedAppointment)}</p>
                    </div>
                    <Badge className={`${statusColors[selectedAppointment.status] || "bg-gray-100 text-gray-700"} rounded-full px-3 py-1`}>
                      {selectedAppointment.status || "Unknown"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <SummaryItem icon={<UserRound className="h-4 w-4" />} label="Customer" value={getCustomerName(selectedAppointment)} />
                    <SummaryItem icon={<CalendarIcon className="h-4 w-4" />} label="Date" value={getDisplayDate(selectedAppointment)} />
                    <SummaryItem icon={<Clock className="h-4 w-4" />} label="Time" value={getDisplayTime(selectedAppointment)} />
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Update Status</p>
                  <div className="mt-4 space-y-3">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="h-11 rounded-2xl border-gray-300 bg-gray-2cd00">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800" onClick={handleUpdateStatus}>
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="rounded-3xl border border-slate-200 p-5">
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-950">Customer Details</h3>
                    <p className="text-sm text-slate-500">Contact information connected to this appointment.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Info icon={<UserRound className="h-4 w-4" />} label="Customer" value={getCustomerName(selectedAppointment)} />
                    <Info icon={<Mail className="h-4 w-4" />} label="Email" value={getCustomerEmail(selectedAppointment)} />
                    <Info icon={<Phone className="h-4 w-4" />} label="Phone" value={getPhone(selectedAppointment)} />
                    <Info icon={<MapPin className="h-4 w-4" />} label="Location" value={getLocation(selectedAppointment)} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <div className="mb-4">
                    <h3 className="font-semibold text-slate-950">Service Schedule</h3>
                    <p className="text-sm text-slate-500">Requested service type and booked time slot.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Info icon={<Wrench className="h-4 w-4" />} label="Service" value={getService(selectedAppointment)} />
                    <Info icon={<CalendarIcon className="h-4 w-4" />} label="Date" value={getDisplayDate(selectedAppointment)} />
                    <Info icon={<Clock className="h-4 w-4" />} label="Time" value={getDisplayTime(selectedAppointment)} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-950">Notes</h3>
                  <p className="mt-3 min-h-28 rounded-2xl border border-gray-300 bg-gray-2cd00 p-4 text-sm leading-6 text-slate-700">
                    {selectedAppointment.notes || "No notes provided"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-2 truncate font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-950">{value}</p>
      </div>
    </div>
  );
}
