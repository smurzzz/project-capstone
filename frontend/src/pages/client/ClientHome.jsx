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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Welcome to JBM Electro Ventures</h2>
        <p className="text-gray-600">Your trusted e-commerce portal for electrical solutions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat title="My Orders" value={stats.orders} note="All purchases" icon={TrendingUp} color="text-blue-600" />
        <Stat title="Appointments" value={stats.appointments} note="Active bookings" icon={Award} color="text-green-600" />
        <Stat title="Total Spent" value={`PHP ${stats.spent.toLocaleString()}`} note="Account lifetime" icon={Target} color="text-purple-600" />
        <Stat title="Pending Orders" value={stats.pending} note="Awaiting confirmation" icon={Package} color="text-orange-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Target className="h-10 w-10 text-blue-600 mb-4" />
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-gray-700">
              To provide high-quality electrical products and services with reliable ordering,
              secure checkout, inventory accuracy, and responsive customer support.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-10 w-10 text-purple-600 mb-4" />
            <CardTitle>Member Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-gray-700">
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-600">{note}</p>
      </CardContent>
    </Card>
  );
}
