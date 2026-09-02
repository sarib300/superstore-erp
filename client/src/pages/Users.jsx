import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Pencil,
  KeyRound,
  Search,
  X,
} from "lucide-react";

import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
} from "../services/userService";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "cashier",
  status: "active",
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getUsers();

      setUsers(result.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showSuccess = (text) => {
    setMessage(text);
    setError("");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setForm(initialForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm(initialForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingUser) {
        await updateUser(editingUser._id, {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        });

        showSuccess("User updated successfully");
      } else {
        await createUser(form);

        showSuccess("User created successfully");
      }

      closeModal();
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setNewPassword("");
    setError("");
    setShowPasswordModal(true);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await resetUserPassword(passwordUser._id, newPassword);

      setShowPasswordModal(false);
      setPasswordUser(null);
      setNewPassword("");

      showSuccess("Password reset successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";

    const confirmed = window.confirm(
      `Are you sure you want to ${
        newStatus === "active" ? "activate" : "deactivate"
      } ${user.name}?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      await updateUser(user._id, {
        name: user.name,
        email: user.email,
        role: user.role,
        status: newStatus,
      });

      showSuccess(
        `User ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`,
      );

      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    const text = search.toLowerCase();

    return (
      user.name?.toLowerCase().includes(text) ||
      user.email?.toLowerCase().includes(text) ||
      user.role?.toLowerCase().includes(text)
    );
  });

  const formatRole = (role) => {
    if (role === "inventory_staff") {
      return "Inventory Staff";
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>
            <UsersIcon size={28} />
            Users & Staff
          </h1>

          <p>Manage staff accounts, roles and access</p>
        </div>

        <button className="primary-btn" onClick={openAddModal}>
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}

      {error && <div className="error-message">{error}</div>}

      <div className="users-summary-grid">
        <div className="summary-card">
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </div>

        <div className="summary-card">
          <span>Active Users</span>
          <strong>
            {users.filter((user) => user.status === "active").length}
          </strong>
        </div>

        <div className="summary-card">
          <span>Inactive Users</span>
          <strong>
            {users.filter((user) => user.status === "inactive").length}
          </strong>
        </div>

        <div className="summary-card">
          <span>Administrators</span>
          <strong>
            {users.filter((user) => user.role === "admin").length}
          </strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="table-loading">Loading users...</div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <span className="role-badge">
                          {formatRole(user.role)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            user.status === "active"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>

                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn"
                            title="Edit User"
                            onClick={() => openEditModal(user)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="icon-btn"
                            title="Reset Password"
                            onClick={() => openPasswordModal(user)}
                          >
                            <KeyRound size={16} />
                          </button>

                          <button
                            className={
                              user.status === "active"
                                ? "status-action-btn danger"
                                : "status-action-btn success"
                            }
                            onClick={() => toggleStatus(user)}
                          >
                            {user.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container user-modal user-form-modal">
            <div className="user-form-header">
              <div className="user-form-header-icon">
                <UserPlus size={22} />
              </div>

              <div className="user-form-header-text">
                <h2>{editingUser ? "Edit User" : "Add New User"}</h2>

                <p>
                  {editingUser
                    ? "Update staff account information and permissions."
                    : "Create a staff account and assign system access."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close user-form-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form-content">
              <div className="user-form-section">
                <div className="user-form-section-title">
                  <span>Basic Information</span>
                  <small>Staff member's account details</small>
                </div>

                <div className="user-form-grid">
                  <div className="form-group">
                    <label htmlFor="user-name">Full Name</label>

                    <input
                      id="user-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Ahmed Khan"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="user-email">Email Address</label>

                    <input
                      id="user-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="ahmed@superstore.com"
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div className="form-group user-password-field">
                    <label htmlFor="user-password">Temporary Password</label>

                    <input
                      id="user-password"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength="6"
                      placeholder="Enter at least 6 characters"
                    />

                    <small className="form-helper-text">
                      The staff member will use this password to sign in.
                    </small>
                  </div>
                )}
              </div>

              <div className="user-form-divider" />

              <div className="user-form-section">
                <div className="user-form-section-title">
                  <span>Access & Permissions</span>
                  <small>Choose role and account status</small>
                </div>

                <div className="user-form-grid">
                  <div className="form-group">
                    <label htmlFor="user-role">Staff Role</label>

                    <select
                      id="user-role"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                    >
                      <option value="admin">Administrator</option>

                      <option value="manager">Manager</option>

                      <option value="cashier">Cashier</option>

                      <option value="inventory_staff">Inventory Staff</option>
                    </select>

                    <small className="form-helper-text">
                      Determines which ERP modules the user can access.
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="user-status">Account Status</label>

                    <select
                      id="user-status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>

                      <option value="inactive">Inactive</option>
                    </select>

                    <small className="form-helper-text">
                      Inactive users cannot access the system.
                    </small>
                  </div>
                </div>
              </div>

              <div className="user-form-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn user-submit-btn"
                  disabled={saving}
                >
                  <UserPlus size={17} />

                  {saving
                    ? "Saving..."
                    : editingUser
                      ? "Update User"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-container password-modal">
            <div className="modal-header">
              <div>
                <h2>Reset Password</h2>

                <p>Set a new password for {passwordUser?.name}</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="erp-form">
              <div className="form-group">
                <label>New Password</label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="6"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
