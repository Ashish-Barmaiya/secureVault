// components/HeirNavbar.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Vault, LogOut, Menu, X } from "lucide-react";
import { logoutHeir } from "@/store/heirSlice";
import { authFetch } from "@/utils/authFetch";

export default function HeirNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const heir = useSelector((state) => state.heir.heir);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await authFetch("/api/heir/auth/logout", { method: "POST" });
    dispatch(logoutHeir());
    router.push("/heir/login");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <Vault className="h-8 w-8 text-blue-500 group-hover:text-blue-400 transition-colors" />
          <div className="text-2xl font-bold text-white">
            Secure<span className="text-blue-500 group-hover:text-blue-400 transition-colors">Vault</span>
            <span className="ml-3 text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 align-middle">
              HEIR PORTAL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <nav className="flex gap-6">
             {/* Add any heir specific nav links here if needed */}
          </nav>

          <div className="h-5 w-px bg-slate-700"></div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
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
              <Link href="/heir/dashboard" className="flex items-center gap-2">
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
              <div className="pt-8 border-t border-slate-800 space-y-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
