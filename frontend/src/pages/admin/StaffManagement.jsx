import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UsersRound,
  UserX,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { staffAPI } from "../../utils/api.js";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "Staff",
  phone: "",
  department: "",
  profileImageUrl: "",
  isActive: true,
};

const roleBadgeClass = {
  Admin: "bg-blue-100 text-blue-700",
  Staff: "bg-gray-100 text-gray-700",
};

export default function StaffManagement() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    admins: 0,
    staffMembers: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const [staffResponse, statsResponse] = await Promise.all([
        staffAPI.getAll(),
        staffAPI.getStats(),
      ]);

      setStaff(staffResponse.data.data || []);
      setStats(statsResponse.data.data || {
        totalStaff: 0,
        activeStaff: 0,
        admins: 0,
        staffMembers: 0,
      });
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error(error.response?.data?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return staff.filter((member) =>
      [member.name, member.email, member.phone, member.department, member.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [staff, searchTerm]);

  const inactiveStaff = staff.filter((member) => !member.isActive).length;

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (member) => {
    setEditingId(member._id);
    setFormData({
      name: member.name || "",
      email: member.email || "",
      password: "",
      role: member.role || "Staff",
      phone: member.phone || "",
      department: member.department || "",
      profileImageUrl: member.profileImageUrl || "",
      isActive: Boolean(member.isActive),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await staffAPI.update(editingId, {
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          department: formData.department,
          profileImageUrl: formData.profileImageUrl,
          isActive: formData.isActive,
        });

        if (formData.password) {
          await staffAPI.adminResetPassword(editingId, formData.password);
        }

        toast.success(formData.password ? "Staff member updated and password reset" : "Staff member updated");
      } else {
        await staffAPI.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          department: formData.department,
          profileImageUrl: formData.profileImageUrl,
        });
        toast.success("Staff member created");
      }

      setDialogOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
      await fetchStaff();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error(error.response?.data?.message || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (member, isActive) => {
    if (!isActive && member._id === user?.id) {
      toast.error("You cannot deactivate your own account");
      return;
    }

    try {
      if (isActive) {
        await staffAPI.update(member._id, {
          name: member.name,
          role: member.role,
          phone: member.phone || "",
          department: member.department || "",
          profileImageUrl: member.profileImageUrl || "",
          isActive: true,
        });
        toast.success("Staff member activated");
      } else {
        await staffAPI.deactivate(member._id);
        toast.success("Staff member deactivated");
      }

      await fetchStaff();
    } catch (error) {
      console.error("Error changing staff status:", error);
      toast.error(error.response?.data?.message || "Failed to update staff status");
    }
  };

  if (loading) {
    return <div className="p-6">Loading staff...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Staff Management</h1>
          <p className="text-gray-500">Manage admin and staff accounts</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaffStat title="Total Staff" value={stats.totalStaff} icon={<UsersRound className="h-8 w-8 text-blue-600" />} />
        <StaffStat title="Active" value={stats.activeStaff} icon={<UserCheck className="h-8 w-8 text-green-600" />} />
        <StaffStat title="Admins" value={stats.admins} icon={<ShieldCheck className="h-8 w-8 text-indigo-600" />} />
        <StaffStat title="Inactive" value={inactiveStaff} icon={<UserX className="h-8 w-8 text-red-600" />} />
      </div>

      <Card>
        <CardContent className="flex min-h-24 items-center p-4">
          <div className="relative mx-auto w-full max-w-6xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search staff by name, email, role, or department..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Accounts ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Staff</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Contact</th>
                  <th className="text-left py-3 px-4 hidden lg:table-cell">Department</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member._id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 overflow-hidden flex items-center justify-center">
                          {member.profileImageUrl ? (
                            <img
                              src={member.profileImageUrl}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500 break-all">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">{member.phone || "-"}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">{member.department || "-"}</td>
                    <td className="py-3 px-4">
                      <Badge className={roleBadgeClass[member.role] || roleBadgeClass.Staff}>
                        {member.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {member.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(member)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {member.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(member, false)}
                            disabled={member._id === user?.id}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(member, true)}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={6}>
                      No staff accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffName">Full Name</Label>
                <Input
                  id="staffName"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffEmail">Email</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  disabled={Boolean(editingId)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffPassword">{editingId ? "New Password (leave blank to keep current)" : "Password"}</Label>
                <div className="relative">
                  <Input
                    id="staffPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    minLength={8}
                    required={!editingId}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffRole">Role</Label>
                <select
                  id="staffRole"
                  value={formData.role}
                  onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffPhone">Phone</Label>
                <Input
                  id="staffPhone"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffDepartment">Department</Label>
                <Input
                  id="staffDepartment"
                  value={formData.department}
                  onChange={(event) => setFormData({ ...formData, department: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffProfileImage">Profile Image URL</Label>
              <Input
                id="staffProfileImage"
                type="url"
                value={formData.profileImageUrl}
                onChange={(event) => setFormData({ ...formData, profileImageUrl: event.target.value })}
                placeholder="https://example.com/profile.jpg"
              />
            </div>

            {editingId && (
              <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  disabled={editingId === user?.id}
                  onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                  className="h-4 w-4"
                />
                <span>Active account</span>
              </label>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Staff"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffStat({ title, value, icon }) {
  return (
    <Card>
      <CardContent className="flex min-h-40 items-center p-6">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-3 break-words text-3xl text-slate-950">{value}</p>
          </div>
          <div className="shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
