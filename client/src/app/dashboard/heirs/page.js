"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/DashboardNavbar";
import { authFetch } from "@/utils/authFetch";

export default function HeirsPage() {
  const [heirs, setHeirs] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchHeirs = async () => {
    try {
      const res = await authFetch("http://localhost:5000/user/heirs");
      const data = await res.json();
      if (data.success) {
        setHeirs(data.heirs);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHeirs();
  }, []);

  const handleLinkHeir = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await authFetch("http://localhost:5000/user/link-heir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Heir linked successfully!");
        setEmail("");
        fetchHeirs();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to link heir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <DashboardNavbar />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Manage Heirs</h1>

        {/* Link Heir Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Link a New Heir</h2>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Enter Heir's Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleLinkHeir}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold disabled:bg-gray-600"
            >
              {loading ? "Linking..." : "Link Heir"}
            </button>
          </div>
        </div>

        {/* Linked Heirs List */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Linked Heirs</h2>
          {heirs.length === 0 ? (
            <p className="text-gray-400">No heirs linked yet.</p>
          ) : (
            <ul>
              {heirs.map((heir) => (
                <li key={heir.id} className="border-b border-gray-700 py-4 last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{heir.name}</p>
                      <p className="text-sm text-gray-400">{heir.email}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${heir.isVerified ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                            {heir.isVerified ? "Verified" : "Pending Verification"}
                        </span>
                        {heir.isVerified && (
                            <p className="text-xs text-gray-500 mt-1">Public Key Available</p>
                        )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
