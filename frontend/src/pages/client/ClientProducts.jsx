import { useState, useEffect } from "react";
import { ImageIcon, Search, ShoppingCart, Plus, Minus } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { productsAPI } from "../../utils/api.js";
import { toast } from "sonner";
import { useCart } from "../../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

const categoryColors = {
  Lighting: "bg-yellow-100 text-yellow-800",
  Electrical: "bg-blue-100 text-blue-800",
  Accessories: "bg-green-100 text-green-800",
  Materials: "bg-purple-100 text-purple-800",
  Electronics: "bg-orange-100 text-orange-800",
};

export default function ClientProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { quantities, addToCart, updateQuantity, getTotalItems } = useCart();
  const navigate = useNavigate();

  async function fetchProducts() {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
      // Fallback to mock data if API fails
      setProducts([
        { _id: "1", productName: "LED Bulb 9W", category: "Lighting", price: 150, srp: 150, stockLevel: 250, description: "Energy-efficient LED bulb" },
        { _id: "2", productName: "Circuit Breaker 20A", category: "Electrical", price: 450, srp: 450, stockLevel: 45, description: "High-quality circuit breaker" },
        { _id: "3", productName: "Extension Cord 5m", category: "Accessories", price: 280, srp: 280, stockLevel: 120, description: "Durable extension cord" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map((product) => product.category)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleQuantityChange = (productId, change) => {
    updateQuantity(productId, change);
  };

  const handleAddToCart = (product) => {
    const quantity = quantities[product._id] || 1;
    const success = addToCart(product, quantity);
    
    if (success) {
      toast.success(`${product.productName || product.name} added to cart!`);
      // Navigate to order section
      navigate('/dashboard');
      // The ClientDashboard will need to handle setting the active tab to "order"
      // We'll use a small delay to ensure the navigation completes
      setTimeout(() => {
        // This will be handled by the ClientDashboard component
        window.location.hash = '#order';
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Browse Products</h2>
          <p className="text-gray-600">Find the perfect electrical products for your needs</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">Browse Products</h2>
          <p className="text-gray-600">Find the perfect electrical products for your needs</p>
        </div>
        {getTotalItems() > 0 && (
          <Badge variant="secondary" className="text-sm">
            {getTotalItems()} items in cart
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-36 rounded-lg bg-gray-100 flex items-center justify-center mb-4 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.productName || product.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <CardTitle className="text-lg">{product.productName || product.name}</CardTitle>
              <CardDescription>
                <Badge
                  variant="secondary"
                  className={categoryColors[product.category] || "bg-gray-100 text-gray-800"}
                >
                  {product.category}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  PHP {Number(product.srp ?? product.price).toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">
                  {product.stockLevel || product.stock} in stock
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(product._id, -1)}
                  disabled={(quantities[product._id] || 1) <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">
                  {quantities[product._id] || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(product._id, 1)}
                  disabled={(quantities[product._id] || 1) >= (product.stockLevel || product.stock)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                className="w-full gap-2"
                onClick={() => handleAddToCart(product)}
                disabled={(product.stockLevel || product.stock) <= 0}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No products found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
