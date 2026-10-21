import React, { useState } from "react";
import {
  Heart,
  Home,
  LogOut,
  MessageCircle,
  PlusSquare,
  LayoutGrid,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { USER_API_END_POINT } from "@/utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "@/redux/authSlice";
import CreatePost from "./CreatePost";
import NotificationDrawer from "./NotificationDrawer";
import BloomLogo from "@/components/ui/BloomLogo";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { likeNotification } = useSelector((store) => store.realTimeNotification);
  const { selectedUser } = useSelector((store) => store.chat);
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const isInActiveChat = location.pathname === "/chat" && Boolean(selectedUser);

  const logoutHandler = async () => {
    try {
      const res = await axios.get(`${USER_API_END_POINT}/logout`, {
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(setAuthUser(null));
        toast.success(res.data.message);
        navigate("/login", { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const sidebarHandler = (textType) => {
    if (textType === "Logout") {
      logoutHandler();
    } else if (textType === "Home") {
      setIsNotificationOpen(false);
      navigate("/");
    } else if (textType === "Gallery") {
      setIsNotificationOpen(false);
      navigate("/gallery");
    } else if (textType === "Messages") {
      setIsNotificationOpen(false);
      navigate("/chat");
    } else if (textType === "Profile") {
      setIsNotificationOpen(false);
      navigate(`/profile/${user?._id || "my_profile"}`);
    } else if (textType === "Create") {
      setIsNotificationOpen(false);
      setOpen(true);
    } else if (textType === "Notifications") {
      setIsNotificationOpen((prev) => !prev);
    }
  };

  const navItems = [
    {
      icon: <Home className="w-6 h-6 stroke-[2]" />,
      text: "Home",
    },
    {
      icon: <LayoutGrid className="w-6 h-6 stroke-[2]" />,
      text: "Gallery",
    },
    {
      icon: <MessageCircle className="w-6 h-6 stroke-[2]" />,
      text: "Messages",
    },
    {
      icon: (
        <Heart
          className={`w-6 h-6 stroke-[2] transition-colors ${
            isNotificationOpen ? "fill-neutral-900 text-neutral-900" : ""
          }`}
        />
      ),
      text: "Notifications",
      badge: likeNotification?.length || 0,
      active: isNotificationOpen,
    },
    {
      icon: <PlusSquare className="w-6 h-6 stroke-[2]" />,
      text: "Create",
    },
    {
      icon: (
        <Avatar className="w-6 h-6 border border-neutral-300">
          <AvatarImage src={user?.profilePicture} alt="Profile" />
          <AvatarFallback className="text-[10px] font-bold">
            {user?.username?.slice(0, 2).toUpperCase() || "CN"}
          </AvatarFallback>
        </Avatar>
      ),
      text: "Profile",
    },
  ];

  const sidebarExpanded = isHovered && !isNotificationOpen;

  return (
    <>
      {/* Mobile Top Header (Bloom L00M Header for Phone) */}
      {!isInActiveChat && (
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 z-40 px-4 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <BloomLogo variant="dark" className="w-7 h-7 object-contain" />
            <span className="font-bold text-2xl tracking-tight text-neutral-900 font-serif italic">
              Bloom L00M
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Heart */}
            <button
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className="relative p-1.5 text-neutral-800 hover:text-black transition-transform active:scale-95"
              aria-label="Notifications"
            >
              <Heart
                className={`w-6 h-6 stroke-[2] ${
                  isNotificationOpen ? "fill-neutral-900 text-neutral-900" : ""
                }`}
              />
              {likeNotification?.length > 0 && !isNotificationOpen && (
                <span className="absolute top-0 right-0 bg-red-600 text-white rounded-full text-[10px] min-w-4 h-4 px-1 flex items-center justify-center font-bold">
                  {likeNotification.length}
                </span>
              )}
            </button>

            {/* Direct Message Icon */}
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="relative p-1.5 text-neutral-800 hover:text-black transition-transform active:scale-95"
              aria-label="Messages"
            >
              <MessageCircle className="w-6 h-6 stroke-[2]" />
            </button>
          </div>
        </header>
      )}

      {/* Desktop Left Sidebar */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out select-none flex-col justify-between ${
          sidebarExpanded ? "w-60 shadow-2xl px-3" : "w-[72px] px-2 shadow-none"
        }`}
      >
        <div className="flex flex-col">
          {/* Top Logo: Glyph when collapsed or when Notifications open; Glyph + Name when hovered */}
          <div className="pt-6 pb-4 mb-2">
            <div
              onClick={() => {
                setIsNotificationOpen(false);
                navigate("/");
              }}
              className={`flex items-center gap-3 cursor-pointer rounded-xl transition-colors ${
                sidebarExpanded
                  ? "px-3 py-2 hover:bg-neutral-100"
                  : "justify-center py-2 hover:bg-neutral-100"
              }`}
              title="Home"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <BloomLogo
                  variant="dark"
                  className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
                />
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
                  sidebarExpanded
                    ? "w-auto opacity-100 translate-x-0"
                    : "w-0 opacity-0 -translate-x-3 pointer-events-none"
                }`}
              >
                <span className="font-bold text-xl tracking-tight text-neutral-900 font-serif">
                  Bloom L00M
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isItemActive = item.active;

              return (
                <div
                  key={item.text}
                  onClick={() => sidebarHandler(item.text)}
                  className={`group relative flex items-center rounded-xl cursor-pointer transition-all duration-200 ${
                    isItemActive
                      ? "bg-neutral-100 text-neutral-950 font-semibold"
                      : "text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100"
                  } ${
                    sidebarExpanded
                      ? "px-3 py-3 gap-4"
                      : "justify-center py-3 px-0"
                  }`}
                  title={!sidebarExpanded ? item.text : undefined}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    {item.icon}
                    {item.badge > 0 && !isNotificationOpen && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full text-[10px] min-w-4 h-4 px-1 flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                      sidebarExpanded
                        ? "w-auto opacity-100 translate-x-0"
                        : "w-0 opacity-0 -translate-x-3 pointer-events-none"
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions: Logout */}
        <div className="pb-4 flex flex-col gap-1 border-t border-neutral-100 pt-3">
          <div
            onClick={logoutHandler}
            className={`group relative flex items-center rounded-xl cursor-pointer transition-all duration-200 text-red-600 hover:bg-red-50 ${
              sidebarExpanded ? "px-3 py-3 gap-4" : "justify-center py-3 px-0"
            }`}
            title={!sidebarExpanded ? "Logout" : undefined}
          >
            <div className="shrink-0 flex items-center justify-center">
              <LogOut className="w-6 h-6 stroke-[2]" />
            </div>

            <span
              className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                sidebarExpanded
                  ? "w-auto opacity-100 translate-x-0"
                  : "w-0 opacity-0 -translate-x-3 pointer-events-none"
              }`}
            >
              Logout
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Instagram Bottom Bar for Phone) */}
      {!isInActiveChat && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 z-40 flex items-center justify-around px-2 select-none">
          {/* Home */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className={`p-2 transition-transform active:scale-90 ${
              location.pathname === "/" ? "text-black" : "text-neutral-500"
            }`}
            aria-label="Home"
          >
            <Home className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Gallery / Explore */}
          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className={`p-2 transition-transform active:scale-90 ${
              location.pathname === "/gallery" ? "text-black" : "text-neutral-500"
            }`}
            aria-label="Gallery"
          >
            <LayoutGrid className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Create Post */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="p-2 text-neutral-900 transition-transform active:scale-90"
            aria-label="Create Post"
          >
            <PlusSquare className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Messages */}
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className={`p-2 transition-transform active:scale-90 relative ${
              location.pathname === "/chat" ? "text-black" : "text-neutral-500"
            }`}
            aria-label="Messages"
          >
            <MessageCircle className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => navigate(`/profile/${user?._id || "my_profile"}`)}
            className="p-1 transition-transform active:scale-90"
            aria-label="Profile"
          >
            <Avatar
              className={`w-7 h-7 border transition-all ${
                location.pathname.startsWith("/profile")
                  ? "border-black ring-2 ring-black"
                  : "border-neutral-300"
              }`}
            >
              <AvatarImage src={user?.profilePicture} alt="Profile" />
              <AvatarFallback className="text-[10px] font-bold">
                {user?.username?.slice(0, 2).toUpperCase() || "CN"}
              </AvatarFallback>
            </Avatar>
          </button>
        </nav>
      )}

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <CreatePost open={open} setOpen={setOpen} />
    </>
  );
};

export default LeftSidebar;
