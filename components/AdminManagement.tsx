"use client";

import { useState, useEffect } from "react";
import {
  FiPlus,
  FiTrash2,
  FiUsers,
  FiMail,
  FiCalendar,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import {
  getAllAdmins,
  addTeamsAdmin,
  removeAdmin,
  isEmailAdmin,
  linkAdminToPlayer,
  unlinkAdminFromPlayer,
} from "@/lib/adminService";
import { AdminUser } from "@/config/adminAccess";
import { NameAutocomplete } from "@/components/ui/name-autocomplete";
import { Player } from "@/lib/types";

export default function AdminManagement() {
  const { user, role } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [error, setError] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingAdmin, setLinkingAdmin] = useState<AdminUser | null>(null);
  const [playerSearchValue, setPlayerSearchValue] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  const loadAdmins = async () => {
    if (role !== "super_admin") return;

    setLoading(true);
    try {
      const adminList = await getAllAdmins();
      setAdmins(adminList);
    } catch (error) {
      console.error("Error loading admins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadAdmins();
    } else if (role !== "none") {
      setLoading(false);
    }
  }, [role]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !user?.email) return;

    setAddingAdmin(true);
    setError("");

    try {
      if (!newEmail.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      const isAlreadyAdmin = await isEmailAdmin(newEmail);
      if (isAlreadyAdmin) {
        setError("This email is already an admin");
        return;
      }

      const success = await addTeamsAdmin(newEmail, user.email);
      if (success) {
        setNewEmail("");
        setShowAddModal(false);
        loadAdmins();
      } else {
        setError("Failed to add admin. Please try again.");
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!window.confirm(`Remove admin access for ${email}?`)) return;

    try {
      const success = await removeAdmin(email);
      if (success) {
        loadAdmins();
      } else {
        alert("Failed to remove admin. Please try again.");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleLinkPlayer = (admin: AdminUser) => {
    setLinkingAdmin(admin);
    setPlayerSearchValue("");
    setSelectedPlayer(null);
    setShowLinkModal(true);
    setError("");
  };

  const handleConfirmLink = async () => {
    if (!linkingAdmin || !selectedPlayer) return;

    setLinkingInProgress(true);
    setError("");

    try {
      const success = await linkAdminToPlayer(
        linkingAdmin.email,
        selectedPlayer.id,
        selectedPlayer.name
      );

      if (success) {
        setShowLinkModal(false);
        setLinkingAdmin(null);
        setPlayerSearchValue("");
        setSelectedPlayer(null);
        loadAdmins();
      } else {
        setError("Failed to link player. Please try again.");
      }
    } catch (error) {
      console.error("Error linking player:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLinkingInProgress(false);
    }
  };

  const handleUnlinkPlayer = async (admin: AdminUser) => {
    if (
      !window.confirm(`Unlink ${admin.linkedPlayerName} from ${admin.email}?`)
    )
      return;

    try {
      const success = await unlinkAdminFromPlayer(admin.email);
      if (success) {
        loadAdmins();
      } else {
        alert("Failed to unlink player. Please try again.");
      }
    } catch (error) {
      console.error("Error unlinking player:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "super_admin") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Super Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Teams Admin
      </span>
    );
  };

  if (role !== "super_admin") {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-sm sm:text-base text-muted-foreground">
          Access denied. Super admin only.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
            Admin Management
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
            Manage who has access to admin features
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
        >
          <FiPlus className="h-4 w-4" />
          Add Teams Admin
        </button>
      </div>

      {/* Admin List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base sm:text-lg md:text-xl font-medium text-foreground">
            Current Admins
          </h3>
        </div>

        {admins.length === 0 ? (
          <div className="px-4 sm:px-6 py-8 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">
              No admins found. Add your first admin above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {admins.map((admin) => (
              <div
                key={admin.email}
                className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Avatar
                      src={null} // Admins don't have avatars in this system
                      alt={admin.username}
                      size="md"
                      className="h-8 w-8 sm:h-10 sm:w-10 bg-indigo-100 dark:bg-indigo-900"
                      fallbackClassName="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <p className="text-sm sm:text-base font-medium text-foreground truncate">
                        {admin.username}
                      </p>
                      <div className="hidden sm:block">
                        <div className="flex flex-col gap-1">
                          {getRoleBadge(admin.role)}
                          {admin.role === "teams_admin" &&
                            admin.linkedPlayerName && (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                Linked to: {admin.linkedPlayerName}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                        <FiMail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{admin.email}</span>
                      </p>
                      {admin.addedAt && admin.addedAt !== "System" && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <FiCalendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Added </span>
                          {new Date(admin.addedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Mobile: Role + Actions */}
                    <div className="sm:hidden mt-2 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {getRoleBadge(admin.role)}
                        {admin.role === "teams_admin" &&
                          admin.linkedPlayerName && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Linked to: {admin.linkedPlayerName}
                            </span>
                          )}
                      </div>
                      {admin.role !== "super_admin" && (
                        <div className="flex gap-1">
                          {admin.role === "teams_admin" && (
                            <>
                              {admin.linkedPlayerName ? (
                                <button
                                  onClick={() => handleUnlinkPlayer(admin)}
                                  className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                  title="Unlink Player"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleLinkPlayer(admin)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Link Player"
                                >
                                  <FiPlus className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => handleRemoveAdmin(admin.email)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove Admin"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                {admin.role !== "super_admin" && (
                  <div className="hidden sm:flex items-center gap-2">
                    {admin.role === "teams_admin" && (
                      <>
                        {admin.linkedPlayerName ? (
                          <button
                            onClick={() => handleUnlinkPlayer(admin)}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Unlink Player"
                          >
                            <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLinkPlayer(admin)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Link Player"
                          >
                            <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleRemoveAdmin(admin.email)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove Admin"
                    >
                      <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewEmail("");
                setError("");
              }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              Add Teams Admin
            </h3>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="friend@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                  required
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  This person will be able to edit team points in the Teams
                  admin section.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmail("");
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAdmin}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingAdmin ? "Adding..." : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Player Modal */}
      {showLinkModal && linkingAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto relative">
            <button
              onClick={() => {
                setShowLinkModal(false);
                setLinkingAdmin(null);
                setPlayerSearchValue("");
                setSelectedPlayer(null);
                setError("");
              }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              Link Player to {linkingAdmin.email}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search Player
                </label>
                <NameAutocomplete
                  value={playerSearchValue}
                  onValueChange={setPlayerSearchValue}
                  onPlayerSelect={setSelectedPlayer}
                  placeholder="Search for a player to link..."
                  error={error}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  This player will be able to log in as teams_admin using their
                  player credentials.
                </p>
              </div>

              {selectedPlayer && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Selected: {selectedPlayer.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Category: {selectedPlayer.category}
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkingAdmin(null);
                    setPlayerSearchValue("");
                    setSelectedPlayer(null);
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLink}
                  disabled={!selectedPlayer || linkingInProgress}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {linkingInProgress ? "Linking..." : "Link Player"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
