import { useState } from "react";
import { Check, X, UserPlus } from "lucide-react";
import { authFetch } from "@/utils/authFetch";

export default function HeirRequestCard({ request, onRespond }) {
  const [loading, setLoading] = useState(false);

  const handleResponse = async (accept) => {
    setLoading(true);
    try {
      const res = await authFetch("/api/heir/respond-link-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      const data = await res.json();
      if (data.success) {
        onRespond(accept);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to respond to request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/30 rounded-2xl p-6 mb-8 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Pending Link Request
            </h3>
            <p className="text-slate-300">
              <span className="font-semibold text-white">
                {request.user.name}
              </span>{" "}
              ({request.user.email}) wants to add you as their heir.
            </p>
            {request.relationship && (
              <p className="text-sm text-slate-400 mt-1">
                Relationship: {request.relationship}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => handleResponse(false)}
            disabled={loading}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={() => handleResponse(true)}
            disabled={loading}
            className="flex-1 md:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            <Check className="w-4 h-4" />
            {loading ? "Processing..." : "Accept Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
