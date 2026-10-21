import React, { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { readFileAsDataURL } from "@/lib/utils";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constants";
import { setAuthUser, setUserProfile } from "@/redux/authSlice";
import { toast } from "sonner";
import {
  Loader2,
  Camera,
  User as UserIcon,
  FileText,
  Sparkles,
  ArrowLeft,
  Check,
  ShieldCheck,
  Upload,
} from "lucide-react";

const EditProfile = () => {
  const imageRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((store) => store.auth);

  const [bio, setBio] = useState(user?.bio || "");
  const [gender, setGender] = useState(user?.gender || "male");
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profilePicture || "");
  const [loading, setLoading] = useState(false);

  const fileChangeHandler = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      try {
        const dataUrl = await readFileAsDataURL(selectedFile);
        setImagePreview(dataUrl);
      } catch {
        toast.error("Failed to read image");
      }
    }
  };

  const editProfileHandler = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("bio", bio);
      formData.append("gender", gender);
      if (file) {
        formData.append("profilePicture", file);
      }

      const res = await axios.post(
        `${USER_API_END_POINT}/profile/edit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        const updatedUser = res.data.user;
        dispatch(setAuthUser(updatedUser));
        dispatch(setUserProfile(updatedUser));
        toast.success(res.data.message || "Profile updated successfully");
        navigate(`/profile/${user?._id}`);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] w-full flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-hidden bg-neutral-50/60">
      {/* ================= LIGHT AESTHETIC BACKGROUND VISUALS ================= */}
      {/* Subtle modern dot-grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Floating soft pastel orbs (Light, subtle, aesthetic - not dark) */}
      <div className="absolute -top-28 -left-28 w-96 h-96 bg-gradient-to-br from-pink-200/50 via-purple-200/35 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-gradient-to-bl from-sky-200/50 via-indigo-200/35 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-gradient-to-tr from-amber-200/40 via-rose-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Decorative subtle circles in background */}
      <div className="absolute top-12 right-20 w-32 h-32 rounded-full border border-purple-200/60 pointer-events-none opacity-40 hidden md:block" />
      <div className="absolute bottom-16 left-16 w-44 h-44 rounded-full border border-sky-200/60 pointer-events-none opacity-40 hidden md:block" />

      {/* ================= MAIN CENTERED FORM CARD ================= */}
      <div className="relative z-10 w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-neutral-200/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] rounded-3xl p-6 sm:p-10 my-4 transition-all">
        {/* Header with back button & title */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-2xl text-neutral-900 tracking-tight">
                  Edit Profile
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Profile Settings
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Update your avatar, personal bio, and public account information
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="mt-8 space-y-7">
          {/* ================= AVATAR & USER PROFILE CARD (ENLARGED) ================= */}
          <div className="relative group bg-gradient-to-r from-neutral-50 via-purple-50/20 to-neutral-50 rounded-2xl p-5 sm:p-6 border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 transition-all hover:border-purple-200">
            <div className="flex items-center gap-5">
              {/* Profile Avatar (Enlarged to 88px with glowing ring) */}
              <div className="relative shrink-0">
                <Avatar className="w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 ring-white shadow-md border border-neutral-200 overflow-hidden">
                  <AvatarImage
                    src={imagePreview}
                    alt={user?.username}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-xl sm:text-2xl font-bold bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
                    {user?.username?.slice(0, 2).toUpperCase() || "CN"}
                  </AvatarFallback>
                </Avatar>

                {/* Quick Camera Overlay button on Avatar */}
                <button
                  type="button"
                  onClick={() => imageRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0095F6] hover:bg-[#1877F2] text-white flex items-center justify-center shadow-md ring-2 ring-white transition-transform hover:scale-110 cursor-pointer"
                  title="Upload new photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base sm:text-lg text-neutral-900 truncate">
                    {user?.username}
                  </h2>
                  {user?.isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 font-medium truncate mt-0.5 max-w-[260px] sm:max-w-xs">
                  {user?.bio || "No bio set yet"}
                </p>
                <span className="text-[11px] text-neutral-400 block mt-1">
                  JPG, PNG or GIF • Recommended square ratio
                </span>
              </div>
            </div>

            {/* Hidden file input & Change Photo Button */}
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={fileChangeHandler}
            />
            <Button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-semibold text-xs sm:text-sm h-10 px-5 rounded-xl shadow-sm transition-all hover:shadow hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-neutral-600" />
              <span>Change photo</span>
            </Button>
          </div>

          {/* ================= BIO SECTION (ENLARGED & POLISHED) ================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-semibold text-sm text-neutral-800">
                <FileText className="w-4 h-4 text-[#0095F6]" />
                <span>Bio</span>
              </label>
              <span className="text-xs text-neutral-400 font-medium">
                {bio.length}/150 characters
              </span>
            </div>
            <div className="relative">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                name="bio"
                placeholder="Share a short bio, your passions, or a favorite quote..."
                className="w-full text-sm sm:text-base min-h-[115px] p-4 rounded-2xl border-neutral-200/90 bg-neutral-50/50 hover:bg-white focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0095F6]/30 focus-visible:border-[#0095F6] transition-all resize-none shadow-sm leading-relaxed"
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              Brief details about yourself visible to anyone viewing your profile.
            </p>
          </div>

          {/* ================= GENDER SECTION (ENLARGED & POLISHED) ================= */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-semibold text-sm text-neutral-800">
              <UserIcon className="w-4 h-4 text-[#0095F6]" />
              <span>Gender</span>
            </label>
            <Select defaultValue={gender} onValueChange={(val) => setGender(val)}>
              <SelectTrigger className="w-full h-12 text-sm sm:text-base px-4 rounded-2xl border-neutral-200/90 bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#0095F6]/30 focus:border-[#0095F6] transition-all shadow-sm">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-xl border-neutral-200">
                <SelectGroup>
                  <SelectItem value="male" className="py-2.5 rounded-xl cursor-pointer">
                    Male
                  </SelectItem>
                  <SelectItem value="female" className="py-2.5 rounded-xl cursor-pointer">
                    Female
                  </SelectItem>
                  <SelectItem value="other" className="py-2.5 rounded-xl cursor-pointer">
                    Prefer not to say
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-neutral-400">
              This won't be part of your public bio.
            </p>
          </div>

          {/* ================= ACTION BUTTONS (SUBMIT & CANCEL) ================= */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-neutral-600 hover:text-neutral-900 font-semibold text-sm h-11 px-6 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </Button>

            {loading ? (
              <Button
                disabled
                className="h-11 px-8 rounded-xl bg-[#0095F6] text-white font-semibold text-sm shadow-md shadow-sky-500/20"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving changes...
              </Button>
            ) : (
              <Button
                type="button"
                onClick={editProfileHandler}
                className="h-11 px-8 rounded-xl bg-gradient-to-r from-[#0095F6] to-[#007cd1] hover:from-[#1877F2] hover:to-[#006bb8] text-white font-semibold text-sm shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Submit</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
