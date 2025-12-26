"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Vault,
  LogOut,
  Shield,
  Key,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import HeirTwoFactorAuthModal from "@/components/HeirTwoFactorAuthModal";
import { authFetch } from "@/utils/authFetch";
import { useDispatch, useSelector } from "react-redux";
import { logoutHeir, updateHeir } from "@/store/heirSlice";
import HeirNavbar from "@/components/HeirNavbar";
import HeirKeySetup from "@/components/HeirKeySetup";
import HeirRequestCard from "@/components/HeirRequestCard";

export default function HeirDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const heirData = useSelector((state) => state.heir.heir);
  const isLoggedIn = useSelector((state) => state.heir.isLoggedIn);

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/heir/login");
      return;
    }

    const fetchHeirData = async () => {
      try {
        const res = await authFetch("/api/heir/auth/me");
        const data = await res.json();
        if (data.success) {
          dispatch(updateHeir(data.heir));
        }
      } catch (e) {
        console.error(e);
      }
    };

    const fetchPendingRequests = async () => {
      try {
        const res = await authFetch("/api/heir/pending-requests");
        const data = await res.json();
        if (data.success && data.hasRequest) {
          setPendingRequest(data.request);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchHeirData();
    fetchPendingRequests();
  }, [dispatch, isLoggedIn, router]);

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = async () => {
    await authFetch("/api/heir/auth/logout", { method: "POST" });
    dispatch(logoutHeir());
    router.push("/heir/login");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <HeirNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">
            Manage your inherited assets and verify your identity.
          </p>
        </div>

        {pendingRequest && (
          <HeirRequestCard
            request={pendingRequest}
            onRespond={(accepted) => {
              setPendingRequest(null);
              if (accepted) {
                alert("You have successfully linked with the user.");
                // Optionally refresh heir data
              }
            }}
          />
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Status Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  heirData?.twoFactorEnabled
                    ? "bg-green-500/10 text-green-400"
                    : "bg-orange-500/10 text-orange-400"
                }`}
              >
                {heirData?.twoFactorEnabled ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">2FA Security</h3>
                <p
                  className={`text-sm ${
                    heirData?.twoFactorEnabled
                      ? "text-green-400"
                      : "text-orange-400"
                  }`}
                >
                  {heirData?.twoFactorEnabled
                    ? "Enabled & Secure"
                    : "Action Required"}
                </p>
              </div>
            </div>
            {!heirData?.twoFactorEnabled && (
              <button
                onClick={() => setShow2FAModal(true)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Enable 2FA
              </button>
            )}
          </div>

          {/* Keys Card */}
          <div>
            <HeirKeySetup
              heir={heirData}
              onSetupComplete={() => {
                dispatch(updateHeir({ isVerified: true }));
              }}
            />
          </div>

          {/* Linked User Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Linked Account</h3>
                <p className="text-sm text-slate-400">
                  {heirData?.user ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>
            {heirData?.user ? (
              <div>
                <p className="text-sm text-slate-300 font-medium">
                  {heirData.user.name}
                </p>
                <p className="text-xs text-slate-500">{heirData.user.email}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full w-fit">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Link
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                You are not linked to any user account yet.
              </p>
            )}
          </div>

          {/* Assets Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Inherited Vaults</h3>
                <p className="text-sm text-slate-400">0 Vaults Available</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Waiting for grant access</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Available Vaults</h2>

        {/* Empty State */}
        <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Vault className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No Vaults Assigned Yet
          </h3>
          <p className="text-slate-400 max-w-md mx-auto">
            When a user designates you as an heir and grants access to their
            vault, it will appear here. Ensure your email matches the one
            provided by the vault owner.
          </p>
        </div>
      </main>

      <HeirTwoFactorAuthModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={() => {
          // Refresh data in Redux
          dispatch(updateHeir({ twoFactorEnabled: true }));
        }}
      />
    </div>
  );
}
