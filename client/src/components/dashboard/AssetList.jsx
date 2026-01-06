import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, SortAsc, SortDesc } from "lucide-react";
import AssetCard from "./AssetCard";
import { authFetch } from "../../utils/authFetch";

const AssetList = ({ vaultKey, onAddAsset, onEditAsset }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest first
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt, type

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/dashboard/vault/asset`);
      const data = await res.json();

      if (data.success) {
        setAssets(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch assets");
      }
    } catch (err) {
      console.error("Fetch assets error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (assetId) => {
    if (
      !confirm(
        "Are you sure you want to delete this asset? This action is irreversible."
      )
    )
      return;

    try {
      const res = await authFetch(`/api/dashboard/vault/asset/${assetId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAssets(assets.filter((a) => a.id !== assetId));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete asset");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete asset");
    }
  };

  // Filtering & Sorting
  const filteredAssets = assets
    .filter((asset) => filterType === "ALL" || asset.type === filterType)
    .sort((a, b) => {
      if (sortBy === "createdAt") {
        return sortOrder === "desc"
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "type") {
        return sortOrder === "asc"
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }
      return 0;
    });

  const assetTypes = ["ALL", ...new Set(assets.map((a) => a.type))];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
            >
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "ALL" ? "All Categories" : type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSortBy(sortBy === "createdAt" ? "type" : "createdAt");
            }}
            className="flex items-center gap-2 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors"
          >
            Sort by {sortBy === "createdAt" ? "Date" : "Type"}
          </button>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 bg-black/20 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
          >
            {sortOrder === "asc" ? (
              <SortAsc size={18} />
            ) : (
              <SortDesc size={18} />
            )}
          </button>
        </div>

        <div className="text-sm text-gray-400">
          {assets.length} / 10 Assets Used
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
          {error}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-white/10 border-dashed">
          <p>No assets found.</p>
          <button
            onClick={onAddAsset}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} /> Add Your First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              vaultKey={vaultKey}
              onDelete={handleDelete}
              onEdit={onEditAsset}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetList;
