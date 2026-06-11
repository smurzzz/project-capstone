import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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

  const location = useLocation();
  const orderQuery = new URLSearchParams(location.search).get("order") || "";

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

  const searchById = (id) => {
    const normalizedId = id.trim().toLowerCase();

    const order = myOrders.find((item) => {
      const orderId = item.orderId || item.referenceNumber || item._id;
      return (
        item.referenceNumber?.toLowerCase() === normalizedId ||
        orderId?.toLowerCase() === normalizedId
      );
    });

    const appointment = myAppointments.find((item) => {
      const appointmentId =
        item.appointmentId ||
        `APT-${item._id?.toString().slice(-6).toUpperCase()}`;

      return (
        appointmentId?.toLowerCase() === normalizedId ||
        item._id?.toString().toLowerCase() === normalizedId
      );
    });

    setSearchResult(order || appointment || null);
  };

  useEffect(() => {
    if (!loading && orderQuery) {
      setTrackingId(orderQuery);
      searchById(orderQuery);
    }
  }, [loading, orderQuery, myOrders, myAppointments]);

  const handleSearch = (event) => {
    event.preventDefault();
    searchById(trackingId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Track Your Orders & Appointments</h2>
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
        <h2 className="text-2xl font-bold sm:text-3xl">Track Your Orders & Appointments</h2>
        <p className="text-gray-600">Monitor the status of your orders and appointments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track by ID</CardTitle>
          <CardDescription>Enter your order ID or appointment ID to track</CardDescription>
        </CardHeader>
          <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
          <form onSubmit={handleSearch} className="mx-auto grid w-full max-w-6xl items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              placeholder="Enter Order ID (e.g., ORD-20260611-ABCDE) or Appointment ID (e.g., APT-20260611-XXXXX)"
              value={trackingId}
              onChange={(event) => setTrackingId(event.target.value)}
              className="h-10"
            />
            <Button type="submit" className="h-10 gap-2">
              <Search className="h-4 w-4" />
              Track
            </Button>
          </form>

          {searchResult && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              {"referenceNumber" in searchResult ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold">Order {searchResult.referenceNumber || searchResult.orderId || searchResult._id}</h4>
                    <Badge className={orderStatusColors[searchResult.status] || "bg-gray-100 text-gray-800"}>
                      {searchResult.status}
                    </Badge>
                  </div>
                  {searchResult.referenceNumber && (
                    <p className="text-sm">
                      <strong>Reference:</strong> {searchResult.referenceNumber}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Items:</strong> {searchResult.itemCount || 0} | <strong>Total:</strong> PHP{" "}
                    {searchResult.total.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold">Appointment {searchResult.appointmentId}</h4>
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
              <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-3">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Order {order.referenceNumber || order.orderId || order._id}</h4>
                        {order.membershipDiscountAmount > 0 && (
                          <Badge className="bg-green-100 text-green-800">Member</Badge>
                        )}
                      </div>
                      {order.referenceNumber && (
                        <p className="text-sm text-gray-500">Reference: {order.referenceNumber}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <div className="text-sm text-gray-600 mt-2">
                        {order.itemCount || 0} items
                        <div className="font-semibold text-gray-900 mt-1">
                          PHP {Number(order.total || 0).toLocaleString()}
                        </div>
                        {order.membershipDiscountAmount > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            Member savings: PHP {Number(order.membershipDiscountAmount || 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    <Badge className={orderStatusColors[order.status] || "bg-gray-100 text-gray-800"}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          {myAppointments.map((appointment) => (
            <Card key={appointment._id}>
              <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-purple-100 p-3">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                    <h4 className="font-semibold">{appointment.appointmentId || `APT-${appointment._id?.slice(-6)}`}</h4>
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
