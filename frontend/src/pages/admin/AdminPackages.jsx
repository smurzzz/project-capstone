import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Edit, ImageIcon, PackagePlus, Plus, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { packagesAPI, productsAPI } from "../../utils/api.js";
import { imageFileToDataUrl } from "../../utils/imageFile.js";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  imageUrl: "",
  isPopular: false,
  isActive: true,
  items: [{ productId: "", name: "", quantity: 1 }],
};

const toPackageForm = (packageDeal) => ({
  name: packageDeal.name || "",
  description: packageDeal.description || "",
  price: packageDeal.price || "",
  originalPrice: packageDeal.price || "",
  imageUrl: packageDeal.imageUrl || "",
  isPopular: Boolean(packageDeal.isPopular),
  isActive: Boolean(packageDeal.isActive),
  items: packageDeal.items?.length
    ? packageDeal.items.map((item) => ({
        productId: item.productId?._id || item.productId || "",
        name: item.name || item.productId?.productName || "",
        quantity: item.quantity || 1,
      }))
    : [{ productId: "", name: "", quantity: 1 }],
});

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product._id, product])),
    [products]
  );

  async function fetchData() {
    try {
      const [packagesResponse, productsResponse] = await Promise.all([
        packagesAPI.getAll(true),
        productsAPI.getAll(),
      ]);
      setPackages(packagesResponse.data.data || []);
      setProducts(productsResponse.data.data || []);
    } catch (error) {
      console.error("Error loading packages:", error);
      toast.error("Failed to load package deals");
    } finally {
      setLoading(false);
    }
  }

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (packageDeal) => {
    setEditingId(packageDeal._id);
    setFormData(toPackageForm(packageDeal));
    setDialogOpen(true);
  };

  const updateItem = (index, updates) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      ),
    }));
  };

  const handleProductSelect = (index, productId) => {
    const product = productMap.get(productId);
    updateItem(index, {
      productId,
      name: product?.productName || "",
    });
  };

  const addItemRow = () => {
    setFormData((current) => ({
      ...current,
      items: [...current.items, { productId: "", name: "", quantity: 1 }],
    }));
  };

  const removeItemRow = (index) => {
    setFormData((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      price: Number(formData.originalPrice),
      items: formData.items
        .filter((item) => item.name || item.productId)
        .map((item) => ({
          productId: item.productId || undefined,
          name: item.name,
          quantity: Number(item.quantity || 1),
        })),
    };

    try {
      if (editingId) {
        await packagesAPI.update(editingId, payload);
        toast.success("Package deal updated");
      } else {
        await packagesAPI.create(payload);
        toast.success("Package deal created");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error(error.response?.data?.message || "Failed to save package deal");
    }
  };

  const handleDelete = async (packageDeal) => {
    if (!window.confirm(`Delete package deal "${packageDeal.name}"?`)) return;

    try {
      await packagesAPI.delete(packageDeal._id);
      toast.success("Package deal deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package deal");
    }
  };

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    imageFileToDataUrl(file)
      .then((imageUrl) => setFormData((current) => ({ ...current, imageUrl })))
      .catch((error) => toast.error(error.message));
  };

  if (loading) {
    return <div className="p-6">Loading package deals...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Package Deals</h1>
          <p className="text-gray-500">Create bundled e-commerce offers with pictures and product items</p>
        </div>
        <Button onClick={openCreateDialog}>
          <PackagePlus className="w-4 h-4 mr-2" />
          New Package
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {packages.map((packageDeal) => (
          <Card key={packageDeal._id}>
            <CardContent className="p-0">
              <div className="grid sm:grid-cols-[180px_1fr]">
                <div className="aspect-[4/3] sm:aspect-auto bg-gray-100 flex items-center justify-center overflow-hidden">
                  {packageDeal.imageUrl ? (
                    <img
                      src={packageDeal.imageUrl}
                      alt={packageDeal.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{packageDeal.name}</h2>
                      <p className="text-sm text-gray-600 line-clamp-2">{packageDeal.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {packageDeal.isPopular && <Badge>Popular</Badge>}
                      <Badge
                        variant="outline"
                        className={packageDeal.isActive ? "border-blue-200 bg-blue-50 text-blue-600" : ""}
                      >
                        {packageDeal.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      PHP {Number(packageDeal.price || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {packageDeal.items?.length || 0} item types included
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(packageDeal)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(packageDeal)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No package deals yet. Create one to show it in the client store.
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Package Deal" : "Create Package Deal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-[1fr_180px] gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="package-name">Package Name</Label>
                  <Input
                    id="package-name"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="package-description">Description</Label>
                  <Textarea
                    id="package-description"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    rows={3}
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center min-h-40 relative group"
              >
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                )}
                <span className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-sm">
                  Choose package picture
                </span>
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="package-original-price">Price</Label>
                <Input
                  id="package-original-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(event) => setFormData({ ...formData, originalPrice: event.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="package-image">Picture URL</Label>
                <Input
                  id="package-image"
                  type="text"
                  value={formData.imageUrl}
                  onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })}
                  placeholder="Click preview to choose a file, or paste an image URL"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageFile}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(event) => setFormData({ ...formData, isPopular: event.target.checked })}
                />
                Mark as popular
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                />
                Visible in store
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Package Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <div key={`${index}-${item.productId}`} className="grid md:grid-cols-[1fr_1fr_90px_44px] gap-2">
                  <Select value={item.productId || "custom"} onValueChange={(value) => handleProductSelect(index, value === "custom" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Linked product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom item name</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(event) => updateItem(index, { name: event.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, { quantity: event.target.value })}
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItemRow(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button className="w-full">{editingId ? "Update Package" : "Create Package"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
