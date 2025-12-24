// components/HeirTwoFactorVerifyModal.jsx
import { useState } from "react";
import { Loader2, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { authFetch } from "@/utils/authFetch";

export default function HeirTwoFactorVerifyModal({ isOpen, onSuccess }) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const verify2FACode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // We reuse the verify endpoint. It checks the token against the secret.
      // Ideally we should have a specific /validate endpoint, but this works for checking validity.
      const response = await authFetch("/api/heir/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Identity Verified");
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || "Invalid verification code");
      }
    } catch (err) {
      setError("An error occurred while verifying your code");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700 text-white transform transition-all scale-100">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">
            Two-Factor Verification
          </h2>
          <p className="text-slate-400 text-center mb-8">
            Please enter the 6-digit code from your authenticator app to access your dashboard.
          </p>

          <form onSubmit={verify2FACode}>
            <div className="mb-6">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setVerificationCode(value);
                  setError("");
                }}
                className="w-full text-center bg-slate-800/50 text-white tracking-[1em] text-2xl font-mono border border-slate-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-4 transition-all"
                placeholder="000000"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-3 text-center flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Identity"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
