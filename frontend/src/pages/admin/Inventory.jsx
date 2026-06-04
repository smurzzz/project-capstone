import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Boxes,
  ImageIcon,
  Package,
  Pencil,
  PhilippinePeso,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { productsAPI } from "../../utils/api.js";
import { imageFileToDataUrl } from "../../utils/imageFile.js";
import { mergeProductDetails, mergeProductsDetails, saveProductDetails } from "../../utils/productDetailsStore.js";

const emptyForm = {
  productName: "",
  sku: "",
  price: "",
  imageUrl: "",
  stockLevel: "",
  minStock: "",
  description: "",
  category: "",
  supplier: "",
  specifications: "",
  features: "",
  compatibility: "",
  warranty: "",
};

const formatMoney = (value) => `PHP ${Number(value || 0).toLocaleString()}`;

const stockBadgeClass = {
  out: "bg-red-100 text-red-700 border-red-200",
  low: "bg-amber-100 text-amber-700 border-amber-200",
  stocked: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const stockLabel = {
  out: "Out of Stock",
  low: "Low Stock",
  stocked: "In Stock",
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const imageInputRef = useRef(null);

  async function fetchProducts(showSpinner = false) {
    try {
      if (showSpinner) setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(mergeProductsDetails(response.data.data || []));
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const productName = formData.productName.trim();
    const price = Number(formData.price);
    const stockLevel = Number(formData.stockLevel);
    const minStock = Number(formData.minStock || 0);

    if (!productName) {
      toast.error("Product name is required");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid product price");
      return;
    }

    if (!Number.isInteger(stockLevel) || stockLevel < 0) {
      toast.error("Quantity must be a whole number");
      return;
    }

    if (!Number.isInteger(minStock) || minStock < 0) {
      toast.error("Minimum stock must be a whole number");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        productName,
        sku: formData.sku.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        category: formData.category.trim(),
        description: formData.description.trim(),
        specifications: formData.specifications.trim(),
        features: formData.features.trim(),
        compatibility: formData.compatibility.trim(),
        warranty: formData.warranty.trim(),
        price,
        srp: price,
        imageUrl: formData.imageUrl || undefined,
        stockLevel,
        minStock,
      };

      if (editingId) {
        const response = await productsAPI.update(editingId, payload);
        const savedProduct = { ...(response.data.data || {}), ...payload, _id: editingId };
        saveProductDetails(savedProduct);
        setProducts((current) => current.map((item) => (item._id === editingId ? { ...item, ...savedProduct } : item)));
        toast.success("Product updated");
      } else {
        const response = await productsAPI.create(payload);
        const savedProduct = response.data.data ? { ...response.data.data, ...payload, _id: response.data.data._id } : null;
        if (savedProduct) {
          saveProductDetails(savedProduct);
          setProducts((current) => [...current, savedProduct]);
        }
        toast.success("Product added");
      }

      setDialogOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete ${item.productName}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(item._id);
    try {
      await productsAPI.delete(item._id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    imageFileToDataUrl(file)
      .then((imageUrl) => setFormData((current) => ({ ...current, imageUrl })))
      .catch((error) => toast.error(error.message));
  };

  const openEditDialog = async (item) => {
    setEditingId(item._id);
    setFormData({
      productName: item.productName,
      sku: item.sku || "",
      price: item.price,
      imageUrl: item.imageUrl || "",
      stockLevel: item.stockLevel,
      minStock: item.minStock || "",
      description: item.description || "",
      category: item.category || "",
      supplier: item.supplier || "",
      specifications: item.specifications || "",
      features: item.features || "",
      compatibility: item.compatibility || "",
      warranty: item.warranty || "",
    });
    setDialogOpen(true);

    try {
      const response = await productsAPI.getById(item._id);
      const product = mergeProductDetails(response.data.data || item);
      setFormData((current) => ({
        ...current,
        productName: product.productName || "",
        sku: product.sku || "",
        price: product.price ?? product.srp ?? "",
        imageUrl: product.imageUrl || "",
        stockLevel: product.stockLevel ?? "",
        minStock: product.minStock || "",
        description: product.description || "",
        category: product.category || "",
        supplier: product.supplier || "",
        specifications: product.specifications || "",
        features: product.features || "",
        compatibility: product.compatibility || "",
        warranty: product.warranty || "",
      }));
    } catch (error) {
      console.error("Error loading product details:", error);
      toast.error("Could not refresh product details. Showing current inventory data.");
    }
  };

  const filteredInventory = products.filter((item) => {
    const matchesSearch = [item.productName, item.sku, item.category, item.supplier, item.description, item.specifications, item.features, item.compatibility, item.warranty]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getMinStock = (item) => Number(item.minStock || 0);
  const getStockState = (item) => {
    if (Number(item.stockLevel || 0) === 0) return "out";
    if (getMinStock(item) > 0 && Number(item.stockLevel || 0) <= getMinStock(item)) return "low";
    return "stocked";
  };
  const lowStockItems = products.filter((item) => getStockState(item) !== "stocked");
  const totalValue = products.reduce((sum, item) => sum + Number(item.stockLevel || 0) * Number(item.price || 0), 0);
  const categoryList = [...new Set(products.map((item) => item.category).filter(Boolean))].sort();
  const formStock = Number(formData.stockLevel || 0);
  const formPrice = Number(formData.price || 0);
  const formMinStock = Number(formData.minStock || 0);
  const formStockValue = formStock * formPrice;

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
          <p className="font-medium text-slate-700">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <Boxes className="h-3.5 w-3.5" />
            Stock Control
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Inventory Monitoring</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Track product availability, reorder thresholds, suppliers, and catalog details in one workspace.
          </p>
        </div>
        <Button
          className="h-11 gap-2 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800"
          onClick={() => {
            setEditingId(null);
            setFormData(emptyForm);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Items</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{products.length}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{lowStockItems.length}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Stock Value</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{formatMoney(totalValue)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <PhilippinePeso className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Categories</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{categoryList.length}</p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                <Tags className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item._id} className="flex justify-between items-center">
                  <span className="text-amber-950">{item.productName}</span>
                  <Badge variant="outline" className="border-amber-300 text-amber-800">
                    {item.stockLevel} left (Min: {getMinStock(item)})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-10"
            />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All categories</option>
              {categoryList.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => fetchProducts(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>All Items ({filteredInventory.length})</span>
            <Badge variant="secondary" className="rounded-full">
              {lowStockItems.length} needs attention
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">Picture</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">SKU</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">Category</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Price</th>
                  <th className="hidden px-4 py-3 text-left xl:table-cell">Supplier</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const stockState = getStockState(item);
                  const isLowStock = stockState !== "stocked";
                  return (
                    <tr key={item._id} className="border-b bg-white last:border-0 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.productName}</p>
                          <p className="text-xs text-gray-500 md:hidden">{item.sku || "No SKU"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="h-14 w-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-1" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">{item.sku || "-"}</td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <Badge variant="outline">{item.category || "Uncategorized"}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={isLowStock ? "font-semibold text-amber-600" : "font-semibold text-slate-900"}>{item.stockLevel}</span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">{formatMoney(item.price)}</td>
                      <td className="py-3 px-4 hidden xl:table-cell">{item.supplier || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${stockBadgeClass[stockState]} border`}>
                          {stockLabel[stockState]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                            disabled={deletingId === item._id}
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            {deletingId === item._id ? "Deleting" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={9}>
                      No inventory items match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto bg-white p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </span>
              {editingId ? "Edit Inventory Item" : "Add New Inventory Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-0 lg:grid-cols-[360px_1fr]">
            <div className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageFile}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white shadow-sm"
              >
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="" className="h-full w-full object-contain p-5" />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="mx-auto mb-3 h-12 w-12" />
                    <span className="text-sm font-medium">Upload product image</span>
                  </div>
                )}
                <span className="absolute inset-x-4 bottom-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  <Upload className="h-4 w-4" />
                  Choose picture
                </span>
              </button>

              <div className="mt-5 space-y-2">
                <Label htmlFor="imageUrl">Picture URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/product.jpg"
                  value={formData.imageUrl}
                  onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })}
                  className="rounded-2xl bg-white"
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Stock</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{Number.isFinite(formStock) ? formStock : 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Value</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{formatMoney(formStockValue)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-950">Product Details</h3>
                  <p className="text-sm text-slate-500">Name, SKU, category, and supplier information.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter product name"
                      value={formData.productName}
                      onChange={(event) => setFormData({ ...formData, productName: event.target.value })}
                      required
                      className="mt-2 rounded-2xl"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        placeholder="SKU-001"
                        value={formData.sku}
                        onChange={(event) => setFormData({ ...formData, sku: event.target.value })}
                        className="mt-2 rounded-2xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="Lighting, Electrical, Accessories"
                        value={formData.category}
                        onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                        className="mt-2 rounded-2xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="Supplier name"
                      value={formData.supplier}
                      onChange={(event) => setFormData({ ...formData, supplier: event.target.value })}
                      className="mt-2 rounded-2xl"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-950">Stock and Pricing</h3>
                  <p className="text-sm text-slate-500">Set quantity, reorder trigger, and selling price.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.stockLevel}
                      onChange={(event) => setFormData({ ...formData, stockLevel: event.target.value })}
                      required
                      className="mt-2 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Min Stock</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.minStock}
                      onChange={(event) => setFormData({ ...formData, minStock: event.target.value })}
                      className="mt-2 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (PHP)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                      required
                      className="mt-2 rounded-2xl"
                    />
                  </div>
                </div>
                {formMinStock > 0 && formStock <= formMinStock && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    This item will be flagged as low stock at the current quantity.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add supplier notes, product specs, or restock reminders"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="mt-2 min-h-28 rounded-2xl"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="specifications">Specifications</Label>
                    <Textarea
                      id="specifications"
                      placeholder="Enter product specifications (dimensions, voltage, capacity, etc.)"
                      value={formData.specifications}
                      onChange={(event) => setFormData({ ...formData, specifications: event.target.value })}
                      className="mt-2 min-h-24 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="features">Features</Label>
                    <Textarea
                      id="features"
                      placeholder="Enter product features, one per line"
                      value={formData.features}
                      onChange={(event) => setFormData({ ...formData, features: event.target.value })}
                      className="mt-2 min-h-24 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="compatibility">Compatibility</Label>
                    <Textarea
                      id="compatibility"
                      placeholder="Describe compatibility details"
                      value={formData.compatibility}
                      onChange={(event) => setFormData({ ...formData, compatibility: event.target.value })}
                      className="mt-2 min-h-24 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="warranty">Warranty</Label>
                    <Textarea
                      id="warranty"
                      placeholder="Enter warranty terms"
                      value={formData.warranty}
                      onChange={(event) => setFormData({ ...formData, warranty: event.target.value })}
                      className="mt-2 min-h-24 rounded-2xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
