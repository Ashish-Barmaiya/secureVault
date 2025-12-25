"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Heir2FASetup() {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch QR Code
    const fetchQrCode = async () => {
      try {
        const res = await fetch("/api/heir/auth/2fa/setup", {
          method: "POST",
        });
        const data = await res.json();
        if (data.success) {
          setQrCodeUrl(data.qrCodeUrl);
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchQrCode();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/heir/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        alert("2FA Enabled Successfully!");
        router.push("/heir/verify");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading)
    return <div className="text-white text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Setup 2FA</h2>
        {qrCodeUrl && (
          <div className="mb-6 flex justify-center">
            <img src={qrCodeUrl} alt="2FA QR Code" className="rounded-lg" />
          </div>
        )}
        <p className="mb-4 text-gray-300">
          Scan the QR code with your authenticator app and enter the code below.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-center text-xl tracking-widest"
            required
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-bold transition duration-200"
          >
            Verify & Enable
          </button>
        </form>
      </div>
    </div>
  );
}
