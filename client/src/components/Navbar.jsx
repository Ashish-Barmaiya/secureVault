// components/Navbar.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Vault, Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { login } from "@/store/userSlice";
import { toast } from "react-toastify";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user); // Get user from Redux store
  const heir = useSelector((state) => state.heir.heir); // Get heir from Redux store

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * TODO: Google OAuth Redirect Handling
   */
  // Effect to handle Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const userName = params.get("userName");
    const userEmail = params.get("userEmail");
    const authError = params.get("authError");

    // Handle Google login success
    if (userId && userEmail && !user) {
      // Only process if user not already in Redux
      const googleUser = {
        id: userId,
        name: userName || "Google User", // Provide a default name if not present
        email: userEmail,
        // Add other fields if your userSlice expects them and they are sent via URL
        // In a real app, you might make an API call here to /api/auth/me to get the full user object
        // if the URL params are insufficient.
      };

      dispatch(login(googleUser));
      // Remove the query parameters from the URL
      router.replace("/dashboard", undefined, { shallow: true });
      // Optionally close the sign-in dialog if it was open
      setOpen(false);
    } else if (authError) {
      // Handle Google login failure
      alert(
        `Google login failed: ${
          authError === "google"
            ? "Authentication failed with Google."
            : "Unknown error."
        }`
      );
      router.replace("/", undefined, { shallow: true }); // Clean up the URL
    }
  }, [router, dispatch, user]); // Re-run effect if router, dispatch, or user state changes

  const handleSignIn = async (e) => {
    e.preventDefault();

    const result = signInSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Fresh user from backend:", data.user); // check twoFactorEnabled here
        dispatch(login(data.user));
        router.push("/dashboard?user=" + data.user.id);
        // Close the sign-in dialog
        setOpen(false);
        toast.success("Login successful");
      } else {
        toast.error("Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleGoogleSignInClick = () => {
    // This initiates the Google OAuth flow by redirecting the browser
    // to your backend's Google authentication route.
    // The backend will then handle the OAuth process and redirect back.
    window.location.href = "http://localhost/auth/auth/google";
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <Vault className="h-8 w-8 text-blue-500 group-hover:text-blue-400 transition-colors" />
          <div className="text-2xl font-bold text-white">
            Secure<span className="text-blue-500 group-hover:text-blue-400 transition-colors">Vault</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <nav className="flex gap-6">
            <Link
              href="#features"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#security"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Security
            </Link>
            <Link
              href="#pricing"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              FAQ
            </Link>
            <Link
              href={heir ? "/heir/dashboard" : "/heir/login"}
              // className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <span className="relative z-10 hover:text-white text-sm font-medium text-slate-300 group-hover:text-blue-400 flex items-center gap-2 ">
                {/* <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> */}
                Heir Portal
              </span>
            </Link>
          </nav>

          <div className="h-5 w-px bg-slate-700"></div>

          {user ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
            >
              Dashboard
            </button>
          ) : (
            <>
              <Dialog.Root open={open} onOpenChange={setOpen}>
                <Dialog.Trigger asChild>
                  <button className="text-slate-300 hover:text-white transition-colors font-medium">
                    Sign In
                  </button>
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                  <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 p-8">
                    <Dialog.Title className="text-2xl font-bold text-white text-center mb-8">
                      Welcome Back
                    </Dialog.Title>

                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div>
                        <input
                          type="email"
                          placeholder="Email address"
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-2 ml-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <input
                          type="password"
                          placeholder="Password"
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        {errors.password && (
                          <p className="text-red-400 text-sm mt-2 ml-1">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
                      >
                        Sign In
                      </button>
                    </form>

                    <div className="my-6 flex items-center">
                      <div className="h-px bg-slate-800 flex-grow"></div>
                      <span className="px-4 text-slate-500 text-sm">OR</span>
                      <div className="h-px bg-slate-800 flex-grow"></div>
                    </div>

                    <button
                      onClick={handleGoogleSignInClick} // Call the new handler
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-slate-900 py-3.5 rounded-xl font-medium transition-colors"
                    >
                      <img src="/google.png" alt="Google" className="h-5 w-5" />
                      <span>Continue with Google</span>
                    </button>

                    <Dialog.Close asChild>
                      <button
                        className="absolute top-4 right-4 text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-all"
                        aria-label="Close"
                      >
                        <X size={20} />
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-slate-300 hover:text-white"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-[#0f172a] md:hidden">
            <div className="flex justify-between items-center px-4 py-6 border-b border-slate-800">
              <Link href="/" className="flex items-center gap-2">
                <Vault className="h-8 w-8 text-blue-500" />
                <div className="text-2xl font-bold text-white">
                  Secure<span className="text-blue-500">Vault</span>
                </div>
              </Link>
              <button
                className="text-slate-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex flex-col p-6 space-y-6">
              <Link
                href="#features"
                className="text-slate-300 hover:text-white text-lg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#security"
                className="text-slate-300 hover:text-white text-lg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Security
              </Link>
              <Link
                href="#pricing"
                className="text-slate-300 hover:text-white text-lg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="text-slate-300 hover:text-white text-lg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                href={heir ? "/heir/dashboard" : "/heir/login"}
                className="flex items-center gap-3 text-slate-300 hover:text-white text-lg py-2 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Heir Portal
              </Link>

              <div className="pt-8 border-t border-slate-800 space-y-4">
                {user ? (
                  <button
                    onClick={() => {
                      router.push("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      Sign In
                    </button>
                    <Link
                      href="/signup"
                      className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium text-center shadow-lg shadow-blue-500/20"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
