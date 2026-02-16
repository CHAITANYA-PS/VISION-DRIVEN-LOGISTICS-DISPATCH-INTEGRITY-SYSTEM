import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit, Filter, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card, { CardContent, CardHeader } from "../../components/common/Card";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import Modal from "../../components/common/Modal";
import { DataTable } from "../../components/shared/DataTable";
import {
  createUser,
  deleteUser,
  getAllUsers,
  updateUser,
} from "../../services/userService";
import { formatDate, formatRole } from "../../utils/formatters";
import { cn } from "../../utils/helpers";

// Actions Dropdown Component
function ActionsDropdown({ user, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" type="button">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "z-50"
          )}
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className={cn(
              "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "transition-colors focus:bg-gray-100 focus:text-gray-900",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
            onSelect={(e) => {
              e.preventDefault();
              onEdit(user);
              setOpen(false);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
          <DropdownMenu.Item
            className={cn(
              "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "transition-colors focus:bg-gray-100 focus:text-gray-900 text-red-600",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
            onSelect={(e) => {
              e.preventDefault();
              onDelete(user);
              setOpen(false);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SUPERVISOR",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      // Surface more useful error information in the UI and console
      // so it's easier to see why the request failed (403, 500, etc.)
      // eslint-disable-next-line no-console
      console.error("Failed to load users", err?.response || err);

      const backendMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message;

      setError(
        backendMessage
          ? `Failed to load users: ${backendMessage}`
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  // Format User ID as U001, U002, etc.
  const formatUserId = (id) => {
    return `U${String(id).padStart(3, "0")}`;
  };

  const columns = [
    {
      key: "id",
      label: "User ID",
      render: (value) => formatUserId(value),
    },
    { key: "name", label: "Name" },
    {
      key: "role",
      label: "Role",
      render: (value) => {
        const roleColors = {
          SUPERVISOR: "blue",
          WORKER: "green",
        };
        return (
          <Badge variant={roleColors[value] || "gray"}>
            {formatRole(value)}
          </Badge>
        );
      },
    },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (value, row) => {
        // For now, default to Active. In future, this could come from backend
        const status = row.status || "Active";
        const statusColors = {
          Active: "green",
          Inactive: "gray",
        };
        return <Badge variant={statusColors[status] || "gray"}>{status}</Badge>;
      },
    },
    {
      key: "lastActive",
      label: "Last Active",
      render: (value, row) => {
        // Use createdAt as lastActive for now, or actual lastActive if available
        const lastActive = row.lastActive || row.createdAt;
        if (!lastActive) return "Never";
        // Format as YYYY-MM-DD HH:mm to match image
        const date = new Date(lastActive);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, row) => (
        <ActionsDropdown
          user={row}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = () => {
    setFormErrors({});
    setSuccess("");
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (isEdit = false) => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }

    // Password is required for create, optional for edit
    if (!isEdit) {
      if (!formData.password.trim()) {
        errors.password = "Password is required";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    } else {
      // For edit: only validate if password is provided
      if (formData.password && formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    }

    if (!formData.role) {
      errors.role = "Role is required";
    } else if (
      !["SUPERVISOR", "WORKER"].includes(formData.role.toUpperCase())
    ) {
      errors.role = "Role must be Supervisor or Worker";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!validateForm(false)) return;

    setSubmitting(true);
    try {
      // Only allow SUPERVISOR or WORKER from this screen
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role.toUpperCase(),
      };

      await createUser(payload);

      setSuccess("User created successfully");
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "SUPERVISOR",
      });

      // Refresh list
      await fetchUsers();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create user";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormErrors({});
    setError("");
    setSuccess("");
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!validateForm(true)) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.toUpperCase(),
      };

      // Only include password if it's been changed
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      await updateUser(selectedUser.id, payload);

      setSuccess("User updated successfully");
      setIsEditModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "SUPERVISOR",
      });
      setSelectedUser(null);

      // Refresh list
      await fetchUsers();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`
      )
    )
      return;

    try {
      await deleteUser(user.id);
      setSuccess(`User "${user.name}" deleted successfully`);
      await fetchUsers();
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete user";
      setError(message);
    }
  };

  if (loading) return <Loading text="Loading users..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 text-2xl font-bold mb-2">
          User Management
        </h1>
        <p className="text-gray-500">Manage warehouse staff and their roles</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              onClick={handleOpenModal}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredUsers}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
            onView={handleView}
            actions={false}
          />
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add User"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            error={formErrors.name}
            placeholder="e.g., John Smith"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            error={formErrors.email}
            placeholder="user@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            error={formErrors.password}
            placeholder="Enter a secure password"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="border-gray-300 focus-visible:border-primary focus-visible:ring-primary/50 w-full rounded-md border bg-gray-50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            >
              <option value="SUPERVISOR">Supervisor</option>
              <option value="WORKER">Worker</option>
            </select>
            {formErrors.role && (
              <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={submitting}
              className="min-w-[100px] border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-black text-white hover:bg-gray-800 min-w-[100px] border-0"
            >
              {submitting ? "Adding..." : "Add User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          setFormData({
            name: "",
            email: "",
            password: "",
            role: "SUPERVISOR",
          });
          setFormErrors({});
        }}
        title="Edit User"
        size="md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            error={formErrors.name}
            placeholder="e.g., John Smith"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            error={formErrors.email}
            placeholder="user@example.com"
          />
          <Input
            label="Password (leave blank to keep current)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            error={formErrors.password}
            placeholder="Enter new password to change"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="border-gray-300 focus-visible:border-primary focus-visible:ring-primary/50 w-full rounded-md border bg-gray-50 px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            >
              <option value="SUPERVISOR">Supervisor</option>
              <option value="WORKER">Worker</option>
            </select>
            {formErrors.role && (
              <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  role: "SUPERVISOR",
                });
                setFormErrors({});
              }}
              disabled={submitting}
              className="min-w-[100px] border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-black text-white hover:bg-gray-800 min-w-[100px] border-0"
            >
              {submitting ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                User ID
              </label>
              <p className="text-gray-900 font-semibold">#{selectedUser.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Full Name
              </label>
              <p className="text-gray-900">{selectedUser.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-gray-900">{selectedUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Role
              </label>
              <p className="text-gray-900">{formatRole(selectedUser.role)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Created At
              </label>
              <p className="text-gray-900">
                {formatDate(selectedUser.createdAt)}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(selectedUser);
                }}
              >
                Edit User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
