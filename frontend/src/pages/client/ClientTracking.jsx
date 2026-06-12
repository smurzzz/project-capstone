import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Calendar, Package, Search, X } from "lucide-react";
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
  const [searchResults, setSearchResults] = useState(undefined);
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
      } catch (err) {
        void err;
      }

      try {
        const appointmentsResponse = await appointmentsAPI.getMyAppointments();
        nextAppointments = appointmentsResponse.data.data || [];
      } catch (err) {
        void err;
      }
    } catch (err) {
      void err;
    } finally {
      setMyOrders(nextOrders);
      setMyAppointments(nextAppointments);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const buildOrderDateVariants = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return [];

    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return [
      `${year}${month}${day}`,
      `${month}${day}${year}`,
      `${day}${month}${year}`,
    ];
  };

  const searchById = useCallback((id) => {
    const normalizedId = id.trim().toLowerCase();
    const cleanedDigits = normalizedId.replace(/[^0-9]/g, "");

    const matchedOrders = myOrders.filter((item) => {
      const orderId = item.orderId || item.membershipId || item.referenceNumber || item._id;
      const normalizedOrderId = orderId?.toLowerCase() || "";
      const normalizedReference = item.referenceNumber?.toLowerCase() || "";

      const matchesId = normalizedOrderId.includes(normalizedId) || normalizedReference.includes(normalizedId);
      const dateVariants = buildOrderDateVariants(item.createdAt);
      const matchesDate = cleanedDigits
        ? dateVariants.some((variant) => variant.includes(cleanedDigits) || cleanedDigits.includes(variant))
        : false;

      return matchesId || matchesDate;
    });

    const appointment = myAppointments.find((item) => {
      const appointmentId = item.appointmentId || `APT-${item._id?.toString().slice(-6).toUpperCase()}`;
      const normalizedAppointmentId = appointmentId?.toLowerCase() || "";

      return (
        normalizedAppointmentId.includes(normalizedId) ||
        item._id?.toString().toLowerCase().includes(normalizedId)
      );
    });

    setSearchResults(
      matchedOrders.length > 0 ? { orders: matchedOrders } : appointment ? { appointment } : null
    );
  }, [myOrders, myAppointments]);

  useEffect(() => {
    if (!loading && orderQuery) {
      setTrackingId(orderQuery);
      searchById(orderQuery);
    }
  }, [loading, orderQuery, myOrders, myAppointments, searchById]);

  const handleSearch = (event) => {
    event.preventDefault();
    searchById(trackingId);
  };

  const handleClearSearch = () => {
    setTrackingId("");
    setSearchResults(undefined);
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
          <CardContent className="flex min-h-20 items-center px-4 py-8 sm:px-6 sm:py-8">
          <form onSubmit={handleSearch} className="mx-auto grid w-full max-w-6xl items-center gap-3 pt-5 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative flex h-10 items-center w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Enter order date (YYYYMMDD or MMDDYYYY) or part of the order ID"
                value={trackingId}
                onChange={(event) => setTrackingId(event.target.value)}
                className="h-10 w-full pl-10 pr-10 py-0 leading-none"
              />
              {trackingId && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="h-10 gap-2">
              <Search className="h-4 w-4" />
              Track
            </Button>
          </form>

          {searchResults && searchResults.orders && searchResults.orders.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-900">Found {searchResults.orders.length} order(s) matching your search.</p>
              </div>
              {searchResults.orders.map((order) => (
                <div key={order._id} className="rounded-lg bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold">Order {order.orderId || order.membershipId || order.referenceNumber || order._id}</h4>
                    <Badge className={orderStatusColors[order.status] || "bg-gray-100 text-gray-800"}>
                      {order.status}
                    </Badge>
                  </div>
                  {order.referenceNumber && (
                    <p className="text-sm text-gray-600">
                      <strong>Reference:</strong> {order.referenceNumber}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <strong>Placed on:</strong> {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Items:</strong> {order.itemCount || 0} | <strong>Total:</strong> PHP {Number(order.total || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {searchResults && searchResults.appointment && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-semibold">Appointment {searchResults.appointment.appointmentId}</h4>
                  <Badge
                    className={
                      appointmentStatusColors[searchResults.appointment.status] || "bg-gray-100 text-gray-800"
                    }
                  >
                    {searchResults.appointment.status}
                  </Badge>
                </div>
                <p className="text-sm">
                  <strong>Service:</strong> {searchResults.appointment.service}
                </p>
                <p className="text-sm">
                  <strong>Date:</strong> {new Date(searchResults.appointment.date).toLocaleDateString()} at {searchResults.appointment.timeSlot}
                </p>
              </div>
            </div>
          )}

          {trackingId && searchResults === null && (
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
                        <h4 className="font-semibold">Order {order.orderId || order.membershipId || order.referenceNumber || order._id}</h4>
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
