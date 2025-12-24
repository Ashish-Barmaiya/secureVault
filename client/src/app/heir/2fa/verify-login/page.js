"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeirLogin2FA() {
  const [token, setToken] = useState("");
  const router = useRouter();

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      // We reuse the verify endpoint. 
      // Note: The backend `verifyHeirTwoFactor` updates `twoFactorEnabled = true`. 
      // It might not be strictly for "login verification" but for "enabling verification".
      // However, for this flow, let's assume it validates the token.
      // Ideally we'd have a specific `auth/2fa/validate` endpoint that doesn't just "enable" it but just checks it.
      // But `verifyHeirTwoFactor` checks the token against the secret. That's what we need.
      
      const res = await fetch("/api/heir/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        // Now check if verified (keys)
        // We need to know if keys are verified. 
        // We can fetch "me" or just try to go to dashboard and let it redirect if needed?
        // Or we can assume we need to check.
        // Let's try to fetch heir info or just go to verify page which checks status?
        // For now, let's go to dashboard, and dashboard should redirect if not verified? 
        // Or better, go to a "check-status" intermediate or just /heir/verify which checks if done.
        
        router.push("/heir/verify"); // Verify page should check if already verified and redirect to dashboard
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Two-Factor Authentication</h2>
        <p className="mb-4 text-gray-300">Enter the code from your authenticator app.</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-center text-xl tracking-widest"
            required
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-bold transition duration-200"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}
