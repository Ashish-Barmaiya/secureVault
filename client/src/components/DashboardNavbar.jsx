"use client";

import { useDispatch, useSelector } from "react-redux";
import { persistor } from "@/store/store";
import { Bell, Settings, UserCircle2, Menu } from "lucide-react";
import { Vault } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { logout } from "@/store/userSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearVaultKey } from "@/store/vaultSlice";
import { toast } from "react-toastify";
import { authFetch } from "@/utils/authFetch";
import { useState } from "react";

export default function DashboardNavbar() {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await authFetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        dispatch(logout());
        dispatch(clearVaultKey());
        persistor.purge();
        router.push("/");
        toast.success("Logged out successfully");
      } else {
        toast.error("Logout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error during logout");
    }
  };

  return (
    <>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0f172a] md:hidden">
          <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
            <Link href="/" className="flex items-center gap-2">
              <Vault className="h-7 w-7 text-blue-500" />
              <div className="text-xl font-bold text-white">
                Secure<span className="text-blue-500">Vault</span>
              </div>
            </Link>
            <button
              className="text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Menu size={24} />
            </button>
          </div>

          <nav className="flex flex-col p-6 space-y-6 ">
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <UserCircle2 className="w-6 h-6 text-blue-500" />
                <span className="text-blue-400">
                  {user?.name || user?.email || "User"}
                </span>
              </div>

              <button className="w-full flex items-center gap-3 text-slate-300 hover:text-white py-3 rounded-lg">
                <Bell className="w-5 h-5" />
                Notifications
              </button>

              <button className="w-full flex items-center gap-3 text-slate-300 hover:text-white py-3 rounded-lg">
                <Settings className="w-5 h-5" />
                Settings
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 text-red-400 py-3 rounded-lg hover:bg-red-500/10"
              >
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
          {/* Mobile menu button - only shown on small screens */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Title - centered on all screens */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition mx-auto md:mx-0 group"
          >
            <Vault className="h-8 w-8 text-blue-500 group-hover:text-blue-400 transition-colors hidden sm:block" />
            <div className="text-xl sm:text-2xl font-bold text-white">
              Secure<span className="text-blue-500 group-hover:text-blue-400 transition-colors">Vault</span>
            </div>
          </Link>

          {/* Right controls - hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center gap-6">
            <button className="text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-slate-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* Dropdown User Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 text-sm text-slate-300 font-medium hover:text-white focus:outline-none transition-colors">
                  <UserCircle2 className="w-6 h-6 text-blue-500" />
                  <span className="hidden sm:inline">
                    {user?.name || user?.email || "User"}
                  </span>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={6}
                  className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl p-2 min-w-[180px] text-sm text-slate-300 z-50"
                >
                  <DropdownMenu.Item className="hover:bg-slate-700/50 hover:text-white px-3 py-2 rounded-lg cursor-pointer outline-none transition-colors">
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="hover:bg-slate-700/50 hover:text-white px-3 py-2 rounded-lg cursor-pointer outline-none transition-colors">
                    Settings
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-slate-700 my-2" />
                  <DropdownMenu.Item
                    onClick={handleLogout}
                    className="hover:bg-red-500/10 text-red-400 px-3 py-2 rounded-lg cursor-pointer outline-none transition-colors"
                  >
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>
    </>
  );
}
