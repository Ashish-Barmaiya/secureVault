// components/Enable2FAButton.jsx
import { useState } from "react";
import TwoFactorAuthModal from "./TwoFactorAuthModal";

export default function Enable2FAButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    console.log("2FA enabled successfully");
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors whitespace-nowrap"
      >
        Enable 2FA
      </button>

      <TwoFactorAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
