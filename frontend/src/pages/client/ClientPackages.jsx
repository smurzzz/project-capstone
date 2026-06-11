import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, ImageIcon, Lock, PackageCheck, Sparkles, Star } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { membershipAPI, packagesAPI } from "../../utils/api.js";
import { isMembershipActive } from "../../utils/membership.js";

export default function ClientPackages({ onSelectPackage }) {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [membership, setMembership] = useState(user?.membership || null);
  const [loading, setLoading] = useState(true);
  const memberRoleActive = user?.memberRole === "Member";
  const canSelectPackages = memberRoleActive || isMembershipActive(membership);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const [packagesResponse, membershipResponse] = await Promise.all([
          packagesAPI.getAll(),
          user
            ? membershipAPI.getMyMembership().catch(() => ({ data: { data: { membership: user?.membership || null } } }))
            : Promise.resolve({ data: { data: { membership: null } } }),
        ]);

        setPackages(packagesResponse.data.data || []);
        setMembership(membershipResponse.data.data?.membership || null);
      } catch (error) {
        console.error("Error loading packages:", error);
        toast.error("Failed to load package deals");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 h-6 w-36 animate-pulse rounded-full bg-slate-200" />
          <div className="h-9 w-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <Card key={item} className="overflow-hidden rounded-[2rem] border-slate-200">
              <div className="h-64 animate-pulse bg-slate-100" />
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="h-7 w-2/3 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-11 w-full animate-pulse rounded-full bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-5 text-white sm:p-6 md:grid-cols-[1fr_auto] md:items-end lg:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100">
              <Sparkles className="h-4 w-4" />
              Curated savings
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Package Deals</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
              Bundle-ready electrical essentials with cleaner pricing, faster ordering, and better value for common projects.
            </p>
            {!canSelectPackages && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-blue-50">
                <Lock className="h-4 w-4" />
                Members Only
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Deals</p>
              <p className="mt-1 text-2xl font-bold">{packages.length}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Popular</p>
              <p className="mt-1 text-2xl font-bold">{packages.filter((pkg) => pkg.isPopular).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {packages.map((pkg) => {
          return (
            <Card
              key={pkg._id}
              className={`group h-full rounded-[2rem] border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                pkg.isPopular ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
              }`}
            >
              <div className="relative grid h-full min-h-full md:grid-cols-[240px_minmax(0,1fr)]">
                <div className="relative flex h-full min-h-64 items-stretch justify-center overflow-hidden rounded-t-[2rem] bg-slate-100 md:rounded-l-[2rem] md:rounded-tr-none md:min-h-full">
                  {pkg.imageUrl ? (
                    <img
                      src={pkg.imageUrl}
                      alt={pkg.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-14 w-14 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent md:bg-gradient-to-r" />
                  {pkg.isPopular && (
                    <Badge className="absolute left-4 top-4 gap-1 rounded-full bg-blue-600 px-3 py-1 text-white shadow-lg">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      Popular
                    </Badge>
                  )}
                </div>

                <div className="flex min-w-0 flex-col overflow-hidden rounded-b-[2rem] md:rounded-r-[2rem] md:rounded-bl-none">
                  <CardHeader className="space-y-3 p-5">
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                        <PackageCheck className="h-3.5 w-3.5" />
                        Bundle
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-2xl leading-tight text-slate-950">{pkg.name}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 break-words">
                          {pkg.description || "A curated package built for practical electrical needs."}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col space-y-4 p-5 pt-0">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                          PHP {Number(pkg.price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Package Includes</p>
                      <div className="grid gap-2">
                        {(pkg.items || []).slice(0, 4).map((item, index) => (
                          <div key={`${item.name}-${index}`} className="flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700 sm:flex-row sm:items-center">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                              <Check className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1 break-words text-sm font-medium text-slate-800">{item.name}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">x{item.quantity}</span>
                          </div>
                        ))}
                        {(pkg.items || []).length > 4 && (
                          <div className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                            +{pkg.items.length - 4} more included
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      className="mt-auto w-full justify-center gap-2 rounded-full bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500"
                      size="sm"
                      onClick={() => {
                        if (!canSelectPackages) {
                          toast.error("Package deals are available to active members only.");
                          return;
                        }
                        onSelectPackage?.(pkg);
                      }}
                      disabled={!canSelectPackages}
                    >
                      {canSelectPackages ? (
                        <>
                          Add to Cart
                          <ArrowRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Members Only
                        </>
                      )}
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {packages.length === 0 && (
        <Card className="rounded-[2rem] border-slate-200">
          <CardContent className="py-12 text-center text-slate-500">
            <PackageCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            No package deals are available right now.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
