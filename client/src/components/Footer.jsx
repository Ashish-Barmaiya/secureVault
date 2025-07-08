import { Vault } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white px-6 py-6 text-gray-500 text-sm flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center gap-2 text-slate-700 font-semibold">
        <Vault className="h-5 w-5 text-blue-600" />
        SecureVault
      </div>
      <div>© 2025 SecureVault. Your digital legacy, secured forever.</div>
    </footer>
  );
}
