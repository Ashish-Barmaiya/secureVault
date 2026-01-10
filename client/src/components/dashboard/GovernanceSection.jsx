import React from "react";
import { Users, Shield, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const GovernanceSection = ({ heirs }) => {
  const router = useRouter();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Heirs Overview */}
      <div className="bg-[#1e293b]/50 border border-slate-700/50 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users className="text-purple-400 h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Heirs Overview</h2>
          </div>
          <button
            onClick={() => router.push("/dashboard/heirs")}
            className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Manage Heirs
          </button>
        </div>

        {heirs && heirs.length > 0 ? (
          <div className="space-y-3">
            {heirs.map((heir) => (
              <div
                key={heir.id}
                className="flex justify-between items-center border border-slate-700/30 bg-slate-800/20 p-3 rounded-xl"
              >
                <div>
                  <p className="font-medium text-slate-200">{heir.name}</p>
                  <p className="text-xs text-slate-500">
                    Linked since {new Date().getFullYear()}
                  </p>{" "}
                  {/* Placeholder date */}
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    heir.linkStatus === "LINKED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  }`}
                >
                  {heir.linkStatus === "LINKED" ? "Linked" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-700 rounded-xl">
            <p className="text-slate-500 text-sm mb-2">No heirs designated</p>
            <p className="text-xs text-slate-600">
              Designate an heir to ensure asset continuity.
            </p>
          </div>
        )}
      </div>

      {/* Inheritance Rules (Read-Only) */}
      <div className="bg-[#1e293b]/50 border border-slate-700/50 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-blue-400 h-5 w-5" />
          <h2 className="text-lg font-semibold text-white">
            Inheritance Rules
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700/30 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="text-slate-400 h-4 w-4" />
              <span className="text-slate-300 text-sm">Inactivity Period</span>
            </div>
            <span className="text-white font-medium">90 Days</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-700/30 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-slate-400 h-4 w-4" />
              <span className="text-slate-300 text-sm">Grace Period</span>
            </div>
            <span className="text-white font-medium">30 Days</span>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg mt-4">
            <p className="text-xs text-blue-300 leading-relaxed">
              <span className="font-bold">Immutable Rule:</span> If no liveness
              is detected for 90 days, the grace period begins. If no action is
              taken within 30 days, custody transfers to verified heirs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceSection;
