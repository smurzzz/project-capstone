import { useEffect, useState } from "react";
import {
  Award,
  Package,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { appointmentsAPI, ordersAPI } from "../../utils/api.js";

export default function ClientHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    orders: 0,
    appointments: 0,
    spent: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersResponse, appointmentsResponse] = await Promise.all([
          user?.customerId ? ordersAPI.getByCustomer(user.customerId) : Promise.resolve({ data: { data: [] } }),
          appointmentsAPI.getMyAppointments(),
        ]);
        const orders = ordersResponse.data.data || [];
        const appointments = appointmentsResponse.data.data || [];
        setStats({
          orders: orders.length,
          appointments: appointments.filter((appointment) => appointment.status !== "Cancelled").length,
          spent: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
          pending: orders.filter((order) => order.status === "Pending").length,
        });
      } catch (error) {
        console.error("Error loading customer stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Welcome to JBM Electro Ventures</h1>
        <p className="text-lg text-gray-600">Your trusted e-commerce portal for electrical solutions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat title="My Orders" value={stats.orders} note="All purchases" icon={TrendingUp} color="from-blue-500 to-blue-600" />
        <Stat title="Appointments" value={stats.appointments} note="Active bookings" icon={Award} color="from-green-500 to-emerald-600" />
        <Stat title="Total Spent" value={`PHP ${stats.spent.toLocaleString()}`} note="Account lifetime" icon={Target} color="from-purple-500 to-pink-600" />
        <Stat title="Pending Orders" value={stats.pending} note="Awaiting confirmation" icon={Package} color="from-orange-500 to-red-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-gray-700 leading-relaxed">
              To provide high-quality electrical products and services with reliable ordering,
              secure checkout, inventory accuracy, and responsive customer support.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <CardTitle>Member Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-gray-700 leading-relaxed">
              Members receive automatic order discounts, saved profile details, and private
              tracking for orders and service appointments.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ title, value, note, icon, color }) {
  const Icon = icon;
  return (
    <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-gray-600 mb-2">{title}</CardTitle>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
            <p className="text-xs text-gray-500 mt-2">{note}</p>
          </div>
          <div className={`p-3 bg-gradient-to-br ${color} rounded-lg flex-shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
