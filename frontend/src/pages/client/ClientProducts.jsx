import { useState, useEffect } from "react";
import { ImageIcon, Search, ShoppingCart, Plus, Minus, Star } from "lucide-react";
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
import { mergeProductDetails, mergeProductsDetails } from "../../utils/productDetailsStore.js";
import { toast } from "sonner";
import { useCart } from "../../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

const getProductStock = (product) => Number(product?.stockLevel ?? product?.stock ?? 0);
const normalizeFeatures = (features) => {
  if (Array.isArray(features)) return features.filter(Boolean);
  const raw = String(features || "").trim();
  return raw ? raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
};
const hasText = (value) => String(value || "").trim().length > 0;

export default function ClientProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDialogTab, setProductDialogTab] = useState("specifications");
  const [modalQuantity, setModalQuantity] = useState(1);
  const { addToCart, getTotalItems } = useCart();
  const navigate = useNavigate();

  async function fetchProducts() {
    try {
      const response = await productsAPI.getAll();
      setProducts(mergeProductsDetails(response.data.data || []));
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

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(1, modalQuantity + change);
    const maxStock = selectedProduct ? getProductStock(selectedProduct) : Infinity;
    setModalQuantity(Math.min(newQuantity, maxStock));
  };

  const handleAddToCart = (product) => {
    const quantity = modalQuantity;
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

  const openProductDetails = async (product) => {
    setSelectedProduct(mergeProductDetails(product));
    setProductDialogTab("specifications");
    setModalQuantity(1);
    setProductDialogOpen(true);

    if (!product?._id) return;

    try {
      const response = await productsAPI.getById(product._id);
      setSelectedProduct((current) => (
        current?._id === product._id ? mergeProductDetails({ ...current, ...(response.data.data || {}) }) : current
      ));
    } catch (error) {
      console.error("Error loading product details:", error);
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
        {filteredProducts.map((product) => {
          const priceLabel = Number(product.srp ?? product.price).toLocaleString();
          const stockLabel = getProductStock(product);
          const tagLabel = product.category || "Saver";
          const lowStock = stockLabel > 0 && stockLabel <= 3;

          return (
            <Card
              key={product._id}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              onClick={() => openProductDetails(product)}
            >
              <CardContent className="px-6 py-7">
                <div className="mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-[2rem] bg-slate-100 shadow-sm">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.productName || product.name}
                      className="h-full w-full rounded-[2rem] object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-14 w-14 text-slate-400" />
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="text-xl font-semibold text-slate-900">{product.productName || product.name}</div>
                  <Badge className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                    <Star className="h-3 w-3" />
                    {tagLabel}
                  </Badge>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">PHP {priceLabel}</div>
                    <div className={`mt-1 text-xs ${stockLabel <= 0 ? "text-rose-600" : lowStock ? "text-amber-600" : "text-emerald-600"}`}>
                      {stockLabel <= 0 ? "Out of stock" : lowStock ? `Only ${stockLabel} left` : `${stockLabel} in stock`}
                    </div>
                  </div>
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
            setModalQuantity(1);
          }
          setProductDialogOpen(open);
        }}
      >
        {selectedProduct && (
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl overflow-hidden bg-white p-0 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex flex-col lg:grid lg:grid-cols-[220px_1fr] gap-6 overflow-y-auto flex-1 p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-[220px] aspect-square flex items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.productName || selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    <Star className="h-3 w-3" />
                    {selectedProduct.category || "Product"}
                  </span>
                  
                  <h2 className="text-2xl font-bold leading-tight text-slate-950">
                    {selectedProduct.productName || selectedProduct.name}
                  </h2>

                  <div className="flex items-baseline gap-3">
                    <div className="text-2xl font-bold text-slate-900">
                      PHP {Number(selectedProduct.srp ?? selectedProduct.price).toLocaleString()}
                    </div>
                    <div className={`text-sm font-medium ${
                      getProductStock(selectedProduct) <= 0
                        ? "text-rose-600"
                        : getProductStock(selectedProduct) <= 3
                          ? "text-rose-600"
                          : "text-emerald-600"
                    }`}>
                      {getProductStock(selectedProduct) <= 0
                        ? "Out of stock"
                        : getProductStock(selectedProduct) <= 3
                          ? `Only ${getProductStock(selectedProduct)} left`
                          : `${getProductStock(selectedProduct)} in stock`}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900">Description</h3>
                    <p className="text-sm leading-6 text-slate-600">
                      {selectedProduct.description || "The best product for reliable performance and long-term durability."}
                    </p>
                  </div>
                </div>

                <Tabs value={productDialogTab} onValueChange={setProductDialogTab} className="space-y-5 border-t border-slate-200 pt-4">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-5">
                    <TabsTrigger value="specifications" className="text-xs">Specifications</TabsTrigger>
                    <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
                    <TabsTrigger value="compatibility" className="text-xs">Compatibility</TabsTrigger>
                    <TabsTrigger value="warranty" className="text-xs">Warranty</TabsTrigger>
                  </TabsList>

                  <TabsContent value="specifications" className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line mt-6">
                    {hasText(selectedProduct.specifications)
                      ? selectedProduct.specifications
                      : "No specifications have been added for this product yet."}
                  </TabsContent>

                  <TabsContent value="features" className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm mt-6">
                    {normalizeFeatures(selectedProduct.features).length > 0 ? (
                      <ul className="space-y-2">
                        {normalizeFeatures(selectedProduct.features).map((feature, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="mt-0.5 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-700">No features have been added for this product yet.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="compatibility" className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line mt-6">
                    {hasText(selectedProduct.compatibility)
                      ? selectedProduct.compatibility
                      : "No compatibility details have been added for this product yet."}
                  </TabsContent>

                  <TabsContent value="warranty" className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line mt-6">
                    {hasText(selectedProduct.warranty)
                      ? selectedProduct.warranty
                      : "No warranty details have been added for this product yet."}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 w-fit">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={modalQuantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{modalQuantity}</span>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  onClick={() => handleQuantityChange(1)}
                  disabled={modalQuantity >= getProductStock(selectedProduct)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                className="w-full sm:w-auto justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => handleAddToCart(selectedProduct)}
                disabled={getProductStock(selectedProduct) <= 0}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
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
