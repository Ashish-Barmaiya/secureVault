// components/TwoFactorStatusCard.jsx
import { ShieldCheck, ShieldAlert } from "lucide-react";
import Enable2FAButton from "./Enable2FAButton";

export default function TwoFactorStatusCard({ enabled }) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm max-w-md ${
        enabled
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-orange-50 border border-orange-200"
      }`}
    >
      <div className="flex items-start">
        {enabled ? (
          <ShieldCheck className="h-6 w-6 text-emerald-600 mt-0.5 flex-shrink-0" />
        ) : (
          <ShieldAlert className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
        )}
        <div className="ml-3">
          <h3
            className={`font-medium ${
              enabled ? "text-emerald-800" : "text-orange-700"
            }`}
          >
            {enabled ? "Security Enabled" : "Security Recommendation"}
          </h3>
          <p
            className={`text-sm mt-1 ${
              enabled ? "text-emerald-700" : "text-orange-600"
            }`}
          >
            {enabled
              ? "Two-factor authentication is active on your account"
              : "Enable two-factor authentication to secure your vault"}
          </p>
        </div>
      </div>

      {!enabled && (
        <div className="mt-3">
          <Enable2FAButton />
        </div>
      )}
    </div>
  );
}
