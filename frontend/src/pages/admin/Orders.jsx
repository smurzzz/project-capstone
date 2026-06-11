import { useEffect, useRef, useState } from "react";
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

const paymentStatusColors = {
  pending: "bg-amber-100 text-amber-700",
  checkout_created: "bg-cyan-100 text-cyan-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const getOrderTypeLabel = (order) => {
  if (order.orderType === "membership") return "Membership";
  if (order.membershipType) return "Membership";
  if (order.packageDealId || order.packageName) return "Package";
  if (order.items?.length > 0) return "Product";
  return "Regular";
};

const getDiscountLabel = (order) => {
  if (order.membershipDiscountAmount > 0) return "Member discount";
  return "Discount";
};

const formatCurrency = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const top = topScrollRef.current;
    const bottom = bottomScrollRef.current;

    if (!top || !bottom) return;

    const syncTopToBottom = () => {
      bottom.scrollLeft = top.scrollLeft;
    };

    const syncBottomToTop = () => {
      top.scrollLeft = bottom.scrollLeft;
    };

    top.addEventListener("scroll", syncTopToBottom);
    bottom.addEventListener("scroll", syncBottomToTop);

    const updateTableWidth = () => {
      if (tableRef.current) {
        setTableScrollWidth(tableRef.current.scrollWidth);
      }
    };

    updateTableWidth();
    window.addEventListener("resize", updateTableWidth);

    return () => {
      top.removeEventListener("scroll", syncTopToBottom);
      bottom.removeEventListener("scroll", syncBottomToTop);
      window.removeEventListener("resize", updateTableWidth);
    };
  }, [orders, searchTerm, statusFilter]);

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
      // focus the status selector so admins land on status controls
      setTimeout(() => {
        const el = document.getElementById("order-status-select-trigger");
        if (el && typeof el.focus === "function") el.focus();
      }, 200);
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
      order.orderId || order._id,
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
  const canCompleteOrder = detailOrder?.status === "Confirmed";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Orders Management</h1>
        <p className="text-gray-500">View and manage all customer orders</p>
      </div>

      <Card>
        <CardContent className="flex min-h-24 items-center p-4">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by order ID, customer, or email..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full">
                <Filter className="mr-2 h-4 w-4" />
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
          <div className="overflow-hidden">
            <div
              ref={topScrollRef}
              className="mb-2 overflow-x-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div style={{ width: tableScrollWidth, height: 1 }} />
            </div>
            <div className="overflow-x-auto" ref={bottomScrollRef}>
              <table ref={tableRef} className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Order ID</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4 hidden md:table-cell">Date</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-left py-3 px-4">Reference</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b last:border-0">
                    <td className="py-3 px-4">{order.orderId || order._id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p>{order.customerId?.name || order.fullName || "Guest"}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          {order.customerId?.contactInfo?.email || order.email || order.contactNumber}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{getOrderTypeLabel(order)}</Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={order.membershipDiscountAmount > 0 ? "font-semibold text-green-700" : "font-semibold text-slate-900"}>
                          {formatCurrency(order.total)}
                        </span>
                        {order.membershipDiscountAmount > 0 && (
                          <div className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Member
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline">{order.paymentMethod}</Badge>
                        <Badge className={paymentStatusColors[order.paymentStatus] || "bg-gray-100 text-gray-700"}>
                          {String(order.paymentStatus || "pending").replaceAll("_", " ")}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {String(order.paymentMethod || "").toLowerCase().includes("gcash")
                        ? (order.referenceNumber || "N/A")
                        : "N/A"}
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
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={9}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {detailOrder?.orderId || detailOrder?._id}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p>{detailOrder.customerId?.name || detailOrder.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p>{getOrderTypeLabel(detailOrder)}</p>
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
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p>{String(detailOrder.paymentStatus || "pending").replaceAll("_", " ")}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p>{detailOrder.orderId || detailOrder._id}</p>
                </div>
                {detailOrder.referenceNumber && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Gateway Reference</p>
                    <p>{detailOrder.paymentReference}</p>
                  </div>
                )}
                {detailOrder.paymentCheckoutUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Checkout URL</p>
                    <a
                      href={detailOrder.paymentCheckoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Open payment checkout
                    </a>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p>{detailOrder.address}</p>
              </div>
              {detailOrder.notes && (
                <div>
                  <p className="text-sm text-gray-500">Additional Information</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    {detailOrder.orderType === 'membership' ? (
                      <>
                        {detailOrder.notes.includes('|') ? (
                          <>
                            <p>{detailOrder.notes.split('|')[0].trim()}</p>
                            <p className="italic text-gray-600">{detailOrder.notes.split('|')[1].trim()}</p>
                          </>
                        ) : (
                          <p>{detailOrder.notes}</p>
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{detailOrder.notes}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Order Items</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {detailOrder.orderType === 'membership' && detailOrder.packageName ? (
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-semibold text-gray-900">{detailOrder.packageName}</p>
                        <p className="text-xs text-gray-500">Membership Package</p>
                      </div>
                      <span className="text-sm font-medium">x1</span>
                    </div>
                  ) : (
                    <>
                      {detailItems.map((item) => (
                        <div key={item._id} className="flex justify-between">
                          <span>{item.productName}</span>
                          <span>x{item.quantity}</span>
                        </div>
                      ))}
                      {detailItems.length === 0 && <p className="text-sm text-gray-500">No item details loaded.</p>}
                    </>
                  )}
                  <div className="space-y-1 pt-2 border-t">
                    {detailOrder.membershipDiscountAmount > 0 ? (
                      <div className="flex justify-between items-center font-semibold bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600 text-white">Member Price</Badge>
                        </div>
                        <span className="text-green-700 text-lg">{formatCurrency(detailOrder.total)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Amount</span>
                        <span>{formatCurrency(detailOrder.total)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="order-status-select-trigger" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed" disabled={!canCompleteOrder}>Completed</SelectItem>
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
