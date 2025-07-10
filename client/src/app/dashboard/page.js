// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Vault, Users, Plus, Scan } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
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
    <>
      <DashboardNavbar />
      <div className="p-6 space-y-6 bg-[#f8fbff] min-h-screen">
        <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-gray-700 mb-4">
          Manage your secure digital vault and inheritance settings
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Total Assets</h3>
              <Vault className="text-blue-600 h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {user?.assets?.length || "0"}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Active Heirs</h3>
              <Users className="text-green-600 h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {user?.heirs?.length || "0"}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Security Score</h3>
              <ShieldCheck className="text-green-500 h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">95%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-black h-2 rounded-full w-[95%]" />
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Vault Status</h3>
              <Lock className="text-green-600 h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">Secure</div>
          </div>
        </div>

        {/* Vault Access Section */}
        <VaultAccessSection userId={user?.id} />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-2 justify-center text-white py-2 rounded bg-blue-600 hover:bg-blue-700">
            <Vault size={16} />
            Access Vault
          </button>
          <button className="flex items-center gap-2 justify-center text-white py-2 rounded bg-green-600 hover:bg-green-700">
            <Plus size={16} />
            Add Asset
          </button>
          <button className="flex items-center gap-2 justify-center text-white py-2 rounded bg-purple-600 hover:bg-purple-700">
            <Users size={16} />
            Manage Heirs
          </button>
          <button className="flex items-center gap-2 justify-center text-white py-2 rounded bg-orange-600 hover:bg-orange-700">
            <Scan size={16} />
            Security Check
          </button>
        </div>

        {/* Dashboard Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-700">
                Heirs Status
              </h2>
              <button className="text-sm text-blue-600 hover:underline">
                + Add
              </button>
            </div>
            <div className="border p-3 rounded mb-3">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <p className="font-medium text-slate-800">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">Spouse</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                  verified
                </span>
              </div>
              <p className="text-xs text-gray-400">Last contact: 2 days ago</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold mb-4 text-slate-700">
              Recent Activity
            </h2>
            <div className="flex items-start gap-2 mb-2">
              <div className="mt-1 w-2 h-2 bg-blue-600 rounded-full" />
              <div>
                <p className="text-sm text-slate-700">
                  Added new crypto wallet
                </p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-4 rounded shadow-sm">
            <h3 className="text-orange-600 font-semibold mb-1">
              Security Recommendation
            </h3>
            <p className="text-sm text-orange-700 mb-3">
              Consider enabling two-factor authentication for enhanced security.
            </p>
            <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
