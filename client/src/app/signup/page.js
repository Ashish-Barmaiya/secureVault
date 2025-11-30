// app/signup/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";
import { ShieldCheck, Lock, Mail, User, ArrowRight, RefreshCw } from "lucide-react";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignUpPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculator
  useEffect(() => {
    if (!form.password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Length check
    if (form.password.length >= 8) strength += 25;
    if (form.password.length >= 12) strength += 15;

    // Character diversity
    if (/[A-Z]/.test(form.password)) strength += 15;
    if (/[a-z]/.test(form.password)) strength += 15;
    if (/\d/.test(form.password)) strength += 15;
    if (/[@$!%*?&]/.test(form.password)) strength += 15;

    setPasswordStrength(Math.min(strength, 100));
  }, [form.password]);

  // handle resend countdown
  useEffect(() => {
    let interval;
    if (showOtpDialog && !canResend) {
      interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpDialog, canResend]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = signUpSchema.safeParse(form);
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
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sign up");

      toast.success("OTP sent successfully via Email");
      setShowOtpDialog(true);
      setResendTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      toast.success("User registered successfully");
      router.push("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResend = async () => {
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

      toast.success("OTP resent successfully");
      setResendTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Password strength color
  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="bg-[#1e293b]/50 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700/50 relative z-10">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-8 text-center border-b border-slate-700/50">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Create Secure Account
          </h1>
          <p className="text-slate-400 mt-2">Join our security-first platform</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 text-white pr-3 py-3 bg-slate-900/50 border ${
                    errors.name ? "border-red-500/50 focus:ring-red-500/50" : "border-slate-700 focus:ring-blue-500/50 focus:border-blue-500"
                  } rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-slate-600`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 text-white pr-3 py-3 bg-slate-900/50 border ${
                    errors.email ? "border-red-500/50 focus:ring-red-500/50" : "border-slate-700 focus:ring-blue-500/50 focus:border-blue-500"
                  } rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-slate-600`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 text-white py-3 bg-slate-900/50 border ${
                    errors.password ? "border-red-500/50 focus:ring-red-500/50" : "border-slate-700 focus:ring-blue-500/50 focus:border-blue-500"
                  } rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-slate-600`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              <div className="mt-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-400">
                    Password strength
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {passwordStrength}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
              </div>

              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 text-white pr-3 py-3 bg-slate-900/50 border ${
                    errors.confirmPassword
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : "border-slate-700 focus:ring-blue-500/50 focus:border-blue-500"
                  } rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-slate-600`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            Create Account
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>

      {/* OTP Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-8 text-center border-b border-slate-700/50">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500/10 p-3 rounded-full border border-blue-500/20">
                  <Mail className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">
                Verify Your Email
              </h2>
              <p className="text-slate-400 mt-2">
                Enter the code sent to <span className="text-white font-medium">{form.email}</span>
              </p>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-4 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-center space-x-3">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const newOtp = [...otp];
                        newOtp[i] = e.target.value.replace(/\D/g, "");
                        setOtp(newOtp.join(""));

                        // Auto-focus next input
                        if (e.target.value && i < 5) {
                          document.getElementById(`otp-${i + 1}`)?.focus();
                        }
                      }}
                      id={`otp-${i}`}
                      className="w-12 h-12 text-2xl text-white text-center bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  ))}
                </div>
                <p className="text-center text-red-400 text-sm mt-4">
                  OTP expires in 15 minutes
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleVerifyOtp}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25"
                >
                  Verify & Complete Registration
                </button>

                <button
                  disabled={!canResend}
                  onClick={handleResend}
                  className={`w-full py-3.5 rounded-xl font-medium transition-all ${
                    canResend
                      ? "bg-slate-800 text-blue-400 hover:bg-slate-700"
                      : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {canResend ? (
                    "Resend OTP"
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Resend in {resendTimer}s
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
