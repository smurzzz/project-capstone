import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarCheck, CreditCard, DollarSign, Download, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { SimpleBarChart, SimpleDonutChart, SimpleLineChart } from "../../components/ui/simple-charts.jsx";
import { reportsAPI } from "../../utils/api.js";

const POLL_INTERVAL_MS = 15000;
const RANGE_OPTIONS = [
  { value: "0", label: "Latest" },
  { value: "1", label: "Previous" },
  { value: "2", label: "2 periods ago" },
  { value: "3", label: "3 periods ago" },
  { value: "4", label: "4 periods ago" },
  { value: "5", label: "5 periods ago" },
];
const STATUS_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1"];
const EXPORT_SECTION_OPTIONS = [
  { key: "summary", label: "Summary metrics" },
  { key: "trend", label: "Revenue and orders trend" },
  { key: "categories", label: "Sales by category" },
  { key: "products", label: "Top products" },
  { key: "statuses", label: "Order status" },
  { key: "payments", label: "Payment methods" },
  { key: "inventoryAlerts", label: "Low stock alerts" },
  { key: "recentOrders", label: "Recent orders" },
];
const EXPORT_RANGE_OPTIONS = [
  { value: "visible", label: "Current screen" },
  { value: "latest", label: "Latest selected period" },
  { value: "previous", label: "Previous selected period" },
  { value: "past30", label: "Past 30 days" },
  { value: "today", label: "Today only" },
  { value: "specificDay", label: "Choose one day" },
];
const DEFAULT_EXPORT_SECTIONS = EXPORT_SECTION_OPTIONS.reduce(
  (sections, option) => ({ ...sections, [option.key]: true }),
  {}
);

const money = (value) => `PHP ${Number(value || 0).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();
const delta = (value) => {
  const numberValue = Number(value || 0);
  return `${numberValue > 0 ? "+" : ""}${numberValue}% vs previous period`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildTable = (title, headers, rows) => `
  <h2>${escapeHtml(title)}</h2>
  <table border="1">
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("")}
    </tbody>
  </table>
`;

const toDateInputValue = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const buildExportQuery = ({ range, selectedDate, period }) => {
  if (range === "latest") return { period, offset: 0 };
  if (range === "previous") return { period, offset: 1 };
  if (range === "past30") return { period: "last30", offset: 0 };
  if (range === "today") return { period: "daily", date: toDateInputValue() };
  if (range === "specificDay") return { period: "daily", date: selectedDate || toDateInputValue() };
  return null;
};

const exportReportToExcel = (report, sections) => {
  if (!report) return;
  const selectedSections = Object.entries(sections).filter(([, selected]) => selected);

  if (selectedSections.length === 0) {
    toast.error("Choose at least one section to export");
    return;
  }

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { margin-top: 24px; font-size: 16px; }
          table { border-collapse: collapse; margin-top: 8px; width: 100%; }
          th { background: #f3f4f6; font-weight: 700; }
          th, td { border: 1px solid #d1d5db; padding: 8px; }
        </style>
      </head>
      <body>
        <h1>JBM Electro Ventures Report</h1>
        <p>${escapeHtml(report.period?.label || "")}</p>
        ${sections.summary ? buildTable("Summary", ["Metric", "Value"], [
            ["Total Revenue", money(report.metrics?.totalRevenue)],
            ["Total Orders", number(report.metrics?.totalOrders)],
            ["Completed Orders", number(report.metrics?.completedOrders)],
            ["New Customers", number(report.metrics?.newCustomers)],
            ["Average Order Value", money(report.metrics?.avgOrderValue)],
            ["Appointments", number(report.metrics?.appointments)],
          ]) : ""}
        ${sections.trend ? buildTable(
            "Revenue and Orders Trend",
            ["Date", "Revenue", "Orders"],
            (report.charts?.revenueTrend || []).map((row) => [row.label, row.revenue, row.orders])
          ) : ""}
        ${sections.categories ? buildTable(
            "Sales by Category",
            ["Category", "Sales", "Units"],
            (report.charts?.categorySales || []).map((row) => [row.category, row.sales, row.units])
          ) : ""}
        ${sections.products ? buildTable(
            "Top Products",
            ["Product", "Units Sold", "Revenue"],
            (report.charts?.topProducts || []).map((row) => [row.product, row.sold, row.revenue])
          ) : ""}
        ${sections.statuses ? buildTable(
            "Order Status",
            ["Status", "Orders"],
            (report.charts?.statusBreakdown || []).map((row) => [row.name, row.value])
          ) : ""}
        ${sections.payments ? buildTable(
            "Payment Methods",
            ["Method", "Revenue", "Orders"],
            (report.charts?.paymentBreakdown || []).map((row) => [row.method, row.revenue, row.orders])
          ) : ""}
        ${sections.inventoryAlerts ? buildTable(
            "Low Stock Alerts",
            ["Product", "Category", "Stock", "Minimum", "Inventory Value"],
            (report.inventoryAlerts || []).map((row) => [
              row.productName,
              row.category,
              row.stockLevel,
              row.minStock,
              row.inventoryValue,
            ])
          ) : ""}
        ${sections.recentOrders ? buildTable(
            "Recent Orders",
            ["Order ID", "Customer", "Date", "Amount", "Status"],
            (report.recentOrders || []).map((order) => [
              order.referenceNumber,
              order.customerName,
              order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
              order.total,
              order.status,
            ])
          ) : ""}
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jbm-report-${report.period?.type || "report"}-${report.period?.offset || 0}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const [period, setPeriod] = useState("monthly");
  const [offset, setOffset] = useState("0");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    range: "visible",
    selectedDate: toDateInputValue(),
    sections: DEFAULT_EXPORT_SECTIONS,
  });
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchReport = async () => {
      try {
        const response = await reportsAPI.getOverview({ period, offset });
        if (!active) return;
        setReport(response.data.data);
        setLastUpdated(new Date());
        setError("");
      } catch (fetchError) {
        if (active) {
          console.error("Error fetching reports:", fetchError);
          setError(fetchError.response?.data?.message || "Failed to load reports");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReport();
    const interval = window.setInterval(fetchReport, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [period, offset]);

  const metrics = report?.metrics || {};
  const comparison = report?.comparison || {};
  const allTime = report?.allTime || {};
  const revenueTrend = report?.charts?.revenueTrend || [];
  const categoryData = report?.charts?.categorySales || [];
  const productPerformance = report?.charts?.topProducts || [];
  const statusBreakdown = report?.charts?.statusBreakdown || [];
  const paymentBreakdown = report?.charts?.paymentBreakdown || [];
  const paymentMethodCount = paymentBreakdown.filter(
    (payment) => payment.orders > 0 && payment.method && payment.method !== "Unknown"
  ).length;
  const appointmentStatusBreakdown = report?.charts?.appointmentStatusBreakdown || [];
  const inventoryAlerts = report?.inventoryAlerts || [];
  const customerMetrics = [
    { metric: "Total Customers", value: number(allTime.totalCustomers), change: "All-time database total" },
    { metric: "New Customers", value: number(metrics.newCustomers), change: delta(comparison.newCustomers) },
    { metric: "Repeat Customers", value: number(allTime.repeatCustomers), change: "Customers with 2+ orders" },
    { metric: "Appointments", value: number(metrics.appointments), change: `Within ${report?.period?.label || "period"}` },
  ];

  const updateExportSection = (section, checked) => {
    setExportOptions((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: checked,
      },
    }));
  };

  const handleExport = async () => {
    const query = buildExportQuery({
      range: exportOptions.range,
      selectedDate: exportOptions.selectedDate,
      period,
    });

    try {
      setExporting(true);
      const exportReport = query
        ? (await reportsAPI.getOverview(query)).data.data
        : report;

      exportReportToExcel(exportReport, exportOptions.sections);
      setExportDialogOpen(false);
    } catch (exportError) {
      console.error("Error exporting report:", exportError);
      toast.error(exportError.response?.data?.message || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-gray-500">
            Live reports for {report?.period?.label || "the selected period"}
            {lastUpdated ? `, updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={offset} onValueChange={setOffset}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!report} onClick={() => setExportDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {loading && !report ? (
        <Card>
          <CardContent className="p-6">Loading live report...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric
              title="Total Revenue"
              value={money(metrics.totalRevenue)}
              note={delta(comparison.revenue)}
              icon={DollarSign}
              color="text-green-600"
            />
            <Metric
              title="Total Orders"
              value={number(metrics.totalOrders)}
              note={delta(comparison.orders)}
              icon={ShoppingCart}
              color="text-blue-600"
            />
            <Metric
              title="New Customers"
              value={number(metrics.newCustomers)}
              note={delta(comparison.newCustomers)}
              icon={Users}
              color="text-purple-600"
            />
            <Metric
              title="Avg Order Value"
              value={money(metrics.avgOrderValue)}
              note={delta(comparison.avgOrderValue)}
              icon={TrendingUp}
              color="text-orange-600"
            />
            <Metric
              title="Low Stock"
              value={number(allTime.lowStockItems)}
              note={`${number(allTime.inventoryItems)} inventory items`}
              icon={AlertTriangle}
              color="text-red-600"
            />
            <Metric
              title="Appointments"
              value={number(metrics.appointments)}
              note={`Within ${report?.period?.label || "period"}`}
              icon={CalendarCheck}
              color="text-teal-600"
            />
            <Metric
              title="Payment Mix"
              value={number(paymentMethodCount)}
              note="Unique active payment methods"
              icon={CreditCard}
              color="text-indigo-600"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={revenueTrend} xKey="label" yKey="revenue" color="#3b82f6" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length ? (
                  <SimpleBarChart data={categoryData} xKey="category" yKey="sales" color="#3b82f6" />
                ) : (
                  <p className="py-8 text-center text-gray-500">No category sales for this period.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productPerformance.map((product, index) => (
                    <div key={product.product} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <p>{product.product}</p>
                          <p className="text-sm text-gray-500">{number(product.sold)} units sold</p>
                        </div>
                      </div>
                      <p>{money(product.revenue)}</p>
                    </div>
                  ))}
                  {productPerformance.length === 0 && (
                    <p className="py-8 text-center text-gray-500">No completed product sales for this period.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customerMetrics.map((metric) => (
                    <div key={metric.metric} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">{metric.metric}</p>
                      <p className="text-2xl mb-1">{metric.value}</p>
                      <p className="text-sm text-green-600">{metric.change}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusBreakdown.length ? (
                  <SimpleDonutChart data={statusBreakdown} colors={STATUS_COLORS} />
                ) : (
                  <p className="py-8 text-center text-gray-500">No orders for this period.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentBreakdown.map((payment) => (
                    <div key={payment.method} className="flex items-center justify-between gap-4">
                      <div>
                        <p>{payment.method}</p>
                        <p className="text-sm text-gray-500">{number(payment.orders)} orders</p>
                      </div>
                      <p>{money(payment.revenue)}</p>
                    </div>
                  ))}
                  {paymentBreakdown.length === 0 && (
                    <p className="py-6 text-center text-gray-500">No payments for this period.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentStatusBreakdown.length ? (
                  <SimpleDonutChart data={appointmentStatusBreakdown} colors={STATUS_COLORS} />
                ) : (
                  <p className="py-8 text-center text-gray-500">No appointments for this period.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.map((product) => (
                    <div key={product._id} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate">{product.productName}</p>
                        <p className="text-sm text-gray-500 truncate">{product.category}</p>
                      </div>
                      <p className="text-sm text-red-600">
                        {product.stockLevel}/{product.minStock}
                      </p>
                    </div>
                  ))}
                  {inventoryAlerts.length === 0 && (
                    <p className="py-6 text-center text-gray-500">No low stock products.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Export Report to Excel</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Report date range</Label>
              <Select
                value={exportOptions.range}
                onValueChange={(value) => setExportOptions((current) => ({ ...current, range: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Latest and previous use the selected report type: {period}.
              </p>
            </div>

            {exportOptions.range === "specificDay" && (
              <div className="space-y-2">
                <Label htmlFor="exportDate">Choose day</Label>
                <Input
                  id="exportDate"
                  type="date"
                  value={exportOptions.selectedDate}
                  onChange={(event) =>
                    setExportOptions((current) => ({ ...current, selectedDate: event.target.value }))
                  }
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>Include in Excel</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXPORT_SECTION_OPTIONS.map((option) => (
                  <label
                    key={option.key}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(exportOptions.sections[option.key])}
                      onChange={(event) => updateExportSection(option.key, event.target.checked)}
                      className="h-4 w-4 accent-black"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setExportDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={exporting} onClick={handleExport}>
                {exporting ? "Preparing..." : "Export Excel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ title, value, note, icon, color }) {
  const Icon = icon;
  return (
    <Card>
      <CardContent className="flex min-h-40 items-center p-6">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-3 break-words text-2xl">{value}</p>
            <p className="mt-2 text-sm text-green-600">{note}</p>
          </div>
          <Icon className={`h-8 w-8 shrink-0 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
