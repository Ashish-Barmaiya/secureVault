// components/Hero.jsx
"use client";
import Link from "next/link";
export default function Hero() {
  return (
    <section className="relative px-4 py-20 sm:py-28 lg:py-36 overflow-hidden bg-stone-100">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      <div className="relative max-w-6xl mx-auto z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/70 border border-blue-200 rounded-full mb-6">
            <span className="text-white/90 text-xs sm:text-xs md:text-sm">
              🛡️ Bank-Grade Security
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Secure your digital legacy
            </span>
            {/* <span className="block mt-4">with military-grade encryption</span> */}
          </h1>

          <p className="mt-6 text-xl text-gray-700 max-w-3xl mx-auto">
            Protect your crypto wallets, financial accounts, and digital assets
            in an encrypted vault. Ensure your loved ones can access them when
            it matters most.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free
            </Link>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
              View Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative max-w-6xl mx-auto mt-16 sm:mt-24 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">256-bit</div>
          <div className="text-gray-600 mt-1">Encryption</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">99.9%</div>
          <div className="text-gray-600 mt-1">Uptime</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">10k+</div>
          <div className="text-gray-600 mt-1">Assets Protected</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">24/7</div>
          <div className="text-gray-600 mt-1">Support</div>
        </div>
      </div>
    </section>
  );
}
