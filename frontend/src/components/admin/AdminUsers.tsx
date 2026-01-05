import React, { useEffect, useState } from "react";
import { Card } from "../Card";
import { Modal } from "../Modal";
import { usersAPI, familyMembersAPI } from "../../utils/api";
import type { User, FamilyMember } from "../../types";

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    role: "family_member" as "admin" | "family_member",
    linkedFamilyMemberId: null as number | null,
  });

  useEffect(() => {
    fetchUsers();
    fetchFamilyMembers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const data = await familyMembersAPI.getAll();
      setFamilyMembers(data);
    } catch (err: any) {
      // Ignore errors for family members
    }
  };

  const handleApprove = async (user: User) => {
    setSelectedUser(user);
    setFormData({
      role: user.role,
      linkedFamilyMemberId: user.linkedFamilyMemberId || null,
    });
    setIsModalOpen(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Safety: ensure we use the correct ID field
    const userId = selectedUser.id || (selectedUser as any)._id;

    if (!userId) {
      setError("Cannot approve: User ID is missing");
      return;
    }

    try {
      await usersAPI.approve(
        userId,
        formData.role,
        formData.linkedFamilyMemberId || undefined
      );
      setIsModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve user");
    }
  };

  const handleReject = async (user: User) => {
    const userId = user.id || (user as any)._id;

    if (!userId) {
      setError("Cannot reject: User ID is missing");
      return;
    }

    if (!window.confirm(`Are you sure you want to reject ${user.name}?`)) {
      return;
    }

    try {
      await usersAPI.reject(userId);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject user");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved");
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-pulse-soft text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black">User Management</h2>
          <p className="text-gray-600 text-sm mt-1">
            Approve, reject, and manage users
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">
            Pending Approval ({pendingUsers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map((user) => (
              <Card key={user.id || (user as any)._id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-black">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs text-white rounded ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(user)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approved Users */}
      {approvedUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">
            Approved Users ({approvedUsers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedUsers.map((user) => (
              <Card key={user.id || (user as any)._id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-black">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs text-white rounded ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </div>
                  {user.linkedFamilyMemberId && (
                    <p className="text-xs text-gray-500">
                      Linked to Family Member ID: {user.linkedFamilyMemberId}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">
            Rejected Users ({rejectedUsers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rejectedUsers.map((user) => (
              <Card key={user.id || (user as any)._id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-black">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs text-white rounded ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No users found</div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        title="Approve User"
        size="md"
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          {selectedUser && (
            <div className="space-y-2 text-black">
              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "family_member",
                })
              }
              className="w-full px-3 py-2 border border-black rounded-md text-black"
            >
              <option value="family_member">Family Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Link to Family Member (optional)
            </label>
            <select
              value={formData.linkedFamilyMemberId || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  linkedFamilyMemberId: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              className="w-full px-3 py-2 border border-black rounded-md text-black"
            >
              <option value="">None</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} (ID: {member.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedUser(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
            >
              Approve User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
