// components/Features.jsx
import { Lock, Users, Shield, Key, FileText, Globe } from "lucide-react";

const features = [
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Military-Grade Encryption",
    desc: "AES-256 encryption ensures your sensitive data remains secure and inaccessible to unauthorized users.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Smart Inheritance",
    desc: "Pre-designate trusted heirs who can securely access your vault when verification conditions are met.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Digital Asset Protection",
    desc: "Safely store crypto wallets, bank details, passwords, and important documents in one secure location.",
  },
  {
    icon: <Key className="h-6 w-6" />,
    title: "Zero-Knowledge Architecture",
    desc: "We never have access to your encryption keys or decrypted data. You are the only one who holds the keys.",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Secure Document Storage",
    desc: "Upload and encrypt important documents like wills, contracts, and property deeds with drag-and-drop ease.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Accessibility",
    desc: "Access your vault from anywhere in the world with our secure cloud infrastructure and multi-device sync.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-[#0f172a] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Your digital legacy, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">secured forever</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            We combine military-grade encryption with intelligent inheritance
            planning to protect what matters most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon, title, desc }, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm"
            >
              <div className="bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white p-4 rounded-xl w-14 h-14 flex items-center justify-center mb-6 transition-colors duration-300">
                {icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-200 transition-colors">
                {title}
              </h3>
              <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
