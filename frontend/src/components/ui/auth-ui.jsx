"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { USER_API_END_POINT } from "@/utils/constants";
import { setAuthUser } from "@/redux/authSlice";
import bloomAuthBg from "@/assets/bloom-auth.jpg";
import BloomLogo from "@/components/ui/BloomLogo";

export function Typewriter({
  text,
  speed = 70,
  cursor = "|",
  loop = true,
  deleteSpeed = 40,
  delay = 2000,
  className = "",
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse font-normal ml-0.5">{cursor}</span>
    </span>
  );
}

const PasswordInput = React.forwardRef(
  ({ className = "", label = "Password", id: customId, ...props }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
      <div className="grid w-full items-center gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground/90">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            type={showPassword ? "text" : "password"}
            className={`flex h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 pe-10 text-sm text-neutral-900 shadow-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function SignInForm({ onToggle }) {
  const [input, setInput] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        toast.success(res.data.message);
        navigate("/", { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <BloomLogo variant="dark" className="w-14 h-14 object-contain" />
        <h1 className="font-cursive-bloom text-5xl tracking-wide text-foreground pt-1 select-none">
          Bloom
        </h1>
        <h2 className="text-lg font-semibold text-foreground/90 mt-1">
          Sign in to your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Let's get back there.
        </p>
      </div>

      <div className="grid gap-4 mt-2">
        <div className="grid gap-1.5">
          <label htmlFor="signin-email" className="text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            type="text"
            placeholder="m@example.com (or admin.email)"
            value={input.email}
            onChange={changeEventHandler}
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            className="flex h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
        </div>

        <PasswordInput
          id="signin-password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={input.password}
          onChange={changeEventHandler}
          required
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-neutral-900 text-white font-medium text-sm transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </div>

      <div className="text-center text-sm text-neutral-500">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onToggle}
          className="font-semibold text-neutral-900 underline-offset-4 hover:underline ml-1"
        >
          Sign up
        </button>
      </div>
    </form>
  );
}

function SignUpForm({ onToggle }) {
  const [input, setInput] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${USER_API_END_POINT}/register`, input, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Account created! Please sign in.");
        onToggle();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <BloomLogo variant="dark" className="w-14 h-14 object-contain" />
        <h1 className="font-cursive-bloom text-5xl tracking-wide text-neutral-900 pt-1 select-none">
          Bloom
        </h1>
        <h2 className="text-lg font-semibold text-neutral-800 mt-1">
          Create an account
        </h2>
        <p className="text-sm text-neutral-500">
          A new chapter awaits.
        </p>
      </div>

      <div className="grid gap-4 mt-2">
        <div className="grid gap-1.5">
          <label htmlFor="signup-username" className="text-sm font-medium text-neutral-700">
            Username
          </label>
          <input
            id="signup-username"
            name="username"
            type="text"
            placeholder="johndoe"
            value={input.username}
            onChange={changeEventHandler}
            required
            autoComplete="username"
            className="flex h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            placeholder="m@example.com"
            value={input.email}
            onChange={changeEventHandler}
            required
            autoComplete="email"
            className="flex h-11 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
        </div>

        <PasswordInput
          id="signup-password"
          name="password"
          label="Password"
          placeholder="Create a strong password"
          value={input.password}
          onChange={changeEventHandler}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-neutral-900 text-white font-medium text-sm transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </div>

      <div className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onToggle}
          className="font-semibold text-neutral-900 underline-offset-4 hover:underline ml-1"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}

export function AuthUI({ initialMode = "signIn" }) {
  const [isSignIn, setIsSignIn] = useState(initialMode === "signIn");
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const toggleForm = () => {
    setIsSignIn((prev) => !prev);
  };

  const bannerContent = isSignIn
    ? {
        quote: "Welcome back. Let's get back there.",
        subtitle: "Rediscover moments, stories, and connections.",
      }
    : {
        quote: "A new chapter awaits. Start blooming.",
        subtitle: "Share your life, inspire others, and build your circle.",
      };

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-white">
      {/* LEFT COLUMN: Pinterest aesthetic image banner */}
      <div
        className="hidden md:block relative bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${bloomAuthBg})` }}
      >
        {/* Soft dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <BloomLogo variant="white" className="w-11 h-11 object-contain drop-shadow" />
            <span className="font-cursive-bloom text-4xl tracking-wide text-white drop-shadow pt-1 select-none">
              Bloom
            </span>
          </div>

          {/* Bottom Typewriter Quote */}
          <div className="space-y-3 max-w-lg pb-6">
            <blockquote className="space-y-2">
              <p className="text-2xl font-medium leading-snug tracking-tight text-white/95">
                “
                <Typewriter
                  key={bannerContent.quote}
                  text={bannerContent.quote}
                  speed={55}
                />
                ”
              </p>
              <p className="text-sm font-light text-white/70">
                {bannerContent.subtitle}
              </p>
            </blockquote>
            <cite className="block text-xs font-medium uppercase tracking-widest text-white/50 not-italic pt-1">
              — Bloom
            </cite>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Auth Form */}
      <div className="flex h-screen items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-[360px]">
          {isSignIn ? (
            <SignInForm onToggle={toggleForm} />
          ) : (
            <SignUpForm onToggle={toggleForm} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthUI;
