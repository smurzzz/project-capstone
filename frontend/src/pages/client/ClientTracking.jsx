import { useCallback, useEffect, useState } from "react";
import { Calendar, Package, Search } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.jsx";
import { ordersAPI, appointmentsAPI } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const orderStatusColors = {
  Pending: "bg-gray-100 text-gray-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const appointmentStatusColors = {
  Confirmed: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Scheduled: "bg-blue-100 text-blue-800",
  Completed: "bg-purple-100 text-purple-800",
};

export default function ClientTracking() {
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState("");
  const [searchResult, setSearchResult] = useState(undefined);
  const [myOrders, setMyOrders] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    let nextOrders = [];
    let nextAppointments = [];

    try {
      try {
        const customerId = user?.customerId;
        if (customerId) {
          const ordersResponse = await ordersAPI.getByCustomer(customerId);
          nextOrders = ordersResponse.data.data || [];
        }
      } catch (orderError) {
        console.error("Error fetching orders:", orderError);
      }

      try {
        const appointmentsResponse = await appointmentsAPI.getMyAppointments();
        nextAppointments = appointmentsResponse.data.data || [];
      } catch (appointmentError) {
        console.error("Error fetching appointments:", appointmentError);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    } finally {
      setMyOrders(nextOrders);
      setMyAppointments(nextAppointments);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSearch = (event) => {
    event.preventDefault();
    const normalizedId = trackingId.trim().toUpperCase();
    const order = myOrders.find((item) => item.referenceNumber?.toUpperCase() === normalizedId);
    const appointment = myAppointments.find((item) => `APT-${item._id?.slice(-6)}`.toUpperCase() === normalizedId);
    setSearchResult(order || appointment || null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Track Your Orders & Appointments</h2>
          <p className="text-gray-600">Monitor the status of your orders and appointments</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your tracking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Track Your Orders & Appointments</h2>
        <p className="text-gray-600">Monitor the status of your orders and appointments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track by ID</CardTitle>
          <CardDescription>Enter your order ID or appointment ID to track</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Enter Order ID (e.g., ORD-001) or Appointment ID (e.g., APT-001)"
              value={trackingId}
              onChange={(event) => setTrackingId(event.target.value)}
            />
            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              Track
            </Button>
          </form>

          {searchResult && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              {"referenceNumber" in searchResult ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold">Order {searchResult.referenceNumber}</h4>
                    <Badge className={orderStatusColors[searchResult.status] || "bg-gray-100 text-gray-800"}>
                      {searchResult.status}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    <strong>Items:</strong> {searchResult.itemCount || 0} | <strong>Total:</strong> PHP{" "}
                    {searchResult.total.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold">Appointment APT-{searchResult._id?.slice(-6)}</h4>
                    <Badge
                      className={
                        appointmentStatusColors[searchResult.status] || "bg-gray-100 text-gray-800"
                      }
                    >
                      {searchResult.status}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    <strong>Service:</strong> {searchResult.service}
                  </p>
                  <p className="text-sm">
                    <strong>Date:</strong> {new Date(searchResult.date).toLocaleDateString()} at{" "}
                    {searchResult.timeSlot}
                  </p>
                </div>
              )}
            </div>
          )}

          {trackingId && searchResult === null && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">No results found for "{trackingId}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="appointments">My Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {myOrders.map((order) => (
            <Card key={order._id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-blue-100 p-3">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{order.referenceNumber}</h4>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.itemCount || 0} items - PHP {Number(order.total || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    <Badge className={orderStatusColors[order.status] || "bg-gray-100 text-gray-800"}>
                      {order.status}
                    </Badge>
                    <p className="text-sm text-gray-600">Reference {order.referenceNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          {myAppointments.map((appointment) => (
            <Card key={appointment._id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-purple-100 p-3">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">APT-{appointment._id?.slice(-6) || 'Unknown'}</h4>
                      <div className="text-sm text-gray-600">Service: {appointment.service}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot || appointment.time}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      appointmentStatusColors[appointment.status] || "bg-gray-100 text-gray-800"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
