import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
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
        <h1 className="text-2xl md:text-3xl mb-2">Appointment Scheduling</h1>
        <p className="text-gray-500">Manage customer appointments and schedules</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Today's Appointments" value={todayAppointments.length} />
        <Stat title="Upcoming" value={upcomingAppointments.length} />
        <Stat title="Pending" value={appointmentsList.filter((a) => a.status === "Scheduled").length} />
        <Stat title="Completed" value={appointmentsList.filter((a) => a.status === "Completed").length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="mx-auto border-gray-100 text-center"
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
                  className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Info label="Appointment ID" value={getAppointmentId(selectedAppointment)} />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={statusColors[selectedAppointment.status] || "bg-gray-100 text-gray-700"}>
                    {selectedAppointment.status || "Unknown"}
                  </Badge>
                </div>
                <Info label="Customer" value={getCustomerName(selectedAppointment)} />
                <Info label="Email" value={getCustomerEmail(selectedAppointment)} />
                <Info label="Phone" value={getPhone(selectedAppointment)} />
                <Info label="Service" value={getService(selectedAppointment)} />
                <Info label="Date" value={getDisplayDate(selectedAppointment)} />
                <Info label="Time" value={getDisplayTime(selectedAppointment)} />
              </div>
              <Info label="Location" value={getLocation(selectedAppointment)} />
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="bg-gray-50 p-3 rounded-lg">{selectedAppointment.notes || "No notes provided"}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateStatus}>Update Status</Button>
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

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}
