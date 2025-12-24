// components/Hero.jsx
"use client";
import Link from "next/link";
import { ShieldCheck, Lock, Server } from "lucide-react";
import { useSelector } from "react-redux";

export default function Hero() {
  const heir = useSelector((state) => state.heir.heir);
  return (
    <section className="relative px-4 py-24 sm:py-32 lg:py-40 overflow-hidden bg-[#0f172a]">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-full mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-blue-200 text-sm font-medium">
              Bank-Grade Security Architecture
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Secure your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              digital legacy
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl leading-relaxed mb-10">
            The world's most secure vault for your crypto assets, financial data, and critical documents. 
            Encrypted with AES-256 and accessible only by you and your trusted heirs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300 text-center"
            >
              Start Securing Now
            </Link>
            <button className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white border border-slate-700 font-medium rounded-xl transition-colors backdrop-blur-sm">
              View Live Demo
            </button>
          </div>
          
          <div className="mt-6 text-sm text-slate-400">
            Are you a designated heir? <Link href={heir ? "/heir/dashboard" : "/heir/login"} className="text-blue-400 hover:underline">Access Heir Portal</Link>
          </div>
          
          <div className="mt-12 flex items-center gap-6 text-slate-500 text-sm font-medium">
             <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> End-to-End Encrypted
             </div>
             <div className="flex items-center gap-2">
                <Server className="w-4 h-4" /> Zero-Knowledge
             </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative hidden lg:block">
           <div className="relative z-10 bg-slate-900/80 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transform rotate-[-5deg] hover:rotate-0 transition-transform duration-700">
              <div className="bg-[#0B1120] rounded-xl overflow-hidden border border-slate-800/50">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/50 bg-slate-900/50">
                   <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                   <div className="ml-4 px-3 py-1 bg-slate-800/50 rounded-md text-xs text-slate-400 font-mono flex-1 text-center">
                      secure-vault-terminal — v2.4.0
                   </div>
                </div>
                <div className="p-6 font-mono text-sm">
                   <div className="flex gap-2 mb-2">
                      <span className="text-green-400">➜</span>
                      <span className="text-blue-400">~</span>
                      <span className="text-slate-300">initiating secure handshake...</span>
                   </div>
                   <div className="flex gap-2 mb-2">
                      <span className="text-green-400">➜</span>
                      <span className="text-blue-400">~</span>
                      <span className="text-slate-300">verifying biometric signature...</span>
                   </div>
                   <div className="flex gap-2 mb-2">
                      <span className="text-green-400">➜</span>
                      <span className="text-blue-400">~</span>
                      <span className="text-slate-300">access granted. welcome back, user.</span>
                   </div>
                   <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-blue-300 mb-1">Vault Status</div>
                      <div className="text-2xl font-bold text-white">LOCKED & SECURE</div>
                      <div className="text-xs text-blue-400/70 mt-1">Last sync: 2 seconds ago</div>
                   </div>
                </div>
              </div>
           </div>
           
           {/* Floating elements */}
           <div className="absolute -top-10 -right-10 bg-slate-800/90 p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md animate-float">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                 </div>
                 <div>
                    <div className="text-white font-bold">Protected</div>
                    <div className="text-xs text-slate-400">12 Assets</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
