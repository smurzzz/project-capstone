import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageIcon, ShieldCheck, UserRound, Mail, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { customersAPI, staffAPI } from "../../utils/api.js";
import { imageFileToDataUrl } from "../../utils/imageFile.js";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    profileImageUrl: user?.profileImageUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [emailPreferences, setEmailPreferences] = useState({
    enabled: true,
    appointments: true,
    orders: true,
    receipts: true,
    membership: true,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Keep the editable form in sync when a different account signs in.
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      profileImageUrl: user?.profileImageUrl || "",
    });

    // Load email preferences for customers
    if (user?.type === "customer") {
      loadEmailPreferences();
    }
  }, [user]);

  const loadEmailPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await customersAPI.getEmailPreferences();
      if (response.data.success) {
        setEmailPreferences(response.data.data);
      }
    } catch {
      // Silently handle preference loading errors
    } finally {
      setLoadingPreferences(false);
    }
  };

  const isCustomer = user?.type === "customer";
  const isStaff = user?.type === "staff";
  const displayRole = isCustomer
    ? (user?.membership?.status === "Active" ? "Member" : "Guest")
    : user?.role || "Staff";
  const accountLabel = isCustomer
    ? `${displayRole} customer account`
    : `${displayRole} account`;
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
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailPreferences = async () => {
    setSavingPreferences(true);
    try {
      const response = await customersAPI.updateEmailPreferences(emailPreferences);
      if (response.data.success) {
        toast.success("Email preferences saved");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save email preferences");
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
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
                className="relative mt-5 h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center overflow-hidden border group"
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
                <span>{accountLabel}</span>
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

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleProfileFile}
                />

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
                    <Input id="role" value={displayRole} disabled />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (!oldPassword || !newPassword || !confirmNewPassword) {
                    toast.error("Please fill all password fields");
                    return;
                  }

                  if (newPassword !== confirmNewPassword) {
                    toast.error("New passwords do not match");
                    return;
                  }

                  setSavingPassword(true);
                  try {
                    if (isCustomer) {
                      await customersAPI.updatePassword(oldPassword, newPassword);
                    } else if (isStaff) {
                      await staffAPI.updateOwnPassword(oldPassword, newPassword);
                    } else {
                      toast.error("Password changes are not supported for this account type");
                      return;
                    }

                    setOldPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    toast.success("Password updated successfully");
                  } catch (error) {
                      const status = error?.response?.status;
                      if (status === 401 || status === 403) {
                        toast.error(error.response?.data?.message || "Session expired or access denied");
                        logout();
                      } else {
                        toast.error(error.response?.data?.message || "Failed to update password");
                      }
                    } finally {
                      setSavingPassword(false);
                    }
                  }}
              >
                <input
                  type="hidden"
                  name="username"
                  autoComplete="username"
                  value={user?.email || ""}
                  aria-hidden="true"
                />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <div className="flex items-center gap-2">
                      <Input id="oldPassword" name="current-password" autoComplete="current-password" type={showOldPassword ? "text" : "password"} value={oldPassword} onChange={(e)=>setOldPassword(e.target.value)} />
                      <button type="button" className="p-2 rounded-md text-gray-600 hover:bg-gray-100" onClick={()=>setShowOldPassword(s=>!s)} aria-label="Toggle password visibility">
                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="flex items-center gap-2">
                      <Input id="newPassword" name="new-password" autoComplete="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
                      <button type="button" className="p-2 rounded-md text-gray-600 hover:bg-gray-100" onClick={()=>setShowNewPassword(s=>!s)} aria-label="Toggle password visibility">
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <div className="flex items-center gap-2">
                      <Input id="confirmNewPassword" name="new-password-confirm" autoComplete="new-password" type={showConfirmPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e)=>setConfirmNewPassword(e.target.value)} />
                      <button type="button" className="p-2 rounded-md text-gray-600 hover:bg-gray-100" onClick={()=>setShowConfirmPassword(s=>!s)} aria-label="Toggle password visibility">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button disabled={savingPassword} type="submit">
                      {savingPassword ? "Saving..." : "Change Password"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {isCustomer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPreferences ? (
                  <p className="text-sm text-gray-500">Loading preferences...</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                        <div>
                          <Label htmlFor="emailNotificationsEnabled" className="font-medium">
                            Email Notifications
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">Receive all transactional emails</p>
                        </div>
                        <input
                          id="emailNotificationsEnabled"
                          type="checkbox"
                          checked={emailPreferences.enabled}
                          onChange={(e) =>
                            setEmailPreferences({ ...emailPreferences, enabled: e.target.checked })
                          }
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                      </div>

                      {emailPreferences.enabled && (
                        <>
                          <div className="space-y-3 pl-3 border-l-2 border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="font-medium text-sm">Appointment Updates</Label>
                                <p className="text-xs text-gray-500">When your appointments are confirmed or updated</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailPreferences.appointments}
                                onChange={(e) =>
                                  setEmailPreferences({
                                    ...emailPreferences,
                                    appointments: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="font-medium text-sm">Order Confirmations</Label>
                                <p className="text-xs text-gray-500">When your orders are created and updated</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailPreferences.orders}
                                onChange={(e) =>
                                  setEmailPreferences({
                                    ...emailPreferences,
                                    orders: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="font-medium text-sm">Receipts</Label>
                                <p className="text-xs text-gray-500">When you receive order receipts and invoices</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailPreferences.receipts}
                                onChange={(e) =>
                                  setEmailPreferences({
                                    ...emailPreferences,
                                    receipts: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="font-medium text-sm">Membership Updates</Label>
                                <p className="text-xs text-gray-500">For membership approvals and changes</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailPreferences.membership}
                                onChange={(e) =>
                                  setEmailPreferences({
                                    ...emailPreferences,
                                    membership: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      onClick={handleSaveEmailPreferences}
                      disabled={savingPreferences}
                      className="w-full"
                    >
                      {savingPreferences ? "Saving..." : "Save Email Preferences"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
