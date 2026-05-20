import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ImageIcon, Package, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { productsAPI } from "../../utils/api.js";
import { imageFileToDataUrl } from "../../utils/imageFile.js";

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
      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        price,
        srp: price,
        imageUrl: formData.imageUrl || undefined,
        stockLevel,
        minStock,
      };

      if (editingId) {
        await productsAPI.update(editingId, payload);
        toast.success("Product updated");
      } else {
        await productsAPI.create(payload);
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

  const filteredInventory = products.filter((item) => {
    const matchesSearch = [item.productName, item.sku, item.category, item.supplier, item.description]
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

  if (loading) {
    return <div className="p-6">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl mb-2">Inventory Monitoring</h1>
          <p className="text-gray-500">Track and manage stock levels</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData(emptyForm);
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-3xl mt-2">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-3xl mt-2">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Stock Value</p>
            <p className="text-3xl mt-2">PHP {totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-3xl mt-2">{categoryList.length}</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item._id} className="flex justify-between items-center">
                  <span className="text-orange-900">{item.productName}</span>
                  <Badge variant="outline" className="border-orange-300 text-orange-800">
                    {item.stockLevel} left (Min: {getMinStock(item)})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
            >
              <option value="all">All categories</option>
              {categoryList.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={() => fetchProducts(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Items ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Picture</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">SKU</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Category</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4 hidden sm:table-cell">Price</th>
                  <th className="text-left py-3 px-4 hidden xl:table-cell">Supplier</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const stockState = getStockState(item);
                  const isLowStock = stockState !== "stocked";
                  return (
                    <tr key={item._id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div>
                          <p>{item.productName}</p>
                          <p className="text-xs text-gray-500 md:hidden">{item.sku || "No SKU"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="h-12 w-16 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
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
                        <span className={isLowStock ? "text-orange-600" : ""}>{item.stockLevel}</span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">PHP {Number(item.price).toLocaleString()}</td>
                      <td className="py-3 px-4 hidden xl:table-cell">{item.supplier || "-"}</td>
                      <td className="py-3 px-4">
                        {isLowStock ? (
                          <Badge className={stockState === "out" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}>
                            {stockState === "out" ? "Out of Stock" : "Low Stock"}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">In Stock</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
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
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="Enter product name"
                value={formData.productName}
                onChange={(event) => setFormData({ ...formData, productName: event.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Picture URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/product.jpg"
                value={formData.imageUrl}
                onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })}
              />
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
                className="mt-3 h-36 w-full rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center relative group"
              >
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
                <span className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-sm">
                  Choose product picture
                </span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="SKU-001"
                  value={formData.sku}
                  onChange={(event) => setFormData({ ...formData, sku: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.stockLevel}
                  onChange={(event) => setFormData({ ...formData, stockLevel: event.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="0"
                  value={formData.minStock}
                  onChange={(event) => setFormData({ ...formData, minStock: event.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (PHP)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="Supplier name"
                  value={formData.supplier}
                  onChange={(event) => setFormData({ ...formData, supplier: event.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add supplier notes, product specs, or restock reminders"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              />
            </div>
            <Button className="w-full" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
