import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Filter, Search } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { ordersAPI } from "../../utils/api.js";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    try {
      const response = await ordersAPI.getById(order._id);
      setOrderDetails(response.data.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setOrderDetails({ order, items: [] });
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await ordersAPI.updateStatus(selectedOrder._id, newStatus);
      toast.success("Order status updated");
      setSelectedOrder(null);
      setOrderDetails(null);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const haystack = [
      order.referenceNumber,
      order.fullName,
      order.customerId?.name,
      order.customerId?.contactInfo?.email,
      order.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  const detailOrder = orderDetails?.order || selectedOrder;
  const detailItems = orderDetails?.items || [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl md:text-3xl mb-2">Orders Management</h1>
        <p className="text-gray-500">View and manage all customer orders</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order ID, customer, or email..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4 hidden xl:table-cell">Payment</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b last:border-0">
                    <td className="py-3 px-4">{order.referenceNumber}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p>{order.customerId?.name || order.fullName || "Guest"}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          {order.customerId?.contactInfo?.email || order.email || order.contactNumber}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">PHP {Number(order.total || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <Badge variant="outline">{order.paymentMethod}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-700"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={7}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {detailOrder?.referenceNumber}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p>{detailOrder.customerId?.name || detailOrder.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{detailOrder.contactNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{detailOrder.customerId?.contactInfo?.email || detailOrder.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p>{new Date(detailOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p>{detailOrder.paymentMethod}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p>{detailOrder.referenceNumber}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p>{detailOrder.address}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Order Items</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {detailItems.map((item) => (
                    <div key={item._id} className="flex justify-between">
                      <span>{item.productName}</span>
                      <span>x{item.quantity}</span>
                    </div>
                  ))}
                  {detailItems.length === 0 && <p className="text-sm text-gray-500">No item details loaded.</p>}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Total Amount</span>
                    <span>PHP {Number(detailOrder.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleStatusUpdate}>Update Status</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
