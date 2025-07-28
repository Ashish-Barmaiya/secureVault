// components/Navbar.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Vault, Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { login } from "@/store/userSlice";

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

  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

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
        dispatch(login(data.user));
        router.push("/dashboard?user=" + data.user.id);
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <header className="w-full flex justify-between sticky items-center px-4 sm:px-8 py-5 bg-white shadow-sm">
      <Link href="/" className="flex items-center gap-2 ">
        <Vault className="h-8 w-8 text-blue-600" />
        <div className="text-2xl font-bold text-black/90">
          Secure<span className="text-blue-600">Vault</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-8 items-center">
        <nav className="flex gap-6">
          <Link
            href="#features"
            className="text-gray-600 tracking-wider hover:text-blue-500 transition"
          >
            Features
          </Link>
          <Link
            href="#security"
            className="text-gray-600 tracking-wider hover:text-blue-500 transition"
          >
            Security
          </Link>
          <Link
            href="#pricing"
            className="text-gray-600 tracking-wider hover:text-blue-500 transition"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-gray-600 tracking-wider hover:text-blue-500 transition"
          >
            FAQ
          </Link>
        </nav>

        <div className="h-5 w-px bg-gray-200"></div>

        {user ? (
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
          >
            Dashboard
          </button>
        ) : (
          <>
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button className="text-gray-600 hover:text-blue-500 transition">
                  Sign In
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
                  <Dialog.Title className="text-xl font-bold text-gray-900 text-center mb-6 mt-1">
                    Sign In to SecureVault
                  </Dialog.Title>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium transition-all"
                    >
                      Sign In
                    </button>
                  </form>

                  <div className="my-4 flex items-center">
                    <div className="h-px bg-gray-200 flex-grow"></div>
                    <span className="px-3 text-gray-500 text-sm">OR</span>
                    <div className="h-px bg-gray-200 flex-grow"></div>
                  </div>

                  <button
                    onClick={() =>
                      (window.location.href = "/api/auth/auth/google")
                    }
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <img src="/google.png" alt="Google" className="h-5 w-5" />
                    <span>Continue with Google</span>
                  </button>

                  <Dialog.Close asChild>
                    <button
                      className="absolute top-3 right-4 text-gray-500 hover:text-gray-900 p-1 rounded-full"
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all"
            >
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden text-gray-600 hover:text-blue-600"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-stone-100 backdrop-blur-md md:hidden">
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
              <Vault className="h-7 w-7 text-blue-600" />
              <div className="text-2xl font-bold text-black/90">
                Secure<span className="text-blue-600">Vault</span>
              </div>
            </Link>
            <button
              className="text-gray-600 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex flex-col p-6 space-y-6">
            <Link
              href="#features"
              className="text-gray-600 hover:text-blue-600 text-lg py-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#security"
              className="text-gray-600 hover:text-blue-600 text-lg py-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              Security
            </Link>
            <Link
              href="#pricing"
              className="text-gray-600 hover:text-blue-600 text-lg py-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-gray-600 hover:text-blue-600 text-lg py-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>

            <div className="pt-8 border-t border-gray-200 space-y-4">
              {user ? (
                <button
                  onClick={() => {
                    router.push("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium"
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
                    className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Sign In
                  </button>
                  <Link
                    href="/signup"
                    className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium text-center"
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
    </header>
  );
}
