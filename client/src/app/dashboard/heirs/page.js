"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/DashboardNavbar";
import { authFetch } from "@/utils/authFetch";

export default function HeirsPage() {
  const [heirs, setHeirs] = useState([]);
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [searchResult, setSearchResult] = useState(null); // { status: "AVAILABLE" | "PENDING" | "LINKED", heir: ... }
  const [searchLoading, setSearchLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const fetchHeirs = async () => {
    try {
      const res = await authFetch("/api/user/heirs");
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

  const handleSearchHeir = async () => {
    if (!email) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await authFetch("/api/user/search-heir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setSearchResult({ status: data.status, heir: data.heir });
      } else {
        // Handle specific error cases
        if (res.status === 404) {
          alert(
            "No heir registered with this email. Please ask them to register as an Heir in SecureVault."
          );
        } else {
          alert(data.message || "Error searching heir");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to search heir");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequestLink = async () => {
    if (!email) return;
    setRequestLoading(true);
    try {
      const res = await authFetch("/api/user/request-link-heir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, relationship }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Linking request sent! Waiting for heir confirmation.");
        setEmail("");
        setRelationship("");
        setSearchResult(null);
        fetchHeirs(); // Refresh list to show pending
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to send request");
    } finally {
      setRequestLoading(false);
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
          <div className="flex gap-4 mb-4">
            <input
              type="email"
              placeholder="Enter Heir's Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSearchHeir}
              disabled={searchLoading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold disabled:bg-gray-600"
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {searchResult && searchResult.status === "AVAILABLE" && (
            <div className="bg-gray-700 p-4 rounded-lg animate-fade-in">
              <p className="mb-2 text-green-400">
                Heir found:{" "}
                <span className="font-bold text-white">
                  {searchResult.heir.name}
                </span>{" "}
                ({searchResult.heir.email})
              </p>
              <p className="mb-4 text-sm text-gray-300">
                This heir is available for linking.
              </p>

              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Relationship (e.g. Spouse, Brother) - Optional"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="flex-1 p-2 rounded bg-gray-600 border border-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleRequestLink}
                  disabled={requestLoading}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold disabled:bg-gray-600"
                >
                  {requestLoading ? "Sending Request..." : "Send Request"}
                </button>
              </div>
            </div>
          )}

          {searchResult && searchResult.status === "PENDING" && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-yellow-400">
                Request Pending: You have already sent a request to{" "}
                <span className="font-bold text-white">
                  {searchResult.heir.name}
                </span>
                .
              </p>
            </div>
          )}
        </div>

        {/* Linked Heirs List */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Linked Heirs</h2>
          {heirs.length === 0 ? (
            <p className="text-gray-400">No heirs linked yet.</p>
          ) : (
            <ul>
              {heirs.map((heir) => (
                <li
                  key={heir.id}
                  className="border-b border-gray-700 py-4 last:border-0"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{heir.name}</p>
                      <p className="text-sm text-gray-400">{heir.email}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {heir.linkStatus === "PENDING" ? (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-white">
                          Request Pending
                        </span>
                      ) : (
                        <>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              heir.isVerified
                                ? "bg-green-900 text-green-300"
                                : "bg-blue-900 text-blue-300"
                            }`}
                          >
                            {heir.isVerified
                              ? "Verified"
                              : "Linked (Not Verified)"}
                          </span>
                          {heir.isVerified && (
                            <p className="text-xs text-gray-500">
                              Public Key Available
                            </p>
                          )}
                        </>
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
