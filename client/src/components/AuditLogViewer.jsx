"use client";

import { useState, useEffect } from "react";
import { Loader2, Filter, RefreshCw, AlertCircle } from "lucide-react";

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [eventType, setEventType] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 20,
      });
      if (eventType) queryParams.append("eventType", eventType);

      const res = await fetch(`/api/audit/logs?${queryParams}`, {
        headers: {
          // Assuming credentials/cookies are sent automatically if configured
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error(data.message || "Failed to fetch logs");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, eventType]);

  const handleRefresh = () => {
    fetchLogs(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-blue-400" />
          Audit Logs
        </h2>
        <button
          onClick={handleRefresh}
          className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 ${
            refreshing ? "animate-spin" : ""
          }`}
          title="Refresh Logs"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[200px]"
          >
            <option value="">All Events</option>
            <option value="USER_LOGIN_SUCCESS">Login Success</option>
            <option value="USER_REGISTERED">User Registered</option>
            <option value="VAULT_CREATED">Vault Created</option>
            <option value="VAULT_UNLOCK_SUCCESS">Vault Unlocked</option>
            <option value="HEIR_INVITED">Heir Invited</option>
            <option value="HEIR_INVITATION_ACCEPTED">Heir Linked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700/50">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-6 py-3">Event</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3">Target</th>
              <th className="px-6 py-3">Date & Time</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 bg-slate-900/30">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading logs...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-red-400">
                  {error}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-300">{log.actorType}</span>
                      <span
                        className="text-xs text-slate-500 font-mono truncate max-w-[100px]"
                        title={log.actorId}
                      >
                        {log.actorId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-300">{log.targetType}</span>
                      <span
                        className="text-xs text-slate-500 font-mono truncate max-w-[100px]"
                        title={log.targetId}
                      >
                        {log.targetId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(log.occurredAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <pre className="text-xs text-slate-500 bg-slate-950/50 p-2 rounded border border-slate-800 overflow-auto max-w-[200px] max-h-[60px]">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
