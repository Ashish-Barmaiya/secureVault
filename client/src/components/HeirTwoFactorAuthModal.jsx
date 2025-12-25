// components/HeirTwoFactorAuthModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { authFetch } from "@/utils/authFetch";

export default function HeirTwoFactorAuthModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = Setup, 2 = Verification
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Start 2FA setup when modal opens
  useEffect(() => {
    if (isOpen && step === 1) {
      start2FASetup();
    }
  }, [isOpen, step]);

  const start2FASetup = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Heir specific endpoint
      const response = await authFetch("/api/heir/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Actually, let's use authFetch if we are using tokens.
      // The heir login sets a cookie? Or returns a token?
      // Let's check heir.auth.controller.js or login response.
      // Login page didn't save token to localStorage. It just pushed router.
      // So it must be cookie based or we missed something.
      // Let's assume cookie based for now as per previous context (express-session).
      // So we need credentials: "include" for fetch, or just use the browser's default behavior if same origin (but it's localhost:5000 vs 3000).
      // We need to be careful.
      // Let's use the same pattern as the previous `Heir2FASetup` page.
      // It used `fetch("http://localhost:5000/heir/auth/2fa/setup")`.
      // If that worked, then cookies are working.

      const data = await response.json();

      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
      } else {
        setError(data.message || "Failed to start 2FA setup");
      }
    } catch (err) {
      setError("An error occurred while setting up 2FA");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FACode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/heir/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Two-Factor Authentication enabled successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1000);
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-700 text-white">
          <div className="p-6">
            {step === 1 && (
              <>
                <h2 className="text-2xl tracking-tight font-bold text-white text-center mb-1 pt-2">
                  Set Up Two-Factor Authentication
                </h2>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-400">Setting up 2FA...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-red-400">{error}</p>
                    </div>
                    <button
                      onClick={start2FASetup}
                      className="mt-3 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-800/50 text-slate-300 rounded-lg p-4 mb-6">
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>
                          Install an authenticator app like Google Authenticator
                          or Authy.
                        </li>
                        <li>Scan the QR code below with your app.</li>
                        <li>Enter the 6-digit code generated by the app.</li>
                      </ol>
                    </div>

                    <div className="flex justify-center mb-6">
                      {qrCodeUrl ? (
                        <div className="bg-white p-4 rounded-lg border border-slate-600">
                          {/* Use standard img tag if Image component has domain issues with data URLs or external */}
                          <img
                            src={qrCodeUrl}
                            alt="2FA QR Code"
                            width={200}
                            height={200}
                            className="mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl w-48 h-48 flex items-center justify-center">
                          <p className="text-slate-500 text-center px-4">
                            QR Code will appear here
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Continue to Verification
                    </button>
                  </>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl tracking-tight font-bold text-white text-center mb-4">
                  Verify Two-Factor Authentication
                </h2>

                <p className="text-slate-400 mb-6 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>

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
                    className="w-full text-center bg-transparent text-white tracking-widest text-xl font-mono border-b-2 border-blue-500 focus:outline-none focus:border-blue-400 py-2"
                    placeholder="123456"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-2 text-center">
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={verify2FACode}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Enable"
                    )}
                  </button>
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
