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
import { appointmentsAPI, membershipAPI, ordersAPI, packagesAPI, productsAPI, promotionsAPI } from "../../utils/api.js";
import { getTierDetails, isMembershipActive } from "../../utils/membership.js";

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
  const [flashDeals, setFlashDeals] = useState([]);
  const [packageDeals, setPackageDeals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersResponse, appointmentsResponse, membershipResponse, promotionsResponse, packagesResponse, productsResponse] = await Promise.all([
          user?.customerId ? ordersAPI.getByCustomer(user.customerId) : Promise.resolve({ data: { data: [] } }),
          appointmentsAPI.getMyAppointments(),
          membershipAPI.getMyMembership().catch(() => ({ data: { data: { membership: null } } })),
          promotionsAPI.getAll().catch(() => ({ data: { data: [] } })),
          packagesAPI.getAll().catch(() => ({ data: { data: [] } })),
          productsAPI.getAll({ limit: 4 }).catch(() => ({ data: { data: [] } })),
        ]);
        const orders = ordersResponse.data.data || [];
        const appointments = appointmentsResponse.data.data || [];
        setMembership(membershipResponse.data.data?.membership || null);
        setFlashDeals((promotionsResponse.data.data || []).slice(0, 3));
        setPackageDeals((packagesResponse.data.data || []).slice(0, 3));
        setFeaturedProducts(productsResponse.data.data || []);
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

      <MembershipCard membership={membership} onOpen={() => navigate("/membership/status")} onApply={() => navigate("/membership/apply")} />

      <DealsSection
        flashDeals={flashDeals}
        packageDeals={packageDeals}
        onOpenPackages={() => onNavigateTab?.("packages")}
      />

      <ProductsPreview products={featuredProducts} onOpenProducts={() => onNavigateTab?.("products")} />

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
                  <img src={product.imageUrl} alt={product.productName} className="h-full w-full object-contain p-3" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <p className="mt-3 line-clamp-2 font-semibold text-gray-900">{product.productName}</p>
              <p className="mt-1 text-sm text-gray-600">{product.category || "Electrical product"}</p>
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

function DealsSection({ flashDeals, packageDeals, onOpenPackages }) {
  if (flashDeals.length === 0 && packageDeals.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-orange-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Flame className="h-5 w-5 text-orange-600" />
                Flash Deals
              </CardTitle>
              <CardDescription>Active discounts you can use on checkout</CardDescription>
            </div>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
              Limited
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {flashDeals.length > 0 ? flashDeals.map((deal) => (
            <div key={deal._id} className="rounded-lg border border-orange-100 bg-orange-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{deal.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{deal.description || "Apply this deal to eligible orders."}</p>
                </div>
                <div className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-orange-700">
                  {deal.type === "percentage" ? `${deal.value}%` : `PHP ${Number(deal.value).toLocaleString()}`}
                </div>
              </div>
              {deal.code && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-orange-700">
                  Code: {deal.code}
                </p>
              )}
            </div>
          )) : (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No flash deals are active right now.</p>
          )}
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
          {packageDeals.map((pkg) => (
            <div key={pkg._id} className="flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{pkg.name}</p>
                <p className="mt-1 text-sm text-gray-600">PHP {Number(pkg.price || 0).toLocaleString()}</p>
              </div>
              {pkg.originalPrice > pkg.price && (
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-blue-700">
                  <Percent className="mr-1 inline h-3.5 w-3.5" />
                  Save {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                </span>
              )}
            </div>
          ))}
          {packageDeals.length === 0 && (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No package deals are available right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MembershipCard({ membership, onOpen, onApply }) {
  const active = isMembershipActive(membership);
  const hasApplied = membership && membership.status && membership.status !== "None";
  const tierDetails = getTierDetails(membership?.tier);

  const statusCopy = active
    ? `${membership.tier} member benefits are active.`
    : hasApplied && membership.status === "Pending"
      ? "Your membership application is waiting for admin approval."
      : hasApplied && membership.status === "Rejected"
        ? "Your previous application was rejected. You can apply again."
        : "Join the membership program when you are ready.";

  const Icon = active ? ShieldCheck : hasApplied ? Clock : Award;
  const action = active || hasApplied ? onOpen : onApply;
  const actionLabel = active ? "View Membership" : hasApplied ? "View Status" : "Apply for Membership";

  return (
    <Card className="border-blue-100 bg-blue-50/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Membership</h2>
                {hasApplied && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                    {membership.status}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700">{statusCopy}</p>
              {active && (
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {tierDetails.monthlyDiscount}% discount
                  </span>
                  <span>{membership.pointsBalance || 0} points</span>
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
