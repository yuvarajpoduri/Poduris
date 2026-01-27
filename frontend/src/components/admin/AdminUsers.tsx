import React, { useEffect, useState } from "react";
import { Card } from "../Card";
import { Modal } from "../Modal";
import { usersAPI } from "../../utils/api";
import type { User } from "../../types";
import { formatPoduriName } from "../../utils/formatUtils";

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
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

  const handleApprove = async (user: User) => {
    setSelectedUser(user);
    setFormData({
      role: user.role,
      linkedFamilyMemberId: user.linkedFamilyMemberId || user.familyMemberId || null,
    });
    setIsModalOpen(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const userId = selectedUser.id;

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
    const userId = user.id;

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
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "active");
  const rejectedUsers = users.filter((u) => u.status === "inactive");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">⏳</div>
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
              <Card key={user.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-black">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.linkedFamilyMember ? (
                        <div className="mt-2 flex items-center space-x-2">
                          {user.linkedFamilyMember.avatar ? (
                            <img
                              src={user.linkedFamilyMember.avatar}
                              alt={user.linkedFamilyMember.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-300"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                              {user.linkedFamilyMember.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-black">{user.linkedFamilyMember.name}</p>
                            <p className="text-xs text-gray-500">Gen {user.linkedFamilyMember.generation}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-yellow-600 mt-1">⚠️ No family member linked</p>
                      )}
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
                      disabled={!(user.linkedFamilyMemberId || user.familyMemberId)}
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
              <Card key={user.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-black">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role === 'family_member' ? 'Family Member' : 'Admin'}
                      </p>
                      {user.linkedFamilyMember ? (
                        <div className="mt-2 flex items-center space-x-2">
                          {user.linkedFamilyMember.avatar ? (
                            <img
                              src={user.linkedFamilyMember.avatar}
                              alt={user.linkedFamilyMember.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-300"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                              {user.linkedFamilyMember.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-black">{user.linkedFamilyMember.name}</p>
                            <p className="text-xs text-gray-500">Gen {user.linkedFamilyMember.generation} • ID: {user.linkedFamilyMember.id}</p>
                          </div>
                        </div>
                      ) : (user.linkedFamilyMemberId || user.familyMemberId) ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Linked to Family Member ID: {user.linkedFamilyMemberId || user.familyMemberId}
                        </p>
                      ) : null}
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

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">
            Rejected Users ({rejectedUsers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rejectedUsers.map((user) => (
              <Card key={user.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-black">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-white rounded ${getStatusColor(
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
            <div className="space-y-3 text-black">
              <div>
                <p>
                  <strong>Name:</strong> {formatPoduriName(selectedUser.name)}
                </p>
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
              </div>
              {selectedUser.linkedFamilyMember ? (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold mb-2">Linked Family Member:</p>
                  <div className="flex items-center space-x-3">
                    {selectedUser.linkedFamilyMember.avatar ? (
                      <img
                        src={selectedUser.linkedFamilyMember.avatar}
                        alt={selectedUser.linkedFamilyMember.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600">
                        {formatPoduriName(selectedUser.linkedFamilyMember.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{formatPoduriName(selectedUser.linkedFamilyMember.name)}</p>
                      <p className="text-sm text-gray-600">Generation {selectedUser.linkedFamilyMember.generation}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No family member linked. User must be linked to a family member before approval.
                  </p>
                </div>
              )}
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
              disabled={!(selectedUser?.linkedFamilyMemberId || selectedUser?.familyMemberId)}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
