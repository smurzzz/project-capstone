import { useState, useEffect } from "react";
import { ImageIcon, Search, ShoppingCart, Plus, Minus, Star } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
} from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { VisuallyHidden } from "../../components/ui/visually-hidden.jsx";
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
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const getProductStock = (product) => Number(product?.stockLevel ?? product?.stock ?? 0);
const normalizeFeatures = (features) => {
  if (Array.isArray(features)) return features.filter(Boolean);
  const raw = String(features || "").trim();
  return raw ? raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
};
const hasText = (value) => String(value || "").trim().length > 0;

const getMemberPrice = (product, memberRole) => {
  const basePrice = Number(product.srp ?? product.price);

  if (memberRole === "Member") {
    const discountedPrice = Math.floor(basePrice * 0.60);
    return discountedPrice;
  }

  return basePrice;
};

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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("DEBUG - User memberRole:", user?.memberRole);
  }, [user]);

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
          <h2 className="text-2xl font-bold sm:text-3xl">Browse Products</h2>
          <p className="text-gray-600">Find the perfect electrical products for your needs</p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 mx-auto max-w-7xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Browse Products</h2>
          <p className="text-gray-600">Find the perfect electrical products for your needs</p>
        </div>
        {getTotalItems() > 0 && (
          <Badge variant="secondary" className="text-sm">
            {getTotalItems()} items in cart
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="flex min-h-20 items-center px-4 py-3">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-full">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {filteredProducts.map((product) => {
          const isMember = user?.memberRole === "Member";
          const basePrice = Number(product.srp ?? product.price);
          const displayPrice = getMemberPrice(product, user?.memberRole);
          const priceLabel = Number(displayPrice).toLocaleString();
          const originalPriceLabel = Number(basePrice).toLocaleString();
          const stockLabel = getProductStock(product);
          const getMinStock = (p) => Number(p?.minStock ?? 0);
          const minStock = getMinStock(product);
          const tagLabel = product.category || "Saver";
          const lowStock =
            stockLabel > 0 && (minStock > 0 ? stockLabel <= minStock : stockLabel <= 3);

          return (
            <Card
              key={product._id}
              className="h-full min-h-[30rem] flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              onClick={() => openProductDetails(product)}
            >
              <CardContent className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
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
                <div className="flex-1 flex flex-col justify-between">
                  <div className="mt-6 space-y-3">
                  <div className="text-xl font-semibold text-slate-900">{product.productName || product.name}</div>
                  <Badge className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                    <Star className="h-3 w-3" />
                    {tagLabel}
                  </Badge>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    {isMember ? (
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-emerald-600">PHP {priceLabel}</div>
                        <div className="text-sm text-slate-500 line-through">PHP {originalPriceLabel}</div>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-slate-900">PHP {priceLabel}</div>
                    )}
                    <div className="mt-1 text-xs">
                      {stockLabel <= 0 ? (
                        <Badge variant="destructive">Out of stock</Badge>
                      ) : lowStock ? (
                        <Badge className="bg-rose-50 text-rose-700">Only {stockLabel} left</Badge>
                      ) : (
                        <span className="text-emerald-600">{stockLabel} in stock</span>
                      )}
                    </div>
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
            <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>{selectedProduct.productName || selectedProduct.name}</DialogTitle>
              </VisuallyHidden>
            </DialogHeader>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
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
                    <div className="space-y-1">
                    {user?.memberRole === "Member" ? (
                      <>
                        <div className="text-2xl font-bold text-emerald-600">
                          PHP {Number(getMemberPrice(selectedProduct, user?.memberRole)).toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 line-through">
                          PHP {Number(selectedProduct.srp ?? selectedProduct.price).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-slate-900">
                        PHP {Number(getMemberPrice(selectedProduct, user?.memberRole)).toLocaleString()}
                      </div>
                    )}
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
          </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
