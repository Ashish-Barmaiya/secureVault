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
    desc: "We never have access to your encryption keys or decrypted data.",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Secure Document Storage",
    desc: "Upload and encrypt important documents like wills, contracts, and property deeds.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Accessibility",
    desc: "Access your vault from anywhere in the world with our secure cloud infrastructure.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Your digital legacy, secured forever
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-4">
            We combine military-grade encryption with intelligent inheritance
            planning to protect what matters most
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon, title, desc }, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
            >
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
