import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { membershipAPI, packagesAPI } from "../../utils/api.js";
import logoSrc from "../../assets/logo (1).webp";

const paymentOptions = [
  { value: "gcash", label: "GCash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cod", label: "Cash on Delivery" },
];

const paymentMethodMap = {
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
  cod: "Cash on Delivery",
};

export default function MembershipApplicationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packageDeals, setPackageDeals] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingMembership, setExistingMembership] = useState(null);

  // Form states
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].value);
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch membership status
        const membershipResponse = await membershipAPI.getMyMembership().catch(() => ({ data: { data: { membership: null } } }));
        const membership = membershipResponse.data?.data?.membership;
        setExistingMembership(membership);
        
        // Fetch packages
        const response = await packagesAPI.getAll();
        let packages = response.data?.data || [];
        
        // Filter out packages with "B" in their name
        packages = packages.filter(pkg => !pkg.name.toUpperCase().includes("B"));
        
        // Sort by price from lowest to highest
        packages.sort((a, b) => (a.price || 0) - (b.price || 0));
        
        setPackageDeals(packages);
        
        // Auto-select first package if available
        if (packages.length > 0) {
          setSelectedPackage(packages[0]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load membership packages");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    if (value === "cod") {
      setReferenceNumber("");
    }
  };

  const validateForm = () => {
    if (!fullName || !address || !phoneNumber || !email) {
      toast.error("Please fill in all required personal information");
      return false;
    }
    if (!selectedPackage) {
      toast.error("Please select a membership package");
      return false;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return false;
    }
    if ((paymentMethod === "gcash" || paymentMethod === "bank_transfer") && !referenceNumber) {
      toast.error(
        `Please enter the payment reference number for ${paymentMethod === "gcash" ? "GCash" : "Bank Transfer"}`
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const applicationData = {
        fullName,
        contactNumber: phoneNumber,
        email,
        address,
        packageDealId: selectedPackage._id,
        packageName: selectedPackage.name,
        paymentMethod: paymentMethodMap[paymentMethod],
        referenceNumber,
        additionalInfo,
      };

      await membershipAPI.applyForMembership(applicationData);
      
      toast.success("Membership application submitted successfully!");
      
      // Redirect to membership status page
      setTimeout(() => {
        navigate("/membership/status");
      }, 1000);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(error.response?.data?.message || "Failed to submit membership application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user already has active or pending membership, show View Status button
  if (existingMembership && (existingMembership.status === 'Active' || existingMembership.status === 'Pending')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm mb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <img
                  src={logoSrc}
                  alt="JBM Electro Ventures logo"
                  className="h-10 w-10 rounded-xl bg-white p-1 object-contain"
                />
                <h1 className="text-lg font-bold text-gray-900">
                  JBM Electro Ventures
                </h1>
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Back Home
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Membership Status</h1>
            <p className="text-gray-600">You already have an active or pending membership application.</p>
            <Button
              onClick={() => navigate("/membership/status")}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              View Status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt="JBM Electro Ventures logo"
                className="h-10 w-10 rounded-xl bg-white p-1 object-contain"
              />
              <h1 className="text-lg font-bold text-gray-900">
                JBM Electro Ventures
              </h1>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Back Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Application Details
          </h1>
          <p className="text-gray-600">
            Complete the form below so we can process your membership application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h2>
            <p className="text-sm text-gray-600 mb-6">Please provide your accurate personal details</p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Dimonara"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0983746253"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-gray-700 font-medium">Complete Address *</Label>
                <Textarea
                  id="address"
                  placeholder="cainta rizal"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Choose Package Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Membership Package</h2>
            <p className="text-sm text-gray-600 mb-6">Select a package that suits your needs</p>
            
            {packageDeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No packages available at this time</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Package Dropdown */}
                <div>
                  <Label htmlFor="packageSelect" className="text-gray-700 font-medium">Choose Package *</Label>
                  <select
                    id="packageSelect"
                    value={selectedPackage?._id || ""}
                    onChange={(event) => {
                      const pkg = packageDeals.find(p => p._id === event.target.value);
                      setSelectedPackage(pkg);
                    }}
                    className="w-full mt-2 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {packageDeals.map((pkg) => (
                      <option key={pkg._id} value={pkg._id}>
                        {pkg.name} - PHP {(pkg.price || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Package Details Card */}
                {selectedPackage && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Package Info */}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedPackage.name}</h3>
                        <p className="text-gray-700 mb-4">{selectedPackage.description}</p>
                        
                        {/* Price Display */}
                        <div className="mb-6">
                          <div className="inline-block">
                            <p className="text-sm text-gray-600 font-semibold mb-1">PRICE</p>
                            <p className="text-4xl font-bold text-blue-600">
                              PHP {(selectedPackage.price || 0).toLocaleString()}
                            </p>
                          </div>
                          {selectedPackage.originalPrice && selectedPackage.originalPrice > selectedPackage.price && (
                            <div className="inline-block ml-6">
                              <p className="text-sm text-gray-600 font-semibold mb-1">YOU SAVE</p>
                              <p className="text-2xl font-bold text-green-600">
                                PHP {(selectedPackage.originalPrice - selectedPackage.price).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Package Contents */}
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                            {selectedPackage.items?.length || 0}
                          </span>
                          Items Included
                        </p>
                        
                        <div className="space-y-3">
                          {selectedPackage.items && selectedPackage.items.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                {item.quantity > 1 && (
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <Label htmlFor="additionalInfo" className="text-gray-700 font-medium">Notes</Label>
              <Textarea
                id="additionalInfo"
                placeholder="What interests you most about our membership program? Any questions we should know about?..."
                value={additionalInfo}
                onChange={(event) => setAdditionalInfo(event.target.value)}
                maxLength={500}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">{additionalInfo.length}/500 characters</p>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h2>
            <p className="text-sm text-gray-600 mb-6">Choose how you'd like to pay for your membership package.</p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentMethod" className="text-gray-700 font-medium">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => handlePaymentMethodChange(event.target.value)}
                  className="w-full mt-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {(paymentMethod === "gcash" || paymentMethod === "bank_transfer") && (
                <div>
                  <Label htmlFor="referenceNumber" className="text-gray-700 font-medium">
                    Reference Number *
                  </Label>
                  <Input
                    id="referenceNumber"
                    placeholder={paymentMethod === "gcash"
                      ? "Enter your GCash reference number"
                      : "Enter the bank transfer reference number"}
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
              )}

              <Alert className="bg-blue-50 border-blue-200 mt-4">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  If your selected payment method generates a checkout URL, you will be redirected to complete payment immediately after submitting your application.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800"
            size="lg"
            disabled={submitting || !selectedPackage}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </div>
    </div>
  );
}
