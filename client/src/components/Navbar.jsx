"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Vault } from "lucide-react";
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
        // Redux login state
        dispatch(login(data.user)); // assuming backend returns `user` object
        router.push("/dashboard?user=" + data.user.id); // redirect to dashboard with user ID
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <header className="w-full flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2">
        <Vault className="h-8 w-8 text-blue-600" />
        <div className="text-2xl font-bold text-slate-700">
          Secure<span className="text-blue-600">Vault</span>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        {user ? (
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Go to Dashboard
          </button>
        ) : (
          <>
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button className="text-gray-700 hover:text-blue-700 hover:border-b-2 border-orange-400 transition px-1 mx-1 text-lg ">
                  Sign In
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white rounded-md shadow-lg p-6">
                  <Dialog.Title className="text-xl text-slate-800 font-semibold text-center mb-4">
                    Sign In
                  </Dialog.Title>

                  <form
                    onSubmit={handleSignIn}
                    className="space-y-4 text-slate-700"
                  >
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-2 border rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      {errors.email && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      {errors.password && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Sign In
                    </button>
                  </form>

                  <div className="my-4 flex items-center justify-center">
                    <div className="h-px bg-gray-300 w-full"></div>
                    <span className="px-2 text-gray-500 text-sm">OR</span>
                    <div className="h-px bg-gray-300 w-full"></div>
                  </div>

                  <button
                    onClick={() => (window.location.href = "/api/auth/google")}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded hover:bg-gray-100"
                  >
                    <img src="/google.png" alt="Google" className="h-5 w-5" />
                    <span className="text-slate-700">Continue with Google</span>
                  </button>

                  <Dialog.Close asChild>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-black"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              Get Started
            </button>
          </>
        )}
      </div>
    </header>
  );
}
