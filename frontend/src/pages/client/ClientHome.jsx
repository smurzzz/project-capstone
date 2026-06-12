import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  CheckCircle,
  Clock,
  Flame,
  ImageIcon,
  Package,
  Percent,
  ShieldCheck,
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
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { appointmentsAPI, membershipAPI, ordersAPI, packagesAPI, productsAPI } from "../../utils/api.js";
import { isMembershipActive } from "../../utils/membership.js";

export default function ClientHome({ onNavigateTab }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: 0,
    appointments: 0,
    spent: 0,
    pending: 0,
  });
  const [membership, setMembership] = useState(null);
  const [packageDeals, setPackageDeals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const memberRoleActive = user?.memberRole === "Member";


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersResponse, appointmentsResponse, membershipResponse, packagesResponse, productsResponse] = await Promise.all([
          user?.customerId ? ordersAPI.getByCustomer(user.customerId) : Promise.resolve({ data: { data: [] } }),
          appointmentsAPI.getMyAppointments(),
          membershipAPI.getMyMembership().catch(() => ({ data: { data: { membership: null } } })),
          packagesAPI.getAll().catch(() => ({ data: { data: [] } })),
          productsAPI.getAll({ limit: 4 }).catch(() => ({ data: { data: [] } })),
        ]);
        const orders = ordersResponse.data.data || [];
        const appointments = appointmentsResponse.data.data || [];
        setMembership(membershipResponse.data.data?.membership || null);
        setPackageDeals((packagesResponse.data.data || []).slice(0, 3));
        setFeaturedProducts(productsResponse.data.data || []);
        const completedOrders = orders.filter((order) => order.status !== "Cancelled");
        setStats({
          orders: orders.length,
          appointments: appointments.filter((appointment) => appointment.status !== "Cancelled").length,
          spent: completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
          pending: orders.filter((order) => order.status === "Pending").length,
        });
      } catch {
        // Silently handle stats loading errors
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:text-3xl lg:text-4xl">Welcome to JBM Electro Ventures</h1>
        <p className="text-base text-gray-600 sm:text-lg">Your trusted e-commerce portal for electrical solutions</p>
      </div>

      <MembershipCard
        membership={membership}
        isMemberRole={memberRoleActive}
        onApply={() => navigate("/membership/apply")}
        onViewStatus={() => navigate("/membership/status")}
        onOpenPackages={() => onNavigateTab?.("packages")}
      />

      <DealsSection
        packageDeals={packageDeals}
        onOpenPackages={() => onNavigateTab?.("packages")}
      />

      <ProductsPreview products={featuredProducts} onOpenProducts={() => onNavigateTab?.("products")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat title="My Orders" value={stats.orders} note="All purchases" icon={TrendingUp} color="from-blue-500 to-blue-600" />
        <Stat title="Appointments" value={stats.appointments} note="Active bookings" icon={Award} color="from-green-500 to-emerald-600" />
        <Stat
          title="Total Spent"
          value={
            <span className="inline-flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-semibold text-gray-900">PHP</span>
              <span className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{stats.spent.toLocaleString()}</span>
            </span>
          }
          note="Account lifetime"
          icon={Target}
          color="from-purple-500 to-pink-600"
        />
        <Stat title="Pending Orders" value={stats.pending} note="Awaiting confirmation" icon={Package} color="from-orange-500 to-red-600" />
      </div>

    </div>
  );
}

function ProductsPreview({ products, onOpenProducts }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-slate-700" />
              Products We Sell
            </CardTitle>
            <CardDescription>Browse popular electrical products available in the store</CardDescription>
          </div>
          <Button variant="outline" onClick={onOpenProducts}>
            View Products
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex h-28 items-center justify-center rounded-lg bg-slate-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.productName} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <p className="mt-3 line-clamp-2 font-semibold text-gray-900">{product.productName}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{product.category || "Electrical product"}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-bold text-slate-900">PHP {Number(product.srp ?? product.price ?? 0).toLocaleString()}</span>
                <span className="text-xs text-gray-500">{Number(product.stockLevel || 0)} left</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DealsSection({ packageDeals, onOpenPackages }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-blue-100 shadow-sm bg-gradient-to-r from-sky-50 via-white to-slate-50">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700">
                Member Savings
              </div>
              <CardTitle className="mt-3 flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-cyan-600" />
                Membership Benefits
              </CardTitle>
              <CardDescription>Exclusive perks for active members</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6">
            <p className="text-sm font-semibold text-slate-900">Unlock up to 40% member discounts and enjoy access to package deals.</p>
            <p className="mt-2 text-sm text-slate-600">Join today and make every order more valuable with exclusive pricing designed for members.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-5 w-5 text-blue-600" />
                Package Deals
              </CardTitle>
              <CardDescription>Curated bundles for common electrical needs</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenPackages}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {packageDeals.length > 0 ? packageDeals.map((pkg) => (
            <div key={pkg._id} className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 border-l-4 border-l-blue-600 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold text-blue-900">{pkg.name}</p>
                <p className="mt-1 text-sm text-blue-700 font-medium">PHP {Number(pkg.price || 0).toLocaleString()}</p>
              </div>
              {pkg.originalPrice > pkg.price && (
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-blue-700">
                  <Percent className="mr-1 inline h-3.5 w-3.5" />
                  Save {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                </span>
              )}
            </div>
          )) : (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No package deals are available right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MembershipCard({ membership, onApply, onViewStatus, isMemberRole }) {
  const active = isMembershipActive(membership) || isMemberRole;
  const hasApplied = membership && membership.status && membership.status !== "None";
  const shouldShowViewStatus = active || hasApplied;

  const statusCopy = active
    ? "Your membership is active — enjoy your member benefits"
    : hasApplied && membership.status === "Pending"
      ? "Your membership application is waiting for admin approval."
      : hasApplied && membership.status === "Rejected"
        ? "Your previous application was rejected. You can apply again."
        : "Join the membership program when you are ready.";

  const Icon = active ? ShieldCheck : hasApplied ? Clock : Award;
  const action = shouldShowViewStatus ? onViewStatus : onApply;
  const actionLabel = shouldShowViewStatus ? "View Status" : "Apply for Membership";

  return (
    <Card className="border-blue-100 bg-blue-50/70 shadow-sm">
      <CardContent className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
            <div className="h-16 w-16 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-xl font-bold text-gray-900">Membership</h2>
                {hasApplied && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                    {membership.status}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700">{statusCopy}</p>
              {active && (
                <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm text-gray-700 sm:justify-start">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Membership benefits are active
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button onClick={action} className="w-full lg:w-auto">
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ title, value, note, icon, color }) {
  const Icon = icon;
  return (
    <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-sm sm:text-base font-medium text-gray-600 mb-1">{title}</CardTitle>
            <div className={`${title === "Total Spent" ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"} font-bold text-gray-900 tracking-tight`}>{value}</div>
            <p className="text-[11px] text-gray-500 mt-1">{note}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${color} flex-shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
