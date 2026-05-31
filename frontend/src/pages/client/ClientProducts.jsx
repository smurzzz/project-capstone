import { useState, useEffect } from "react";
import { ImageIcon, Search, ShoppingCart, Plus, Minus } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
} from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.jsx";
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

const getProductStock = (product) => Number(product?.stockLevel ?? product?.stock ?? 0);

export default function ClientProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDialogTab, setProductDialogTab] = useState("specifications");
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
    } else {
      toast.error("The selected quantity is no longer available.");
    }
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setProductDialogTab("specifications");
    setProductDialogOpen(true);
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
        {filteredProducts.map((product) => {
          const priceLabel = Number(product.srp ?? product.price).toLocaleString();
          const stockLabel = getProductStock(product);
          const tagLabel = product.category || "Saver";
          const featureLabel = product.feature || `Best for ${product.category || "motorized vehicles"}`;
          const productSubtitle = product.description ? product.description.split(".")[0] + "." : "Premium performance and protection.";
          const lowStock = stockLabel > 0 && stockLabel <= 3;

          return (
            <Card
              key={product._id}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              onClick={() => openProductDetails(product)}
            >
              <CardContent className="px-6 py-7">
                <div className="flex items-center justify-between gap-3">
                  <Badge className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    {tagLabel}
                  </Badge>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lowStock ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {stockLabel <= 0 ? "Out of stock" : lowStock ? `Only ${stockLabel} left` : `${stockLabel} in stock`}
                  </span>
                </div>

                <div className="mx-auto mt-6 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[2rem] bg-slate-100 shadow-sm">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.productName || product.name}
                      className="h-full w-full rounded-[2rem] object-contain p-4"
                    />
                  ) : (
                    <ImageIcon className="h-14 w-14 text-slate-400" />
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="text-xl font-semibold text-slate-900">{product.productName || product.name}</div>
                  <p className="text-sm text-slate-500">{productSubtitle}</p>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="text-2xl font-bold text-slate-900">PHP {priceLabel}</div>
                </div>

                <div className="mt-4">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {featureLabel}
                  </span>
                </div>

                <div className="mt-6">
                  <Button
                    className="w-full justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddToCart(product);
                    }}
                    disabled={stockLabel <= 0}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null);
          }
          setProductDialogOpen(open);
        }}
      >
        {selectedProduct && (
          <DialogContent className="max-w-[960px] overflow-hidden bg-white p-0 shadow-2xl">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr] p-6">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-slate-100 lg:aspect-auto lg:min-h-[360px]">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.productName || selectedProduct.name}
                    className="h-full w-full rounded-[2rem] object-contain p-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    {selectedProduct.category || "Appliance Protection"}
                  </span>
                  <div className="text-4xl font-semibold leading-tight tracking-tight text-slate-950">
                    {selectedProduct.productName || selectedProduct.name}
                  </div>
                  <div className="text-sm leading-6 text-slate-600">
                    {selectedProduct.description || "The best product for reliable performance and long-term durability."}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-4xl font-bold text-slate-900">
                      PHP {Number(selectedProduct.srp ?? selectedProduct.price).toLocaleString()}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getProductStock(selectedProduct) <= 3 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                      {getProductStock(selectedProduct) <= 0 ? "Out of stock" : getProductStock(selectedProduct) <= 3 ? `Only ${getProductStock(selectedProduct)} left!` : "In stock"}
                    </span>
                  </div>
                </div>

                <Tabs value={productDialogTab} onValueChange={setProductDialogTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="specifications">Specifications</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                    <TabsTrigger value="warranty">Warranty</TabsTrigger>
                  </TabsList>

                  <TabsContent value="specifications" className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Product Name</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{selectedProduct.productName || selectedProduct.name}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Brand</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{selectedProduct.brand || "JBM"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Type</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{selectedProduct.type || selectedProduct.category || "General"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Technology</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{selectedProduct.technology || "Automatic voltage protection"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Application</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{selectedProduct.application || "Refrigerators"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Power</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{selectedProduct.power || "220V / 60Hz"}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <ul className="space-y-3 text-sm leading-7 text-slate-700">
                      {(selectedProduct.features || [
                        "Protects against voltage surges and spikes.",
                        "Compact, easy-to-install design.",
                        "Compatible with most household appliances.",
                      ]).map((feature, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="compatibility" className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-700">
                    {selectedProduct.compatibility || "Works with most household appliances and electrical systems, including refrigerators, air conditioners, and TVs."}
                  </TabsContent>

                  <TabsContent value="warranty" className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-sm leading-7 text-slate-700 space-y-3">
                    <p>{selectedProduct.warranty || "1-year limited warranty with free replacement for manufacturing defects."}</p>
                    <p className="text-slate-500">Warranty terms may vary based on product specifications and purchase location.</p>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                      onClick={() => handleQuantityChange(selectedProduct._id, -1)}
                      disabled={(quantities[selectedProduct._id] || 1) <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-14 text-center text-sm font-semibold">{quantities[selectedProduct._id] || 1}</span>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                      onClick={() => handleQuantityChange(selectedProduct._id, 1)}
                      disabled={(quantities[selectedProduct._id] || 1) >= getProductStock(selectedProduct)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    className="w-full justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
                    onClick={() => handleAddToCart(selectedProduct)}
                    disabled={getProductStock(selectedProduct) <= 0}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

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
