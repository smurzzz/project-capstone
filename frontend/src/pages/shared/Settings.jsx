import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageIcon, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { customersAPI, staffAPI } from "../../utils/api.js";
import { imageFileToDataUrl } from "../../utils/imageFile.js";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    profileImageUrl: user?.profileImageUrl || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Keep the editable form in sync when a different account signs in.
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      profileImageUrl: user?.profileImageUrl || "",
    });
  }, [user]);

  const isCustomer = user?.type === "customer";
  const isStaff = user?.type === "staff";

  const handleProfileFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    imageFileToDataUrl(file, 512)
      .then((imageUrl) => setFormData((current) => ({ ...current, profileImageUrl: imageUrl })))
      .catch((error) => toast.error(error.message));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (isCustomer) {
        const response = await customersAPI.updateMe({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          profileImageUrl: formData.profileImageUrl,
        });
        updateUser(response.data.data);
      } else if (isStaff) {
        await staffAPI.update(user.id, {
          name: formData.name,
          role: user.role,
          phone: formData.phone,
          department: formData.address,
          profileImageUrl: formData.profileImageUrl,
          isActive: true,
        });
        updateUser({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          profileImageUrl: formData.profileImageUrl,
        });
      }

      toast.success("Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Settings</h1>
          <p className="text-gray-500">View and manage your account profile</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center overflow-hidden border group"
                aria-label="Choose profile picture"
              >
                {formData.profileImageUrl ? (
                  <img
                    src={formData.profileImageUrl}
                    alt={user?.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-9 w-9" />
                )}
                <span className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </span>
              </button>
              <div>
                <h2 className="font-semibold">{user?.name || "User"}</h2>
                <p className="text-sm text-gray-500 break-all">{user?.email}</p>
              </div>
                <div className="rounded-md bg-green-50 text-green-700 px-3 py-2 text-sm flex gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5" />
                <span>{isCustomer ? "Member customer account" : `${user?.role || "Staff"} account`}</span>
              </div>
              <div className="rounded-md bg-blue-50 text-blue-700 px-3 py-2 text-sm flex gap-2">
                <ImageIcon className="h-4 w-4 mt-0.5" />
                <span>{formData.profileImageUrl ? "Profile picture added" : "Click the avatar to choose a picture"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={formData.email} disabled />
                  </div>
                </div>

                <div className="grid md:grid-cols-[1fr_120px] gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="profileImageUrl">Profile Picture</Label>
                    <Input
                      id="profileImageUrl"
                      type="text"
                      value={formData.profileImageUrl}
                      onChange={(event) => setFormData({ ...formData, profileImageUrl: event.target.value })}
                      placeholder="Click the preview to choose a file, or paste an image URL"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleProfileFile}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-28 w-28 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center group"
                    aria-label="Choose profile picture"
                  >
                    {formData.profileImageUrl ? (
                      <img
                        src={formData.profileImageUrl}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs">
                      Choose file
                    </span>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                      placeholder="09XX XXX XXXX"
                      required={isCustomer}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={isCustomer ? "Member" : user?.role || "Staff"} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{isCustomer ? "Delivery Address" : "Department / Notes"}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                    required={isCustomer}
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
