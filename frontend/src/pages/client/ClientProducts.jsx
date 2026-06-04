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
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[960px] overflow-hidden bg-white p-0 shadow-2xl">
            <div className="grid max-h-[88vh] gap-5 overflow-y-auto p-5 lg:grid-cols-[340px_1fr]">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-slate-100 lg:aspect-auto lg:min-h-[320px]">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.productName || selectedProduct.name}
                    className="h-full w-full rounded-[2rem] object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                    <Star className="h-3 w-3" />
                    {selectedProduct.category || "Appliance Protection"}
                  </span>
                  <div className="text-3xl font-semibold leading-tight tracking-tight text-slate-950">
                    {selectedProduct.productName || selectedProduct.name}
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-3xl font-bold text-slate-900">
                        PHP {Number(selectedProduct.srp ?? selectedProduct.price).toLocaleString()}
                      </div>
                      <div className={`mt-1 text-xs ${
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
                  <div className="max-h-20 overflow-y-auto pr-2 text-sm leading-6 text-slate-600">
                    {selectedProduct.description || "The best product for reliable performance and long-term durability."}
                  </div>
                </div>

                <Tabs value={productDialogTab} onValueChange={setProductDialogTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="specifications">Specifications</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                    <TabsTrigger value="warranty">Warranty</TabsTrigger>
                  </TabsList>

                  <TabsContent value="specifications" className="h-44 overflow-y-auto rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:h-40">
                    <div className="whitespace-pre-line text-sm leading-7 text-slate-700">
                      {hasText(selectedProduct.specifications)
                        ? selectedProduct.specifications
                        : "No specifications have been added for this product yet."}
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="h-44 overflow-y-auto rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:h-40">
                    {normalizeFeatures(selectedProduct.features).length > 0 ? (
                      <ul className="space-y-3 text-sm leading-7 text-slate-700">
                        {normalizeFeatures(selectedProduct.features).map((feature, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-7 text-slate-700">No features have been added for this product yet.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="compatibility" className="h-44 overflow-y-auto rounded-[2rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 sm:h-40">
                    <div className="whitespace-pre-line">
                      {hasText(selectedProduct.compatibility)
                        ? selectedProduct.compatibility
                        : "No compatibility details have been added for this product yet."}
                    </div>
                  </TabsContent>

                  <TabsContent value="warranty" className="h-44 overflow-y-auto rounded-[2rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 space-y-3 sm:h-40">
                    <div className="whitespace-pre-line">
                      {hasText(selectedProduct.warranty)
                        ? selectedProduct.warranty
                        : "No warranty details have been added for this product yet."}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={modalQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-14 text-center text-sm font-semibold">{modalQuantity}</span>
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                      onClick={() => handleQuantityChange(1)}
                      disabled={modalQuantity >= getProductStock(selectedProduct)}
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
