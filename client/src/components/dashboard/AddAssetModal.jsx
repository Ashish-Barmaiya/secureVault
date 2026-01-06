import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Lock, Plus, Trash2 } from "lucide-react";
import { encryptAssetData } from "../../utils/vaultCrypto";
import { authFetch } from "../../utils/authFetch";

const ASSET_TYPES = [
  { id: "CRYPTO_WALLET", label: "Crypto Wallet" },
  { id: "SECRET_NOTE", label: "Secret Note" },
  { id: "BANK_ACCOUNT_INFO", label: "Bank Account Info" },
  { id: "INVESTMENT_ACCOUNT_INFO", label: "Investment Account" },
  { id: "LEGAL_INFO", label: "Legal Info" },
  { id: "DOCUMENT_REFERENCE", label: "Document Reference" },
  { id: "RECOVERY_PHRASE", label: "Recovery Phrase" },
  { id: "EMAIL_ACCOUNT", label: "Email Account" },
  { id: "IMPORTANT_NOTE", label: "Important Note" },
];

const AddAssetModal = ({ isOpen, onClose, vaultKey, onAssetAdded }) => {
  const [type, setType] = useState("SECRET_NOTE");
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState([{ key: "", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddField = () => {
    setFields([...fields, { key: "", value: "" }]);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...fields];
    newFields[index][field] = value;
    setFields(newFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Prepare payload
      const payloadData = {
        title, // Storing title in encrypted payload
        ...fields.reduce((acc, field) => {
          if (field.key) acc[field.key] = field.value;
          return acc;
        }, {}),
      };

      const jsonString = JSON.stringify(payloadData);

      // 2. Encrypt
      const encryptedObj = await encryptAssetData(jsonString, vaultKey);
      const encryptedPayload = `${encryptedObj.ciphertext}:${encryptedObj.iv}`;

      // 3. Submit
      const res = await authFetch(`/api/dashboard/vault/asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          encryptedPayload,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onAssetAdded(data.data);
        onClose();
        // Reset form
        setTitle("");
        setFields([{ key: "", value: "" }]);
        setType("SECRET_NOTE");
      } else {
        throw new Error(data.message || "Failed to create asset");
      }
    } catch (err) {
      console.error("Create asset error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock size={20} className="text-purple-500" />
            Add New Asset
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[70vh] overflow-y-auto"
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Asset Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Title (Encrypted)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Main Wallet"
              required
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-400">
                Secret Fields
              </label>
              <button
                type="button"
                onClick={handleAddField}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus size={14} /> Add Field
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Password)"
                  value={field.key}
                  onChange={(e) =>
                    handleFieldChange(index, "key", e.target.value)
                  }
                  className="w-1/3 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) =>
                    handleFieldChange(index, "value", e.target.value)
                  }
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} /> Save Encrypted Asset
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddAssetModal;
