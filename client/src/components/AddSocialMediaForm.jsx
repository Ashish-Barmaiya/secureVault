// components/AddSocialMediaForm.jsx
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import { X, Globe, User, Lock } from "lucide-react";

const initialFormState = {
  platform: "",
  usernameOrEmail: "",
  password: "",
};

const platformOptions = [
  "Facebook",
  "Instagram",
  "Twitter / X",
  "LinkedIn",
  "Snapchat",
  "TikTok",
  "Reddit",
  "YouTube",
  "Other",
];

export default function AddSocialMediaForm({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setForm(initialFormState);
  }, [open]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form); // 🔐 will be encrypted before storing
      onOpenChange(false);
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Social Media Account
                </Dialog.Title>
                <Dialog.Description className="text-xs text-gray-500 dark:text-gray-400">
                  Securely store login credentials for any platform
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-zinc-700 rounded-full p-1.5">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform
              </label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="" disabled>
                  Select a platform
                </option>
                {platformOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Username/Email */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                  <User size={16} />
                </div>
                <input
                  name="usernameOrEmail"
                  type="text"
                  placeholder="Enter username or email"
                  value={form.usernameOrEmail}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-lg transition-all shadow hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Securing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Save Account
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
