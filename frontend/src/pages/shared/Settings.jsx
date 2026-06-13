import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageIcon, ShieldCheck, UserRound, Mail, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { customersAPI, staffAPI } from "../../utils/api.js";
import { imageFileToDataUrl } from "../../utils/imageFile.js";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    profileImageUrl: user?.profileImageUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [pendingImageNaturalSize, setPendingImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
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
  const accountBadgeClassName = isCustomer
    ? "rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700 flex gap-2 shadow-sm"
    : "rounded-xl bg-white/80 border border-slate-200 px-3 py-2 text-sm text-slate-700 flex gap-2 shadow-sm";
  const accountBadgeIconClassName = isCustomer
    ? "h-4 w-4 mt-0.5 text-emerald-500"
    : "h-4 w-4 mt-0.5 text-slate-500";
  const saveProfileImage = async (imageUrl) => {
    setSaving(true);

    try {
      if (isCustomer) {
        const response = await customersAPI.updateMe({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          profileImageUrl: imageUrl,
        });
        const updatedUser = response.data.data;
        updateUser(updatedUser);
        setFormData((current) => ({ ...current, ...updatedUser }));
      } else if (isStaff) {
        // Staff update their own profile via dedicated endpoint
        // Use a photo-only endpoint for image saves to avoid role mismatches causing 403
        const response = await staffAPI.updatePhoto({ profileImageUrl: imageUrl });
        const updatedStaff = response.data.data;
        updateUser({
          ...user,
          name: updatedStaff.name,
          phone: updatedStaff.phone,
          address: formData.address,
          profileImageUrl: updatedStaff.profileImageUrl,
        });
        setFormData((current) => ({
          ...current,
          name: updatedStaff.name,
          phone: updatedStaff.phone,
          address: formData.address,
          profileImageUrl: updatedStaff.profileImageUrl,
        }));
      }

      toast.success("Profile picture updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save profile picture");
    } finally {
      setSaving(false);
    }
  };

  const previewSize = 320;
  const cropDiameter = 260;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const createCroppedImageUrl = async () => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load selected image"));
      img.src = pendingImageUrl;
    });

    const scaledWidth = image.width * imageScale;
    const scaledHeight = image.height * imageScale;
    const cropLeft = (previewSize - cropDiameter) / 2;
    const cropTop = (previewSize - cropDiameter) / 2;

    const sourceX = Math.max(0, Math.min((cropLeft - cropOffset.x) / imageScale, image.width - cropDiameter / imageScale));
    const sourceY = Math.max(0, Math.min((cropTop - cropOffset.y) / imageScale, image.height - cropDiameter / imageScale));
    const sourceSize = cropDiameter / imageScale;

    const canvas = document.createElement("canvas");
    canvas.width = cropDiameter;
    canvas.height = cropDiameter;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, cropDiameter, cropDiameter);
    return canvas.toDataURL("image/png");
  };

  const handleProfileFile = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      input.value = "";
      return;
    }

    try {
      const imageUrl = await imageFileToDataUrl(file, 1024);
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load selected image"));
        img.src = imageUrl;
      });

      const scale = Math.min(1, previewSize / Math.max(image.width, image.height));
      const initialOffset = {
        x: Math.round((previewSize - image.width * scale) / 2),
        y: Math.round((previewSize - image.height * scale) / 2),
      };

      setPendingImageUrl(imageUrl);
      setPendingImageNaturalSize({ width: image.width, height: image.height });
      baseScaleRef.current = scale;
      setImageScale(scale);
      setCropOffset(initialOffset);
      setCropDialogOpen(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      input.value = "";
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const cancelPendingImage = () => {
    setPendingImageUrl("");
    setCropDialogOpen(false);
  };

  // Smooth zoom animation refs
  const imageScaleRef = useRef(imageScale);
  const targetZoomRef = useRef(imageScale);
  const baseScaleRef = useRef(1);
  const rafRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    imageScaleRef.current = imageScale;
  }, [imageScale]);

  const startZoomAnimation = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = () => {
      const current = imageScaleRef.current;
      const target = targetZoomRef.current;
      const diff = target - current;
      const epsilon = 0.001;
      if (Math.abs(diff) < epsilon) {
        setImageScale(target);
        imageScaleRef.current = target;
        rafRef.current = null;
        return;
      }
      // smooth easing (smaller factor = smoother, less jumpy)
      const next = current + diff * 0.16;
      setImageScale(next);
      imageScaleRef.current = next;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const confirmPendingImage = async () => {
    if (!pendingImageUrl) return;
    setCropDialogOpen(false);
    const croppedImage = await createCroppedImageUrl();
    await saveProfileImage(croppedImage);
    setPendingImageUrl("");
  };

  const handleCropPointerDown = (event) => {
    if (!pendingImageUrl) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startOffsetX = cropOffset.x;
    const startOffsetY = cropOffset.y;

    if (!dragRef.current) dragRef.current = {};
    dragRef.current.isDragging = true;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setCropOffset({
        x: startOffsetX + deltaX,
        y: startOffsetY + deltaY,
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      if (dragRef.current) dragRef.current.isDragging = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleCropWheel = (event) => {
    if (!pendingImageUrl) return;
    event.preventDefault();

    const minRel = 0.5;
    const maxRel = 3;
    const zoomStep = 0.05;
    const delta = event.deltaY > 0 ? -zoomStep : zoomStep;
    const currentAbs = imageScaleRef.current;
    const base = baseScaleRef.current || 1;
    const currentRel = currentAbs / base;
    const requestedRel = clamp(currentRel + delta, minRel, maxRel);
    const requested = requestedRel * base;
    const zoomRatio = requested / currentAbs;

    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      const newOffsetX = cursorX - (cursorX - cropOffset.x) * zoomRatio;
      const newOffsetY = cursorY - (cursorY - cropOffset.y) * zoomRatio;
      setCropOffset({ x: newOffsetX, y: newOffsetY });
    }

    targetZoomRef.current = requested;
    startZoomAnimation();
  };

  const handleCropKeyDown = (event) => {
    if (!pendingImageUrl) return;

    const minZoom = 0.5;
    const maxZoom = 3;
    const zoomStep = 0.1;
    const previewCenter = previewSize / 2; // 160 for 320px preview

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      const base = baseScaleRef.current || 1;
      const currentRel = imageScaleRef.current / base;
      const newRel = clamp(currentRel + zoomStep, minZoom, maxZoom);
      const newZoom = newRel * base;
      const zoomRatio = newZoom / imageScaleRef.current;

      // Zoom toward center of preview (use current offsets)
      const newOffsetX = previewCenter - (previewCenter - cropOffset.x) * zoomRatio;
      const newOffsetY = previewCenter - (previewCenter - cropOffset.y) * zoomRatio;

      targetZoomRef.current = newZoom;
      setCropOffset({ x: newOffsetX, y: newOffsetY });
      startZoomAnimation();
    } else if (event.key === "-") {
      event.preventDefault();
      const base = baseScaleRef.current || 1;
      const currentRel = imageScaleRef.current / base;
      const newRel = clamp(currentRel - zoomStep, minZoom, maxZoom);
      const newZoom = newRel * base;
      const zoomRatio = newZoom / imageScaleRef.current;
      const newOffsetX = previewCenter - (previewCenter - cropOffset.x) * zoomRatio;
      const newOffsetY = previewCenter - (previewCenter - cropOffset.y) * zoomRatio;

      targetZoomRef.current = newZoom;
      setCropOffset({ x: newOffsetX, y: newOffsetY });
      startZoomAnimation();
    }
  };

  const handleZoomChange = (newZoom) => {
    const minRel = 0.5;
    const maxRel = 3;
    const base = baseScaleRef.current || 1;
    const requestedRel = Math.max(minRel, Math.min(maxRel, newZoom));
    const requested = requestedRel * base;
    targetZoomRef.current = requested;
    startZoomAnimation();
  };

  const handleCropTouchPinch = (event) => {
    if (!pendingImageUrl || event.touches.length !== 2) return;
    event.preventDefault();

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    if (!dragRef.current) dragRef.current = {};

    const previewRect = previewRef.current?.getBoundingClientRect();
    if (!previewRect) return;

    const pinchCenterX = (touch1.clientX + touch2.clientX) / 2 - previewRect.left;
    const pinchCenterY = (touch1.clientY + touch2.clientY) / 2 - previewRect.top;

    if (!dragRef.current.initialPinchDistance) {
      dragRef.current.initialPinchDistance = currentDistance;
      dragRef.current.initialZoom = imageScaleRef.current;
      dragRef.current.initialOffsetX = cropOffset.x;
      dragRef.current.initialOffsetY = cropOffset.y;
      dragRef.current.pinchCenterX = pinchCenterX;
      dragRef.current.pinchCenterY = pinchCenterY;
      dragRef.current.isPinching = true;
      return;
    }

    const scale = currentDistance / dragRef.current.initialPinchDistance;
    const base = baseScaleRef.current || 1;
    const minZoom = 0.5 * base;
    const maxZoom = 3 * base;
    const newZoom = clamp(dragRef.current.initialZoom * scale, minZoom, maxZoom);
    const zoomChange = newZoom / dragRef.current.initialZoom;

    const newOffsetX = dragRef.current.pinchCenterX -
      (dragRef.current.pinchCenterX - dragRef.current.initialOffsetX) * zoomChange;
    const newOffsetY = dragRef.current.pinchCenterY -
      (dragRef.current.pinchCenterY - dragRef.current.initialOffsetY) * zoomChange;

    imageScaleRef.current = newZoom;
    targetZoomRef.current = newZoom;
    setImageScale(newZoom);
    setCropOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleCropTouchPinchEnd = () => {
    if (dragRef.current) {
      dragRef.current.initialPinchDistance = null;
      dragRef.current.isPinching = false;
    }

    if (targetZoomRef.current !== imageScaleRef.current) {
      startZoomAnimation();
    }
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
        const updatedUser = response.data.data;
        updateUser(updatedUser);
        setFormData((current) => ({ ...current, ...updatedUser }));
      } else if (isStaff) {
        const response = await staffAPI.updateMe({
          phone: formData.phone,
          profileImageUrl: formData.profileImageUrl,
        });
        const updatedStaff = response.data.data;
        updateUser({
          ...user,
          phone: updatedStaff.phone,
          profileImageUrl: updatedStaff.profileImageUrl,
        });
        setFormData((current) => ({
          ...current,
          phone: updatedStaff.phone,
          profileImageUrl: updatedStaff.profileImageUrl,
        }));
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
          <Card className="rounded-3xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative mt-5 h-20 w-20 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center overflow-hidden border border-slate-200 ring-2 ring-sky-200 ring-offset-2 ring-offset-slate-50 shadow-sm group"
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
                <h2 className="font-semibold text-slate-900">{user?.name || "User"}</h2>
                <p className="text-sm text-slate-500 break-all">{user?.email}</p>
              </div>

              <div className={accountBadgeClassName}>
                <ShieldCheck className={accountBadgeIconClassName} />
                <span>{accountLabel}</span>
              </div>
            </CardContent>
          </Card>
          <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col" onKeyDown={handleCropKeyDown}>
              <DialogHeader>
                <DialogTitle>Preview profile picture</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto px-4 py-2">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div ref={previewRef} className="relative h-[260px] w-[260px] sm:h-[320px] sm:w-[320px] overflow-hidden rounded-3xl border-2 border-slate-300 bg-slate-100 shadow-sm select-none flex-shrink-0" style={{ touchAction: "none" }} onWheel={handleCropWheel} onTouchMove={handleCropTouchPinch} onTouchEnd={handleCropTouchPinchEnd}>
                  {pendingImageUrl ? (
                    <div
                      className="absolute inset-0 cursor-move active:cursor-grabbing"
                      onPointerDown={handleCropPointerDown}
                      style={{ touchAction: "none" }}
                    >
                      <div
                        className="absolute top-0 left-0"
                        style={{
                            transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                            willChange: "transform",
                          }}
                      >
                        <img
                          src={pendingImageUrl}
                          alt="Preview"
                          className="pointer-events-none select-none"
                          draggable="false"
                          style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            minWidth: "100%",
                            minHeight: "100%",
                            objectFit: "cover",
                            transform: `scale(${imageScale / baseScaleRef.current})`,
                            transformOrigin: "top left",
                            willChange: "transform",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      Preview unavailable
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-black/25"></div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[260px] w-[260px] rounded-full border-2 border-white/80 shadow-lg"></div>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500 font-medium flex-shrink-0">
                  Drag to position • Scroll to zoom • Press + or - to zoom
                </p>
              </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" type="button" onClick={openFilePicker}>
                  Change Photo
                </Button>
                <Button type="button" disabled={!pendingImageUrl || saving} onClick={confirmPendingImage}>
                  {saving ? "Saving..." : "Save Photo"}
                </Button>
                <Button variant="outline" type="button" onClick={cancelPendingImage}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.name}
                        onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                        required
                        disabled={isStaff}
                        className={isStaff ? "bg-gray-100 cursor-not-allowed" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={formData.email} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profileImageUrl">Image URL</Label>
                      <Input
                        id="profileImageUrl"
                        value={formData.profileImageUrl}
                        onChange={(event) => setFormData((current) => ({ ...current, profileImageUrl: event.target.value }))}
                        placeholder="Paste image URL here"
                        className="text-sm"
                      />
                    </div>

                    <div className="max-w-[180px]">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleProfileFile}
                      />
                      <div className="h-32 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                        {formData.profileImageUrl ? (
                          <img
                            src={formData.profileImageUrl}
                            alt={user?.name || "Preview"}
                            className="h-full min-h-full w-full min-w-full rounded-xl object-cover"
                          />
                        ) : (
                          <UserRound className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="mt-3">
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                          Change Photo
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="address">{isCustomer ? "Delivery Address" : "Department / Notes"}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                        required={isCustomer}
                        disabled={isStaff}
                        className={isStaff ? "bg-gray-100 cursor-not-allowed" : ""}
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
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
