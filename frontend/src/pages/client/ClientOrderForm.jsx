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
import { Textarea } from "../../components/ui/textarea.jsx";
import PaymentDetailsModal from "../../components/ui/PaymentDetailsModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { ordersAPI } from "../../utils/api.js";

const paymentOptions = [
  { value: "gcash", label: "GCash" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const paymentMethodMap = {
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
};

const isBackendProductId = (id) => !String(id).startsWith("fallback-");
const getCartItemStock = (item) => Number(item?.stockLevel ?? item?.stock ?? 0);
const getPackageProduct = (item) => (
  item?.productId && typeof item.productId === "object" ? item.productId : null
);
const getPackageItemName = (item) => getPackageProduct(item)?.productName || item?.name || "Package item";
const getPackageItemPrice = (item) => Number(getPackageProduct(item)?.srp ?? getPackageProduct(item)?.price ?? 0);
const getPackageItemStock = (item) => Number(getPackageProduct(item)?.stockLevel ?? 0);

export default function ClientOrderForm({ selectedPackage, onCancelPackage }) {
  const { user } = useAuth();
  const { cart, clearCart, updateQuantity, removeFromCart } = useCart();
  const [selectedIds, setSelectedIds] = useState(() => cart.map((item) => item._id));
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState(user?.address || "");
  const [contact, setContact] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].value);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
  };

  const openPaymentModal = () => setIsPaymentModalOpen(true);
  const closePaymentModal = () => setIsPaymentModalOpen(false);
  const handlePaymentModalConfirm = () => {
    closePaymentModal();
  };

  const selectedCartItems = cart.filter((item) => selectedIds.includes(item._id));
  const allSelected = cart.length > 0 && selectedCartItems.length === cart.length;
  const selectedPackageItems = Array.isArray(selectedPackage?.items) ? selectedPackage.items : [];

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

  const calculateCartBaseTotal = () => selectedCartItems.reduce((total, item) => {
    const basePrice = Number(item.srp ?? item.price ?? 0);
    return total + basePrice * item.quantity;
  }, 0);

  const calculateMembershipDiscount = () => {
    if (selectedPackage) return 0;
    if (user?.memberRole !== "Member") return 0;

    const baseTotal = calculateCartBaseTotal();
    const discountedTotal = calculateTotal();
    return Math.max(0, baseTotal - discountedTotal);
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

  const resetForm = () => {
    clearCart();
    setName(user?.name || "");
    setAddress(user?.address || "");
    setContact(user?.phone || "");
    setEmail(user?.email || "");
    setPaymentMethod(paymentOptions[0].value);
    setReferenceNumber("");
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
    if ((paymentMethod === "gcash" || paymentMethod === "bank_transfer") && !referenceNumber) {
      toast.error(
        `Please enter the payment reference number for ${paymentMethod === "gcash" ? "GCash" : "Bank Transfer"}`
      );
      return;
    }
    if (selectedPackage) {
      const hasInventoryItems = selectedPackageItems.some((item) => item.productId);
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
      
      // Determine order type
      let orderType = "products"; // default
      if (selectedPackage) {
        orderType = "package"; // package deal order
      }
      
      const response = await ordersAPI.create({
        customerId: user?.id,
        fullName: name,
        contactNumber: contact,
        email,
        address,
        paymentMethod: paymentMethodMap[paymentMethod],
        referenceNumber,
        packageId: selectedPackage?._id,
        items: selectedPackage ? [] : orderItemsForAPI,
        orderType,
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
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">Place an Order</h2>
        <p className="text-gray-600">Fill out the form below to place your order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {selectedPackage && (
          <Card className="border-blue-500 border-2 bg-blue-50">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Selected Package
                  </CardTitle>
                  <CardDescription>You have selected a package deal</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">Package Deal</Badge>
                  {onCancelPackage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onCancelPackage}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6">
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-blue-900">{selectedPackage.name}</h3>
                <p className="text-gray-700">{selectedPackage.description}</p>
                <div className="text-2xl font-bold text-blue-600">
                  PHP {(selectedPackage.price || 0).toLocaleString()}
                </div>

                <div className="rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-900">Products in this package</h4>
                    <Badge variant="secondary">{selectedPackageItems.length} items</Badge>
                  </div>

                  {selectedPackageItems.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPackageItems.map((item, index) => {
                        const product = getPackageProduct(item);
                        const itemName = getPackageItemName(item);
                        const itemPrice = getPackageItemPrice(item);
                        const quantity = Number(item.quantity || 1);
                        const stockLevel = getPackageItemStock(item);

                        return (
                          <div
                            key={`${product?._id || itemName}-${index}`}
                            className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_auto]"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{itemName}</p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span>Quantity: {quantity}</span>
                                {itemPrice > 0 && <span>Unit price: PHP {itemPrice.toLocaleString()}</span>}
                                {stockLevel > 0 && <span>{stockLevel} in stock</span>}
                              </div>
                            </div>
                            <div className="text-left font-semibold text-blue-700 sm:text-right">
                              x{quantity}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No products are listed for this package yet.</p>
                  )}
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
                <div className="space-y-4">
                  <div className="hidden md:block rounded-3xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full border-collapse text-left">
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
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 h-10">
                                  <button
                                    type="button"
                                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                                    onClick={() => updateQuantity(item._id, -1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-12 text-center text-sm font-semibold flex-shrink-0 leading-none">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
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

                  <div className="grid gap-4 md:hidden">
                    {cart.map((item) => {
                      const subtotal = (item.price || 0) * item.quantity;
                      const stockLevel = getCartItemStock(item);

                      return (
                        <div key={item._id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {item.name || item.productName}
                              </div>
                              {item.category && (
                                <div className="mt-1 text-xs text-gray-500">{item.category}</div>
                              )}
                              {stockLevel > 0 && (
                                <div className="mt-1 text-xs text-gray-500">{stockLevel} in stock</div>
                              )}
                            </div>
                            <div className="text-right text-sm font-semibold text-blue-600">
                              PHP {Number(item.price || 0).toLocaleString()}
                            </div>
                          </div>

                              <div className="mt-3 grid gap-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
                              <span className="font-medium text-gray-700">Quantity</span>
                              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 h-10">
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                                  onClick={() => updateQuantity(item._id, -1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-12 text-center text-sm font-semibold flex-shrink-0 leading-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                                  onClick={() => updateQuantity(item._id, 1)}
                                  disabled={stockLevel > 0 && item.quantity >= stockLevel}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-semibold text-blue-600">PHP {subtotal.toLocaleString()}</span>
                            </div>
                            <button
                              type="button"
                              className="w-full rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                              onClick={() => removeFromCart(item._id)}
                            >
                              Remove item
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
              <Label htmlFor="instructions">Notes</Label>
              <Textarea
                id="instructions"
                placeholder="Any special instructions for delivery..."
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
            <CardDescription>Select your payment method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(event) => handlePaymentMethodChange(event.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {paymentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {(paymentMethod === "gcash" || paymentMethod === "bank_transfer") && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={openPaymentModal}
                >
                  View {paymentMethod === "gcash" ? "GCash" : "Bank Transfer"} payment details
                </Button>
                <p className="text-sm text-gray-600">
                  After sending payment, add the reference number in the modal and submit your order.
                </p>
                {referenceNumber && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                    <span className="font-medium">Reference Number:</span> {referenceNumber}
                  </div>
                )}
              </div>
            )}

            <PaymentDetailsModal
              open={isPaymentModalOpen}
              onClose={closePaymentModal}
              paymentMethod={paymentMethod}
              referenceNumber={referenceNumber}
              onReferenceNumberChange={setReferenceNumber}
              onConfirm={handlePaymentModalConfirm}
            />

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
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Fee:</span>
              <span>To be collected by courier</span>
            </div>
            {user?.memberRole === "Member" && !selectedPackage && calculateMembershipDiscount() > 0 && (
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Member discount:</span>
                <span>-PHP {calculateMembershipDiscount().toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-4 flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span className="text-blue-600">PHP {calculateTotal().toLocaleString()}</span>
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
