import { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { SimpleBarChart, SimpleLineChart } from "../../components/ui/simple-charts.jsx";
import { reportsAPI } from "../../utils/api.js";

const POLL_INTERVAL_MS = 15000;

const statusColor = (status) => {
  if (status === "Completed" || status === "Delivered") return "bg-green-100 text-green-700";
  if (status === "Confirmed" || status === "Processing") return "bg-blue-100 text-blue-700";
  if (status === "Cancelled") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

const formatMoney = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

const formatChange = (value) => {
  const numberValue = Number(value || 0);
  const prefix = numberValue > 0 ? "+" : "";
  return `${prefix}${numberValue}% vs previous week`;
};

export default function AdminDashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchDashboardData = async () => {
      try {
        const response = await reportsAPI.getOverview({ period: "weekly", offset: 0 });
        if (!active) return;
        setReport(response.data.data);
        setLastUpdated(new Date());
        setError("");
      } catch (fetchError) {
        if (active) {
          console.error("Error fetching dashboard data:", fetchError);
          setError(fetchError.response?.data?.message || "Failed to load dashboard data");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = window.setInterval(fetchDashboardData, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const allTime = report?.allTime || {};
  const metrics = report?.metrics || {};
  const comparison = report?.comparison || {};
  const recentOrders = report?.recentOrders || [];
  const revenueTrend = report?.charts?.revenueTrend || [];
  const ordersTrend = report?.charts?.ordersTrend || [];

  const cards = [
    {
      title: "Total Orders",
      value: Number(allTime.totalOrders || 0).toLocaleString(),
      change: formatChange(comparison.orders),
      trend: Number(comparison.orders || 0) >= 0 ? "up" : "down",
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Appointments",
      value: Number(allTime.appointments || 0).toLocaleString(),
      change: `${Number(metrics.appointments || 0).toLocaleString()} this week`,
      trend: "up",
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Inventory Items",
      value: Number(allTime.inventoryItems || 0).toLocaleString(),
      change: `${Number(allTime.lowStockItems || 0).toLocaleString()} low stock`,
      trend: Number(allTime.lowStockItems || 0) > 0 ? "down" : "up",
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Package Deals",
      value: Number(allTime.packageDeals || 0).toLocaleString(),
      change: "Active store offers",
      trend: "up",
      icon: Package,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Total Revenue",
      value: formatMoney(allTime.totalRevenue),
      change: formatChange(comparison.revenue),
      trend: Number(comparison.revenue || 0) >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2">Dashboard Overview</h1>
          <p className="text-gray-500">Live database snapshot for {report?.period?.label || "this week"}.</p>
        </div>
        <p className="text-xs text-gray-500">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for first update"}
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendIcon
                        className={`w-4 h-4 ${
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLineChart data={revenueTrend} xKey="label" yKey="revenue" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={ordersTrend} xKey="label" yKey="orders" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
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
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b last:border-0">
                    <td className="py-3 px-4">{order.referenceNumber}</td>
                    <td className="py-3 px-4">{order.customerName}</td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-4">{formatMoney(order.total)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={5}>
                      No recent orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
