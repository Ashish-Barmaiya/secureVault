// app/dashboard/page.js
"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Vault, Users, Plus, Scan } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";

export default function DashboardPage() {
  const user = useSelector((state) => state.user.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/"); // Redirect to home if user is not logged in
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Assets"
            value={user?.assets?.length || "0"}
            icon={<Vault className="text-blue-600" />}
          />
          <StatCard
            title="Active Heirs"
            value={user?.heirs?.length || "0"}
            icon={<Users className="text-green-600" />}
          />
          <StatCard
            title="Security Score"
            value="95%"
            icon={<ShieldCheck className="text-green-500" />}
            bar
          />
          <StatCard
            title="Vault Status"
            value="Secure"
            icon={<Lock className="text-green-600" />}
          />
        </div>
        {!user?.vaultCreated && (
          <div className="mt-4 flex justify-center">
            <button
              className="px-8 py-4 bg-gradient-to-r from-teal-700 to-blue-700 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-blue-800 transition-all duration-200"
              onClick={() => {
                // You can add the vault creation POST logic later
                console.log("Vault creation request goes here");
              }}
            >
              🚀 Create Your Secure Vault
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-5 py-6 rounded shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <ActionButton
              text="Access Vault"
              color="blue"
              icon={<Vault size={16} />}
            />
            <ActionButton
              text="Add Asset"
              color="green"
              icon={<Plus size={16} />}
            />
            <ActionButton
              text="Manage Heirs"
              color="purple"
              icon={<Users size={16} />}
            />
            <ActionButton
              text="Security Check"
              color="orange"
              icon={<Scan size={16} />}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Heirs Status */}
          <div className="bg-white p-5 rounded shadow-sm col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-700">
                Heirs Status
              </h2>
              <button className="text-sm text-blue-600 hover:underline">
                + Add
              </button>
            </div>
            <HeirCard
              name="Sarah Johnson"
              relation="Spouse"
              status="verified"
              lastContact="2 days ago"
            />
            <HeirCard
              name="Michael Chen"
              relation="Son"
              status="pending"
              lastContact="1 week ago"
            />
            <HeirCard
              name="Emma Wilson"
              relation="Sister"
              status="verified"
              lastContact="3 days ago"
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-5 rounded shadow-sm col-span-2">
            <h2 className="text-lg font-semibold mb-4 text-slate-700">
              Recent Activity
            </h2>
            <ActivityItem text="Added new crypto wallet" time="2 hours ago" />
            <ActivityItem text="Heir verification completed" time="1 day ago" />
            <ActivityItem text="Security scan completed" time="3 days ago" />
          </div>

          {/* Security Alert */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded shadow-sm col-span-1">
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

// ---------------------- Subcomponents ----------------------

function StatCard({ title, value, icon, bar }) {
  return (
    <div className="bg-white p-4 rounded shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-500">{title}</h3>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {bar && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-black h-2 rounded-full w-[95%]" />
        </div>
      )}
    </div>
  );
}

function ActionButton({ text, color, icon }) {
  const colorMap = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    orange: "bg-orange-600 hover:bg-orange-700",
  };
  return (
    <button
      className={`flex items-center gap-2 justify-center text-white py-2 rounded ${colorMap[color]}`}
    >
      {icon}
      {text}
    </button>
  );
}

function HeirCard({ name, relation, status, lastContact }) {
  const statusColor = status === "verified" ? "green" : "yellow";
  return (
    <div className="border p-3 rounded mb-3">
      <div className="flex justify-between items-center mb-1">
        <div>
          <p className="font-medium text-slate-800">{name}</p>
          <p className="text-sm text-gray-500">{relation}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-600 capitalize`}
        >
          {status}
        </span>
      </div>
      <p className="text-xs text-gray-400">Last contact: {lastContact}</p>
    </div>
  );
}

function ActivityItem({ text, time }) {
  return (
    <div className="flex items-start gap-2 mb-2">
      <div className="mt-1 w-2 h-2 bg-blue-600 rounded-full" />
      <div>
        <p className="text-sm text-slate-700">{text}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}
