import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";
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
import { Label } from "../../components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { ordersAPI } from "../../utils/api.js";

const paymentMethodMap = {
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank Transfer",
  cod: "Cash on Delivery",
};

const onlinePaymentMethods = new Set(["gcash", "maya", "bank"]);

const isBackendProductId = (id) => !String(id).startsWith("fallback-");
const getCartItemStock = (item) => Number(item?.stockLevel ?? item?.stock ?? 0);

export default function ClientOrderForm({ selectedPackage }) {
  const { user } = useAuth();
  const { cart, clearCart, updateQuantity, removeFromCart } = useCart();
  const [selectedIds, setSelectedIds] = useState(() => cart.map((item) => item._id));
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState(user?.address || "");
  const [contact, setContact] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCartItems = cart.filter((item) => selectedIds.includes(item._id));
  const allSelected = cart.length > 0 && selectedCartItems.length === cart.length;

  useEffect(() => {
    setSelectedIds((prev) => {
      const currentIds = new Set(cart.map((item) => item._id));
      const selectedCurrentIds = prev.filter((id) => currentIds.has(id));
      const newlyAddedIds = cart
        .map((item) => item._id)
        .filter((id) => !prev.includes(id));

      return [...selectedCurrentIds, ...newlyAddedIds];
    });
  }, [cart]);

  const calculateTotal = () => {
    if (selectedPackage) {
      return selectedPackage.price || 0;
    }

    return selectedCartItems.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity;
    }, 0);
  };

  const handleToggleSelect = (productId) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(cart.map((item) => item._id));
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setProofOfPayment(event.target.files[0]);
    }
  };

  const resetForm = () => {
    clearCart();
    setName(user?.name || "");
    setAddress(user?.address || "");
    setContact(user?.phone || "");
    setEmail(user?.email || "");
    setPaymentMethod("");
    setReferenceNumber("");
    setPromotionCode("");
    setProofOfPayment(null);
    setSpecialInstructions("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedPackage && selectedCartItems.length === 0) {
      toast.error("Please select at least one item to place your order");
      return;
    }
    if (!name || !address || !contact || !email) {
      toast.error("Please fill in all required delivery information");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (onlinePaymentMethods.has(paymentMethod) && !referenceNumber) {
      toast.error("Please enter a reference number");
      return;
    }
    if (selectedPackage) {
      const hasInventoryItems = selectedPackage.items?.some((item) => item.productId);
      if (!hasInventoryItems) {
        toast.error("This package is not linked to inventory yet. Please contact the store.");
        return;
      }
    }

    if (!selectedPackage && cart.some((item) => !isBackendProductId(item._id))) {
      toast.error("Backend products are unavailable. Please start the server and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const orderItemsForAPI = selectedCartItems.map(item => ({
        productId: item._id,
        quantity: item.quantity
      }));
      
      const response = await ordersAPI.create({
        customerId: user?.id,
        fullName: name,
        contactNumber: contact,
        email,
        address,
        paymentMethod: paymentMethodMap[paymentMethod],
        referenceNumber,
        promotionCode,
        packageId: selectedPackage?._id,
        items: selectedPackage ? [] : orderItemsForAPI,
        notes: specialInstructions,
      });

      const checkoutUrl = response.data?.data?.payment?.checkoutUrl;
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }

      toast.success("Order placed successfully. You will receive a confirmation shortly.");
      resetForm();
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Place an Order</h2>
        <p className="text-gray-600">Fill out the form below to place your order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {selectedPackage && (
          <Card className="border-blue-500 border-2 bg-blue-50">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Selected Package
                  </CardTitle>
                  <CardDescription>You have selected a package deal</CardDescription>
                </div>
                <Badge className="bg-blue-600">Package Deal</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-blue-900">{selectedPackage.name}</h3>
                <p className="text-gray-700">{selectedPackage.description}</p>
                <div className="text-2xl font-bold text-blue-600">
                  PHP {(selectedPackage.price || 0).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedPackage && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>Select the items you want to purchase</CardDescription>
                </div>
                <Badge variant="secondary">
                  {cart.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-x-auto">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items in cart. Browse products to add items.</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="border-b bg-gray-50 text-sm font-semibold text-gray-700">
                        <th className="px-4 py-3">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
                              checked={allSelected}
                              onChange={handleToggleSelectAll}
                            />
                            Select All
                          </label>
                        </th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Subtotal</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => {
                        const subtotal = (item.price || 0) * item.quantity;
                        const isSelected = selectedIds.includes(item._id);
                        const stockLevel = getCartItemStock(item);

                        return (
                          <tr key={item._id} className="border-b last:border-b-0">
                            <td className="px-4 py-4 align-middle">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item._id)}
                              />
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <div className="font-medium text-gray-900">
                                {item.name || item.productName}
                              </div>
                              {item.category && (
                                <div className="text-xs text-gray-500">{item.category}</div>
                              )}
                              {stockLevel > 0 && (
                                <div className="text-xs text-gray-500">{stockLevel} in stock</div>
                              )}
                            </td>
                            <td className="px-4 py-4 align-middle text-gray-900">
                              PHP {Number(item.price || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 align-middle">
                              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                                  onClick={() => updateQuantity(item._id, -1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-10 text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                                  onClick={() => updateQuantity(item._id, 1)}
                                  disabled={stockLevel > 0 && item.quantity >= stockLevel}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-middle font-semibold text-blue-600">
                              PHP {subtotal.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 align-middle text-right">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                                onClick={() => removeFromCart(item._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Order Details / Delivery Information</CardTitle>
            <CardDescription>Enter your delivery details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number *</Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter your complete delivery address..."
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Special Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Any special instructions for delivery or installation..."
                value={specialInstructions}
                onChange={(event) => setSpecialInstructions(event.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Select your payment method and enter the reference when needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gcash">GCash - 09394948484</SelectItem>
                  <SelectItem value="maya">Maya - 09974642626</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">
                Reference Number {onlinePaymentMethods.has(paymentMethod) ? "*" : "(Optional)"}
              </Label>
              <Input
                id="referenceNumber"
                placeholder={onlinePaymentMethods.has(paymentMethod)
                  ? "Enter transaction reference number"
                  : "Leave blank for cash on delivery"}
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.target.value)}
                required={onlinePaymentMethods.has(paymentMethod)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promotionCode">Promo Code (Optional)</Label>
              <Input
                id="promotionCode"
                placeholder="Enter promo code"
                value={promotionCode}
                onChange={(event) => setPromotionCode(event.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proofOfPayment">Upload Proof of Payment (Optional)</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Input
                  id="proofOfPayment"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {proofOfPayment && (
                  <Badge variant="secondary" className="gap-1 w-fit">
                    <Upload className="h-3 w-3" />
                    {proofOfPayment.name}
                  </Badge>
                )}
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200 flex gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <AlertDescription className="text-amber-800">
                <strong>Note:</strong> Delivery fee will be collected separately by courier.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>Subtotal:</span>
              <span>PHP {calculateTotal().toLocaleString()}</span>
            </div>
            {user?.memberRole === "Member" && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Member Discount Estimate:</span>
                <span>- PHP {Math.round(calculateTotal() * 0.1).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Fee:</span>
              <span>To be collected by courier</span>
            </div>
            <div className="border-t pt-4 flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span className="text-blue-600">
                PHP {(user?.memberRole === "Member"
                  ? Math.max(0, calculateTotal() - Math.round(calculateTotal() * 0.1))
                  : calculateTotal()).toLocaleString()}
              </span>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Placing Order..." : "Place Order"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
