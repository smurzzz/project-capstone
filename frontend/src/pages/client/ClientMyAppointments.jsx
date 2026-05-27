import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Clock, User, AlertCircle } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { appointmentsAPI } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const statusColors = {
  Scheduled: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-green-100 text-green-800",
  Completed: "bg-blue-100 text-blue-800",
  Cancelled: "bg-red-100 text-red-800",
};

export default function ClientMyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));

  async function fetchMyAppointments() {
    try {
      const response = await appointmentsAPI.getMyAppointments();
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to view your appointments");
      } else {
        toast.error("Failed to load your appointments");
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchMyAppointments();
    }
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeSlot) => {
    return timeSlot;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">My Appointments</h2>
          <p className="text-gray-600">View and manage your upcoming appointments</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">My Appointments</h2>
          <p className="text-gray-600">View and manage your upcoming appointments</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Please Login
            </h3>
            <p className="text-gray-600 mb-4">
              You need to be logged in to view your appointments.
            </p>
            <Button onClick={() => window.location.href = '/login'}>
              Login to View Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">My Appointments</h2>
          <p className="text-gray-600">View and manage your upcoming appointments</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No appointments yet
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't booked any appointments yet.
            </p>
            <p className="text-sm text-gray-500">
              Go to the "Book Appointment" section to schedule your first appointment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      {appointment.service}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(appointment.date)} at {formatTime(appointment.timeSlot)}
                    </CardDescription>
                  </div>
                  <Badge
                    className={statusColors[appointment.status] || "bg-gray-100 text-gray-800"}
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.notes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {appointment.notes}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Booked by: {appointment.customerId?.name || 'You'}</span>
                </div>

                {appointment.status === "Scheduled" && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Your appointment is scheduled. You will receive a confirmation soon.
                    </p>
                  </div>
                )}

                {appointment.status === "Confirmed" && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Your appointment is confirmed. Please arrive on time.
                    </p>
                  </div>
                )}

                {appointment.status === "Completed" && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Your appointment has been completed. Thank you for visiting!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
