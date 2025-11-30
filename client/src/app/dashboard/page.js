// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Vault, Users, Plus, Scan } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
import TwoFactorStatusCard from "@/components/TwoFactorStatusCard";
import VaultAccessSection from "@/components/VaultAccessSection";

export default function DashboardPage() {
  const user = useSelector((state) => state.user.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header with Two Columns */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Dashboard
            </h1>
            <p className="text-slate-400 mt-2">
              Manage your secure digital vault and inheritance settings
            </p>
          </div>

          {/* 2FA Status Area */}
          <div className="w-full md:w-auto">
            {user?.twoFactorEnabled ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 shadow-sm max-w-md backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-emerald-400 font-medium">
                      Security Enabled
                    </h3>
                    <p className="text-sm text-emerald-400/80 mt-1">
                      Two-factor authentication is active on your account
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full md:w-auto">
                <TwoFactorStatusCard enabled={user?.twoFactorEnabled} />
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1e293b]/50 border border-slate-700/50 p-5 rounded-2xl shadow-sm flex flex-col gap-3 backdrop-blur-sm hover:bg-[#1e293b]/70 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-slate-400 font-medium">Total Assets</h3>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Vault className="text-blue-400 h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {user?.assets?.length || "0"}
            </div>
          </div>

          <div className="bg-[#1e293b]/50 border border-slate-700/50 p-5 rounded-2xl shadow-sm flex flex-col gap-3 backdrop-blur-sm hover:bg-[#1e293b]/70 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-slate-400 font-medium">Active Heirs</h3>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="text-purple-400 h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {user?.heirs?.length || "0"}
            </div>
          </div>

          <div className="bg-[#1e293b]/50 border border-slate-700/50 p-5 rounded-2xl shadow-sm flex flex-col gap-3 backdrop-blur-sm hover:bg-[#1e293b]/70 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-slate-400 font-medium">Security Score</h3>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <ShieldCheck className="text-emerald-400 h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">95%</div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
              <div className="bg-emerald-500 h-1.5 rounded-full w-[95%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
          </div>

          <div className="bg-[#1e293b]/50 border border-slate-700/50 p-5 rounded-2xl shadow-sm flex flex-col gap-3 backdrop-blur-sm hover:bg-[#1e293b]/70 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-slate-400 font-medium">Vault Status</h3>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Lock className="text-amber-400 h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">Secure</div>
          </div>
        </div>

        {/* Vault Access Section */}
        <VaultAccessSection userId={user?.id} />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-2 justify-center text-white py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 font-medium">
            <Vault size={18} />
            Access Vault
          </button>
          <button className="flex items-center gap-2 justify-center text-white py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 font-medium">
            <Plus size={18} />
            Add Asset
          </button>
          <button className="flex items-center gap-2 justify-center text-white py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20 font-medium">
            <Users size={18} />
            Manage Heirs
          </button>
          <button className="flex items-center gap-2 justify-center text-white py-3 rounded-xl bg-orange-600 hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 font-medium">
            <Scan size={18} />
            Security Check
          </button>
        </div>

        {/* Dashboard Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#1e293b]/50 border border-slate-700/50 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">
                Heirs Status
              </h2>
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                + Add
              </button>
            </div>
            <div className="border border-slate-700/50 bg-slate-800/30 p-4 rounded-xl mb-3 hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <p className="font-medium text-slate-200">Sarah Johnson</p>
                  <p className="text-sm text-slate-500">Spouse</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Last contact: 2 days ago</p>
            </div>
          </div>

          <div className="bg-[#1e293b]/50 border border-slate-700/50 p-6 rounded-2xl shadow-sm md:col-span-2 backdrop-blur-sm">
            <h2 className="text-lg font-semibold mb-6 text-white">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                <div className="mt-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <div>
                  <p className="text-sm text-slate-300 font-medium">
                    Added new crypto wallet
                  </p>
                  <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                </div>
              </div>
              {/* Placeholder for more activity */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
