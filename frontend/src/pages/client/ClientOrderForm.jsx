import { useState } from "react";
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
  gcash: "Online Transfer",
  maya: "Online Transfer",
  bank: "Online Transfer",
  cod: "Cash on Delivery",
};

const isBackendProductId = (id) => !String(id).startsWith("fallback-");

export default function ClientOrderForm({ selectedPackage }) {
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState(user?.address || "");
  const [contact, setContact] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const calculateTotal = () => {
    if (selectedPackage) {
      return selectedPackage.price || 0;
    }

    return cart.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity;
    }, 0);
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
    setProofOfPayment(null);
    setSpecialInstructions("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedPackage && cart.length === 0) {
      toast.error("Please add at least one item to your order");
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
    if (!referenceNumber) {
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
      const orderItemsForAPI = cart.map(item => ({
        productId: item._id,
        quantity: item.quantity
      }));
      
      await ordersAPI.create({
        customerId: user?.id,
        fullName: name,
        contactNumber: contact,
        email,
        address,
        paymentMethod: paymentMethodMap[paymentMethod],
        referenceNumber,
        packageId: selectedPackage?._id,
        items: selectedPackage ? [] : orderItemsForAPI,
        notes: specialInstructions,
      });

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
                  <CardDescription>Items from your cart</CardDescription>
                </div>
                <Badge variant="secondary">
                  {cart.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items in cart. Browse products to add items.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const subtotal = (item.price || 0) * item.quantity;

                  return (
                    <div
                      key={item._id}
                      className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <Label>Product</Label>
                        <div className="font-medium">
                          {item.name || item.productName}
                        </div>
                      </div>

                      <div className="w-full md:w-32 space-y-2">
                        <Label>Quantity</Label>
                        <div className="text-xl font-semibold text-center">
                          {item.quantity}
                        </div>
                      </div>

                      <div className="w-full md:w-32 flex items-end">
                        <div className="w-full">
                          <Label>Subtotal</Label>
                          <div className="text-xl font-semibold">
                            PHP {subtotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
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
            <CardDescription>Select your payment method and upload proof</CardDescription>
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
              <Label htmlFor="referenceNumber">Reference Number *</Label>
              <Input
                id="referenceNumber"
                placeholder="Enter transaction reference number"
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.target.value)}
                required
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
