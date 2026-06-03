import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoSrc from '../../assets/logo (1).webp';
import { ArrowRight, Zap, Lightbulb, Wrench, Gauge, Heart, Flame, Package, Percent, ImageIcon, ShoppingBag, Mail, MapPin, Phone, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { packagesAPI, productsAPI, promotionsAPI } from '../../utils/api';

export default function ClientHomepage() {
  const { user } = useAuth();
  const [flashDeals, setFlashDeals] = useState([]);
  const [packageDeals, setPackageDeals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const [promotionsResponse, packagesResponse, productsResponse] = await Promise.all([
          promotionsAPI.getAll().catch(() => ({ data: { data: [] } })),
          packagesAPI.getAll().catch(() => ({ data: { data: [] } })),
          productsAPI.getAll({ limit: 4 }).catch(() => ({ data: { data: [] } })),
        ]);

        setFlashDeals((promotionsResponse.data.data || []).slice(0, 3));
        setPackageDeals((packagesResponse.data.data || []).slice(0, 3));
        setFeaturedProducts(productsResponse.data.data || []);
      } catch (error) {
        console.error("Error loading landing offers:", error);
      }
    };

    fetchOffers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logoSrc}
                alt="JBM Electro logo"
                className="h-10 w-10 rounded-xl bg-white p-1 object-contain"
              />
              <span className="text-lg font-bold text-gray-900 truncate">
                JBM Electro Ventures
              </span>
            </div>
            <div className="flex gap-3 shrink-0 flex-wrap">
              {user ? (
                <>
                  <Link to="/membership/status">
                    <Button variant="outline" className="gap-2">
                      <Heart className="h-4 w-4" />
                      <span className="hidden sm:inline">Membership</span>
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                </>
            ) : (
              <>
                <Link to="/signup">
                  <Button variant="outline" className="gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Unlock Deals</span>
                  </Button>
                </Link>
                  <Link to="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-8">
            <Gauge className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Trusted by thousands of customers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Powering Your Future with <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Innovation</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            JBM Electro Ventures delivers cutting-edge electrical solutions and products
            tailored to meet your residential, commercial, and industrial needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Explore Products <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/membership/status">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                    <Heart className="h-4 w-4" />
                    My Membership
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Sign Up for Deals <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Explore Products
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <OfferPreview flashDeals={flashDeals} packageDeals={packageDeals} user={user} />

      <ProductsPreview products={featuredProducts} user={user} />

      <section className="py-16 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Mission & Vision</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Lightbulb className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700">
                  To provide high-quality, innovative electrical products and services that
                  enhance the lives of our customers while maintaining the highest standards
                  of safety, reliability, and sustainability.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Wrench className="h-12 w-12 text-cyan-600 mb-4" />
                <CardTitle className="text-xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700">
                  To be the leading provider of electrical solutions in the region,
                  recognized for our commitment to innovation, customer satisfaction,
                  and environmental responsibility.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <Gauge className="h-10 w-10 text-blue-600 mb-3" />
                <CardTitle>Premium Products</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">
                  High-quality electrical components, fixtures, and equipment from trusted brands
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <Zap className="h-10 w-10 text-cyan-600 mb-3" />
                <CardTitle>Package Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">
                  Curated bundles designed for specific projects at competitive prices
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <Wrench className="h-10 w-10 text-emerald-600 mb-3" />
                <CardTitle>Expert Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">
                  Professional guidance to help you choose the right solutions for your needs
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-r from-[#021b47] to-[#032a68] pt-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-10 px-5 pb-10">
          <div className="min-w-[250px] flex-1">
            <div className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt="JBM Electro logo"
                className="h-12 w-12 rounded-xl bg-white p-2 object-contain"
              />
              <div>
                <p className="text-xl font-bold leading-tight">JBM Electro</p>
                <p className="text-sm text-blue-100">Ventures</p>
              </div>
            </div>
            <div className="mt-5 flex gap-4">
              <a
                href="https://www.facebook.com/JBMPH"
                aria-label="JBM Electro Ventures Facebook"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400 text-white transition hover:bg-blue-500"
                target="_blank"
                rel="noreferrer"
              >
                <span className="text-xl font-bold leading-none">f</span>
              </a>
              <a
                href="mailto:support@jbm.com.ph"
                aria-label="Email JBM Electro Ventures"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400 text-white transition hover:bg-blue-500"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="min-w-[250px] flex-1">
            <h3 className="mb-5 text-lg font-bold text-blue-400">SUPPORT</h3>
            <ul className="space-y-4">
              <li><Link to="/faq" className="transition hover:text-blue-400">FAQs</Link></li>
              <li><a href="mailto:support@jbm.com.ph" className="transition hover:text-blue-400">Contact Us</a></li>
              <li><Link to="/warranty-returns" className="transition hover:text-blue-400">Warranty & Returns</Link></li>
              <li><Link to="/terms" className="transition hover:text-blue-400">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="transition hover:text-blue-400">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="min-w-[250px] flex-1">
            <h3 className="mb-5 text-lg font-bold text-blue-400">GET IN TOUCH</h3>
            <div className="space-y-4 leading-relaxed">
              <p className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
                <span>
                  JBM Electro Ventures <br />
                  Brgy. Disud, Sindangan, Zamboanga del Norte, Philippines.
                </span>
              </p>
              <p className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
                <a href="tel:+639538223950" className="transition hover:text-blue-400">+63 953 822 3950</a>
              </p>
              <p className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
                <a href="mailto:support@jbm.com.ph" className="transition hover:text-blue-400">support@jbm.com.ph</a>
              </p>
              <p className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
                <span>Mon - Sat &nbsp; - &nbsp; 8:00 AM - 5:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/20 px-4 py-5 text-center text-base">
          <p>© 2026 JBM Electro Ventures. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductsPreview({ products, user }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              <ShoppingBag className="h-4 w-4" />
              Products we sell
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Electrical Products Ready to Order</h2>
            <p className="mt-2 max-w-2xl text-gray-600">
              See real inventory, prices, and stock before creating your order.
            </p>
          </div>
          <Link to={user ? "/dashboard#products" : "/signup"}>
            <Button variant="outline" className="w-full gap-2 md:w-auto">
              {user ? "Browse Products" : "Sign Up to Order"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden border-slate-200 shadow-sm">
              <div className="flex h-36 items-center justify-center bg-slate-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.productName} className="h-full w-full object-contain p-4" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <CardContent className="p-4">
                <p className="line-clamp-2 font-semibold text-gray-900">{product.productName}</p>
                <p className="mt-1 text-sm text-gray-600">{product.category || "Electrical product"}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900">PHP {Number(product.srp ?? product.price ?? 0).toLocaleString()}</span>
                  <span className="text-xs font-medium text-gray-500">{Number(product.stockLevel || 0)} in stock</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferPreview({ flashDeals, packageDeals, user }) {
  return (
    <section className="py-16 px-4 bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
              <Flame className="h-4 w-4" />
              Live customer offers
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Flash Deals & Package Savings</h2>
            <p className="mt-2 max-w-2xl text-gray-600">
              Sign up to order faster, track purchases, and apply for member discounts on selected deals.
            </p>
          </div>
          <Link to={user ? "/dashboard" : "/signup"}>
            <Button className="w-full gap-2 md:w-auto">
              {user ? "Open Dashboard" : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-orange-100 bg-orange-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                Flash Deals
              </CardTitle>
              <CardDescription>Promo codes and automatic discounts currently available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {flashDeals.length > 0 ? flashDeals.map((deal) => (
                <div key={deal._id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{deal.name}</p>
                      <p className="mt-1 text-sm text-gray-600">{deal.description || "Limited-time savings for eligible orders."}</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                      {deal.type === "percentage" ? `${deal.value}% off` : `PHP ${Number(deal.value).toLocaleString()} off`}
                    </Badge>
                  </div>
                  {deal.code && (
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-orange-700">
                      Use code {deal.code}
                    </p>
                  )}
                </div>
              )) : (
                <p className="rounded-lg bg-white p-4 text-sm text-gray-600">New flash deals will appear here when active.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {packageDeals.length > 0 ? packageDeals.map((pkg) => (
              <Card key={pkg._id} className="overflow-hidden border-blue-100 shadow-sm">
                <div className="flex h-32 items-center justify-center bg-slate-100">
                  {pkg.imageUrl ? (
                    <img src={pkg.imageUrl} alt={pkg.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug text-gray-900">{pkg.name}</p>
                    {pkg.isPopular && <Badge className="bg-blue-600">Popular</Badge>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{pkg.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-bold text-blue-700">PHP {Number(pkg.price || 0).toLocaleString()}</span>
                    {pkg.originalPrice > pkg.price && (
                      <span className="text-xs font-bold text-green-700">
                        <Percent className="mr-1 inline h-3 w-3" />
                        Save {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="md:col-span-3">
                <CardContent className="py-10 text-center text-gray-600">
                  Package deals will appear here once available.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {!user && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-center">
            <Package className="mx-auto h-8 w-8 text-blue-600" />
            <p className="mt-3 font-semibold text-gray-900">Create an account to save deals, place orders, and track every purchase.</p>
            <Link to="/signup" className="mt-4 inline-block">
              <Button>Sign Up Now</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
