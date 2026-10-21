import React, { useState, useEffect, useMemo } from "react";
import { X, Trash2, Search, Users, ShieldAlert, Loader2, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constants";
import { setSelectedUser } from "@/redux/chatSlice";
import { toast } from "sonner";

const AdminAccountsDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);


  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch all registered users whenever drawer opens
  useEffect(() => {
    if (!isOpen || !user?.isAdmin) return;

    const fetchAllAccounts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${USER_API_END_POINT}/all-users`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setUsersList(res.data.users || []);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch user accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchAllAccounts();
  }, [isOpen, user?.isAdmin]);

  // Filter accounts by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const q = searchQuery.toLowerCase().trim();
    return usersList.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
    );
  }, [usersList, searchQuery]);

  // Handle Account Deletion
  const handleDeleteAccount = async (targetUser) => {
    if (!targetUser?._id) return;

    if (targetUser._id === user?._id) {
      toast.error("You cannot delete your own admin account.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete @${targetUser.username}'s account? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(targetUser._id);
      const res = await axios.delete(
        `${USER_API_END_POINT}/delete/${targetUser._id}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message || `Account deleted successfully`);
        setUsersList((prev) => prev.filter((u) => u._id !== targetUser._id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[0.5px] transition-opacity duration-300"
      />

      {/* Slide-out Accounts Panel */}
      <aside
        className="fixed top-0 left-0 md:left-[72px] z-50 h-screen w-full sm:w-[397px] max-w-full md:max-w-[calc(100vw-72px)] bg-white border-r border-neutral-200 shadow-2xl flex flex-col transition-all duration-300 ease-out animate-in slide-in-from-left select-none"
      >
        {/* Top Header */}
        <div className="pt-6 px-6 pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-900" />
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Accounts
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                {usersList.length}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
              aria-label="Close accounts panel"
              title="Close"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-100 border border-neutral-200/60 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all text-neutral-800 placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* User Accounts List */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
              <span className="text-xs">Loading database accounts...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              {searchQuery ? "No matching accounts found" : "No accounts registered yet"}
            </div>
          ) : (
            filteredUsers.map((item) => {
              const isCurrentUser = item._id === user?._id;
              const isDeleting = deletingId === item._id;

              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60"
                >
                  {/* Left: Avatar */}
                  <div
                    onClick={() => {
                      navigate(`/profile/${item._id}`);
                      onClose();
                    }}
                    className="relative shrink-0 cursor-pointer"
                  >
                    <Avatar className="w-11 h-11 border border-neutral-200">
                      <AvatarImage
                        src={item.profilePicture}
                        alt={item.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs font-bold bg-neutral-200 text-neutral-700">
                        {item.username?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Middle: Username & Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => {
                          navigate(`/profile/${item._id}`);
                          onClose();
                        }}
                        className="font-semibold text-[13px] text-neutral-900 truncate cursor-pointer hover:underline"
                      >
                        {item.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-900 text-white shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {item.email || "No email"}
                    </p>
                  </div>

                  {/* Right Actions: Message & Delete Buttons */}
                  <div className="shrink-0 flex items-center gap-1">
                    {isCurrentUser ? (
                      <span className="text-[11px] text-neutral-400 font-medium px-2 py-1">
                        Admin
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            dispatch(setSelectedUser(item));
                            navigate("/chat");
                            onClose();
                          }}
                          className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
                          title={`Chat with @${item.username}`}
                          aria-label={`Chat with @${item.username}`}
                        >
                          <MessageCircle className="w-4 h-4 stroke-[2]" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteAccount(item)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                          title={`Delete account @${item.username}`}
                          aria-label={`Delete account @${item.username}`}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          )}
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminAccountsDrawer;
