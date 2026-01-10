// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { updateUser } from "@/store/userSlice";
import { Users, ShieldCheck, FileText, Settings } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
import VaultAccessSection from "@/components/VaultAccessSection";
import LivenessStatus from "@/components/LivenessStatus";
import SecurityPostureCard from "@/components/dashboard/SecurityPostureCard";
import GovernanceSection from "@/components/dashboard/GovernanceSection";
import { authFetch } from "@/utils/authFetch";

export default function DashboardPage() {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [heirs, setHeirs] = useState([]);
  const [vaultStatus, setVaultStatus] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user) {
      // Fetch Vault Status
      authFetch("/api/dashboard/vault/liveness-status")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setVaultStatus(data.liveness.state);
        })
        .catch((err) => console.error("Failed to fetch vault status", err));

      // Fetch Recent Activity
      authFetch("/api/audit/logs?limit=5")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setRecentActivity(data.logs);
        })
        .catch((err) => console.error("Failed to fetch activity", err));

      // Fetch User Profile
      authFetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            dispatch(updateUser(data.user));
          }
        })
        .catch((err) => console.error("Failed to fetch user profile", err));
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchHeirs = async () => {
      try {
        const res = await authFetch("/api/user/heirs");
        const data = await res.json();
        if (data.success) {
          setHeirs(data.heirs);
        }
      } catch (err) {
        console.error("Error fetching heirs:", err);
      }
    };

    if (user) {
      fetchHeirs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* 1. Header Section - Identity & High-Level State */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Security Control Panel
            </h1>
            <p className="text-slate-400 mt-2">
              Monitor vault integrity, inheritance protocols, and security
              posture.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
                VAULT STATUS:{" "}
                <span
                  className={`font-bold ${
                    vaultStatus === "ACTIVE"
                      ? "text-emerald-400"
                      : vaultStatus === "GRACE"
                      ? "text-amber-400"
                      : "text-slate-200"
                  }`}
                >
                  {vaultStatus || "LOADING..."}
                </span>
              </span>
              <span className="text-xs text-slate-500">
                Automatic inheritance monitoring enabled
              </span>
            </div>
          </div>

          {/* Security Posture Card (Top Right) */}
          <div className="w-full lg:w-auto min-w-[320px]">
            <SecurityPostureCard
              user={user}
              heirs={heirs}
              vaultStatus={vaultStatus}
            />
          </div>
        </div>

        {/* 2. Governance Overview Section */}
        <GovernanceSection heirs={heirs} />

        {/* 3. Vault Liveness Status (Tightened) */}
        {user?.vaultCreated && <LivenessStatus />}

        {/* 4. Quick Actions (Governance Only) */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Governance Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/dashboard/heirs")}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Users className="text-purple-400 h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-slate-200">Manage Heirs</div>
                <div className="text-xs text-slate-500">
                  Designate or revoke access
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/dashboard/security")} // Assuming this route exists or will exist
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <ShieldCheck className="text-blue-400 h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-slate-200">
                  Security Review
                </div>
                <div className="text-xs text-slate-500">
                  2FA and recovery settings
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/dashboard/audit")}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
            >
              <div className="p-2 bg-slate-500/10 rounded-lg group-hover:bg-slate-500/20 transition-colors">
                <FileText className="text-slate-400 h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-medium text-slate-200">View Audit Log</div>
                <div className="text-xs text-slate-500">
                  Forensic activity trail
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 5. Recent Activity / Audit Preview */}
        <div className="bg-[#1e293b]/50 border border-slate-700/50 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">
              Recent Forensic Activity
            </h2>
            <button
              onClick={() => router.push("/dashboard/audit")}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              View Full Log
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-700/30"
                >
                  <div
                    className={`mt-1.5 w-2 h-2 rounded-full ${
                      log.eventType.includes("VAULT")
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        : log.eventType.includes("HEIR")
                        ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                        : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-slate-300 font-medium font-mono">
                      {log.eventType}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(log.occurredAt).toLocaleString()} •{" "}
                      {log.ipAddress || "Unknown IP"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic">
                No recent activity recorded.
              </p>
            )}
          </div>
        </div>

        {/* 6. Vault Access Section (Isolated at Bottom) */}
        <VaultAccessSection userId={user?.id} />
      </div>
    </div>
  );
}
