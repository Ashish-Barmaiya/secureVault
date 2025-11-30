// components/CTA.jsx
"use client";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-24 px-4 bg-[#0f172a]">
      <div className="max-w-5xl mx-auto text-center">
        <div className="relative bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/20 rounded-3xl p-12 sm:p-16 overflow-hidden backdrop-blur-sm">
          {/* Glow effects */}
          <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>
          
          <h2 className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to secure your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">digital legacy?</span>
          </h2>
          <p className="relative z-10 text-slate-300 max-w-2xl mx-auto mb-10 text-lg">
            Join thousands of users who trust SecureVault to protect their most
            valuable digital assets with military-grade encryption.
          </p>

          <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white border border-slate-700 font-medium rounded-xl transition-colors backdrop-blur-sm"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
