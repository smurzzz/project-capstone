import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ImageIcon, Star } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { packagesAPI } from "../../utils/api.js";

export default function ClientPackages({ onSelectPackage }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await packagesAPI.getAll();
        setPackages(response.data.data || []);
      } catch (error) {
        console.error("Error loading packages:", error);
        toast.error("Failed to load package deals");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Package Deals</h2>
          <p className="text-gray-600">Loading curated bundles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Package Deals</h2>
        <p className="text-gray-600">Save more with curated product bundles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card
            key={pkg._id}
            className={`hover:shadow-lg transition-shadow ${
              pkg.isPopular ? "border-blue-500 border-2" : ""
            }`}
          >
            <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-lg">
              {pkg.imageUrl ? (
                <img src={pkg.imageUrl} alt={pkg.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </div>
                {pkg.isPopular && (
                  <Badge className="gap-1 bg-blue-600">
                    <Star className="h-3 w-3 fill-white" />
                    Popular
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  PHP {Number(pkg.price || 0).toLocaleString()}
                </span>
                {pkg.originalPrice > pkg.price && (
                  <span className="text-lg text-gray-400 line-through">
                    PHP {Number(pkg.originalPrice).toLocaleString()}
                  </span>
                )}
                {pkg.originalPrice > pkg.price && (
                  <Badge variant="secondary" className="ml-auto">
                    Save {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-sm text-gray-700">Package Includes:</p>
                <ul className="space-y-2">
                  {(pkg.items || []).map((item, index) => (
                    <li key={`${item.name}-${index}`} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full" size="lg" onClick={() => onSelectPackage?.(pkg)}>
                Select Package
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No package deals are available right now.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
