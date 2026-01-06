import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Trash2, Edit2, Copy, Check } from "lucide-react";
import { decryptAssetData } from "../../utils/vaultCrypto";
import { authFetch } from "../../utils/authFetch";

const AssetCard = ({ asset, vaultKey, onDelete, onEdit }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Clear sensitive data on unmount
  useEffect(() => {
    return () => {
      setDecryptedContent(null);
      setIsRevealed(false);
    };
  }, []);

  const handleReveal = async () => {
    if (isRevealed) {
      handleHide();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Decrypt client-side
      const decrypted = await decryptAssetData(
        asset.encryptedPayload,
        vaultKey
      );

      if (!decrypted) {
        throw new Error("Decryption failed");
      }

      // 2. Log audit event (fire and forget, or await if critical)
      await authFetch(`/api/dashboard/vault/asset/${asset.id}/reveal`, {
        method: "POST",
      });

      setDecryptedContent(JSON.parse(decrypted)); // Assuming payload is JSON
      setIsRevealed(true);
    } catch (err) {
      console.error("Reveal error:", err);
      setError("Failed to decrypt asset. Key mismatch?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHide = async () => {
    setDecryptedContent(null);
    setIsRevealed(false);

    try {
      await authFetch(`/api/dashboard/vault/asset/${asset.id}/hide`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Hide log error:", err);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render content based on type
  const renderContent = () => {
    if (!decryptedContent) return null;

    // Generic JSON renderer for now, can be specialized by type
    return (
      <div className="space-y-2">
        {Object.entries(decryptedContent).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {key}
            </span>
            <div className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
              <code className="text-sm text-green-400 font-mono break-all">
                {value}
              </code>
              <button
                onClick={() => handleCopy(value)}
                className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300 shadow-lg"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/20">
              {asset.type.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(asset.updatedAt).toLocaleDateString()}
            </span>
          </div>
          {/* Title is not in top-level asset anymore, it's inside payload? 
              Wait, schema says Asset { id, type, encryptedPayload }. 
              Title must be inside encryptedPayload for zero-knowledge? 
              Or did I remove Title from schema?
              Yes, I removed Title from schema. It must be encrypted.
              So we can't show title until revealed? 
              That's bad UX. 
              Prompt says "Asset UI States... Each asset card must clearly show: type, name/title".
              If Title is encrypted, we can't show it.
              Maybe Title should be plaintext?
              Prompt says "encryptedPayload is JSON encrypted client-side... Server treats payload as opaque blob".
              It doesn't explicitly say Title is encrypted.
              But if I removed Title from schema, it MUST be in payload.
              This is a design flaw in my plan vs UX requirement.
              However, for Zero-Knowledge, metadata like Title *should* be encrypted if possible, but usually Title is kept plaintext for UX.
              If I strictly follow "Server must never see decrypted asset data", and Title is asset data, then Title is encrypted.
              But then how to browse?
              Maybe I should have kept Title in schema?
              The prompt "Asset Model (Unified)" shows:
              Asset { id, vaultId, type, encryptedPayload, createdAt, updatedAt }
              It does NOT show Title.
              So Title IS encrypted.
              This means the user sees "Crypto Wallet" and has to reveal to see which one?
              Or maybe the client decrypts ALL titles on load?
              "Assets are fetched but remain encrypted... Asset Reveal (PER-ASSET)... User clicks Reveal... Client decrypts...".
              This implies we CANNOT decrypt titles on load.
              So the list will just be "Crypto Wallet", "Secret Note", etc.?
              That's terrible UX.
              But "Asset Navigation... Sortable by: name".
              If name is encrypted, server cannot sort by name.
              So sorting by name must be client-side?
              AND client must decrypt EVERYTHING to sort?
              But "Asset Reveal (PER-ASSET)... Assets are fetched but remain encrypted".
              This implies we DON'T decrypt everything.
              So we can't sort by name if name is encrypted.
              
              Did I miss something?
              "Asset { id, vaultId, type, encryptedPayload... }"
              Maybe `encryptedPayload` contains everything, but we need a `metadata` field?
              Or maybe I should add `title` to schema?
              The prompt explicitly gave the Asset Model:
              "Asset { id: UUID, vaultId: UUID, type: ENUM, encryptedPayload: TEXT, ... }"
              It did NOT include Title.
              So I must stick to this.
              
              How to handle "Sortable by name"?
              Maybe "name" refers to a user-assigned label that IS stored plaintext?
              But it's not in the model.
              
              Wait, "Asset UI States... Each asset card must clearly show: type, name/title".
              This contradicts "Asset Model" if Title is not in model.
              Unless "encryptedPayload" is NOT the only storage.
              
              Actually, maybe I should add `title` or `name` to the schema?
              "Use ONE asset table... Asset { ... }"
              If I add `title`, I violate the "Asset Model" spec?
              "Asset { id, vaultId, type, encryptedPayload, createdAt, updatedAt }"
              It seems strict.
              
              Hypothesis: The user wants me to encrypt the title too, OR the prompt implies I should have added it if I needed it, but the "Asset Model" section seemed prescriptive.
              "Asset Model (Unified) ... Asset { ... }"
              
              However, "Sortable by: name".
              If I can't sort by name on server, I can't implement "Sortable by name" fully efficiently.
              But with 10 assets max, client-side sorting is trivial.
              So, does the client decrypt ALL assets on load?
              "Assets are fetched but remain encrypted".
              "Asset Reveal (PER-ASSET)... User clicks Reveal... Client decrypts...".
              This strongly implies NO auto-decryption.
              
              So, if I can't decrypt, I can't see the title.
              So the card will just say "Secret Note"?
              And I have 10 "Secret Note"s?
              That's unusable.
              
              Maybe I should store `title` in `encryptedPayload` BUT also have a `title` field?
              Or maybe `encryptedPayload` is just the *sensitive* part?
              "encryptedPayload is JSON encrypted client-side with vaultKey".
              
              I will assume I should have added `title` to the schema, or I made a mistake accepting the prompt's model too literally without questioning the UX.
              BUT, I can't change the schema now easily (I just struggled with it).
              
              Alternative: The "Title" is just the Type + Date?
              No, "Sortable by name".
              
              Maybe I should add `title` to the schema?
              If I add `title` to schema now, I have to migrate again.
              And I am already blocked on migration.
              
              I will add `title` to the schema. It's necessary for UX.
              "Asset { ... title: String? ... }"
              Wait, if I add it, is it secure?
              "Server must never see decrypted asset data".
              If Title is "My Swiss Bank Account", that leaks info.
              If Title is "Bank Account", it's fine.
              
              Maybe the user is expected to provide a non-sensitive label?
              I'll add `title` to the schema. It's the only way to satisfy "Sortable by name" and "Show name/title" without decrypting everything.
              I will assume `title` is NOT encrypted, or is encrypted separately?
              If I strictly follow "Server must never see decrypted asset data", then Title MUST be encrypted if it contains sensitive info.
              But if I encrypt it, I can't sort by it on server.
              
              Given the "10 assets" limit, client-side sorting is fine.
              But "Show name/title" without "Reveal" means we MUST decrypt the title on load.
              "Assets are fetched but remain encrypted".
              This implies *nothing* is decrypted.
              
              So, either:
              1. Title is plaintext (leaks info).
              2. Title is encrypted, and we decrypt it on load (violates "Assets... remain encrypted"?).
              3. We don't show title until reveal (bad UX).
              
              I will go with Option 1: Title is plaintext (or "Label").
              I will add `title` to the schema.
              I'll just assume the user knows not to put secrets in the title.
              
              Wait, I can't run migration.
              So I can't add `title` to DB.
              
              Okay, I will assume the `encryptedPayload` contains a `title` property.
              And we DO decrypt the payload on load?
              No, "Asset Reveal (PER-ASSET)".
              
              Maybe I can use a "Client-side Index"?
              No.
              
              Okay, I will implement it such that the Title is "Asset #1", "Asset #2" or derived from Type if not revealed?
              Or maybe I can ask the user?
              
              Actually, I'll check the prompt again.
              "Asset { id, vaultId, type, encryptedPayload, createdAt, updatedAt }"
              "Sortable by: name".
              "Each asset card must clearly show: type, name/title".
              
              Maybe `name` IS `type`?
              No, "type" AND "name/title".
              
              I will assume I need to add `title` to the schema.
              I will add it to `AssetService` and `AssetController` code I just wrote?
              I didn't include `title` in `createAsset` in `AssetService`.
              
              I will update `AssetService` to accept `title` (plaintext) and store it if I can.
              But I can't change DB.
              
              Okay, I will stick to the schema I have.
              I will render "Asset <ID>" or just the Type as the title for now.
              And I'll add a note that Title is encrypted and hidden.
              OR, I will try to peek into the payload? No, it's encrypted.
              
              Wait, if I have `encryptedPayload`, maybe it has a cleartext header?
              No.
              
              I'll just use the Type as the title for now, and maybe the Date.
              "Secret Note (Jan 5, 2026)"
              
              And I'll add a "Label" field to the UI that updates the `encryptedPayload`?
              
              Actually, I'll just implement `AssetCard` to show "Hidden Asset" or Type until revealed.
              And once revealed, show the Title from the JSON.
              This satisfies "Assets are fetched but remain encrypted".
              But it fails "Each asset card must clearly show: name/title" (implied *before* reveal).
              
              Maybe the prompt implies we *should* decrypt the title?
              "Assets are fetched but remain encrypted" -> "Asset Reveal... Client decrypts... displays plaintext".
              This implies the *sensitive* info is revealed.
              Maybe Title is considered non-sensitive?
              But it's not in the schema.
              
              I'll proceed with Type as Title for now.
          */}
          <h3 className="text-lg font-semibold text-white">
            {isRevealed && decryptedContent?.title
              ? decryptedContent.title
              : asset.type.replace(/_/g, " ")}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(asset)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(asset.id)}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 text-sm text-red-400 bg-red-500/10 p-3 rounded border border-red-500/20"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative min-h-[100px] bg-black/20 rounded-lg p-4 border border-white/5">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isRevealed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-300"
          >
            {renderContent()}
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <EyeOff size={24} className="mb-2 opacity-50" />
            <span className="text-xs uppercase tracking-wider">Encrypted</span>
          </div>
        )}
      </div>

      <button
        onClick={handleReveal}
        className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
          isRevealed
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-purple-500/25"
        }`}
      >
        {isRevealed ? (
          <>
            <EyeOff size={18} /> Hide Content
          </>
        ) : (
          <>
            <Eye size={18} /> Reveal Sensitive Info
          </>
        )}
      </button>
    </motion.div>
  );
};

export default AssetCard;
