// components/ProductShowcase.jsx
export default function ProductShowcase() {
  return (
    <section
      id="security"
      className="py-24 px-4 bg-[#0B1120] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
              Deep security at <br/>
              <span className="text-blue-500">your fingertips</span>
            </h2>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed">
              SecureVault embeds military-grade encryption directly in your
              digital life. It has deep security awareness and the ability to
              protect files and assets directly in your environment.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-5 group">
                <div className="bg-blue-500/10 p-3 rounded-xl mt-1 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                  <div className="bg-blue-500 w-2 h-2 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    End-to-end encryption
                  </h3>
                  <p className="text-slate-400">
                    Your data is encrypted before it leaves your device and
                    remains encrypted at rest.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="bg-blue-500/10 p-3 rounded-xl mt-1 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                  <div className="bg-blue-500 w-2 h-2 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Zero-knowledge architecture
                  </h3>
                  <p className="text-slate-400">
                    We never have access to your encryption keys or decrypted
                    data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="bg-blue-500/10 p-3 rounded-xl mt-1 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                  <div className="bg-blue-500 w-2 h-2 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Biometric authentication
                  </h3>
                  <p className="text-slate-400">
                    Secure access with fingerprint or face recognition on
                    supported devices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl blur-3xl opacity-20"></div>
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl relative z-10">
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl h-[400px] flex items-center justify-center relative overflow-hidden">
                   {/* Mock UI */}
                   <div className="absolute top-0 left-0 w-full h-10 bg-slate-800/50 border-b border-slate-800 flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                   </div>
                   
                   <div className="text-center p-8 relative z-10">
                      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 inline-block shadow-xl backdrop-blur-sm">
                         <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                         </div>
                         <div className="text-white text-2xl font-mono mb-2">
                            SecureVault Terminal
                         </div>
                         <div className="text-blue-400 font-mono text-sm">
                            System Secure. All systems operational.
                         </div>
                      </div>
                   </div>
                   
                   {/* Grid lines */}
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
