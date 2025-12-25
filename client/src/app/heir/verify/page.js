"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSalt, deriveMasterKey } from "@/utils/vaultCrypto";
import { generateRSAKeyPair, encryptHeirPrivateKey } from "@/utils/heirCrypto";

export default function HeirVerify() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already verified
    // We can't easily check without an API call.
    // Let's assume the user lands here. If they submit and it says "already verified" or we add a "am I verified" endpoint.
    // For now, let's just leave it. If they re-verify, it updates keys (which might be bad if they lose old ones, but they need master password).
    // Actually, if they are verified, they shouldn't be here.
  }, []);

  const handleVerification = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // 1. Generate Salt
      const salt = generateSalt();

      // 2. Derive Master Key
      const masterKey = deriveMasterKey(password, salt);

      // 3. Generate RSA Key Pair
      const { publicKey, privateKey } = await generateRSAKeyPair();

      // 4. Encrypt Private Key with Master Key
      const encryptedPrivateKey = encryptHeirPrivateKey(privateKey, masterKey);

      // 5. Send to Server
      const res = await fetch("/api/heir/auth/verify-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          encryptedPrivateKey,
          salt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/heir/dashboard");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Verification failed:", error);
      alert("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Heir Verification
        </h2>
        <p className="mb-4 text-gray-400 text-sm text-center">
          Create a Master Password. This will be used to encrypt your private
          key. You MUST NOT forget this password, or you will lose access.
        </p>
        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <label className="block mb-1">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block mb-1">Confirm Master Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded font-bold transition duration-200 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Generating Keys..." : "Verify & Generate Keys"}
          </button>
        </form>
      </div>
    </div>
  );
}
