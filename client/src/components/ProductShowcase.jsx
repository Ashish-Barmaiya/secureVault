// components/ProductShowcase.jsx
export default function ProductShowcase() {
  return (
    <section
      id="security"
      className="py-20 px-4 bg-gradient-to-r from-blue-600 to-teal-500"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-6">
              Deep security at your fingertips
            </h2>
            <p className="text-zinc-100 mb-6">
              SecureVault embeds military-grade encryption directly in your
              digital life. It has deep security awareness and the ability to
              protect files and assets directly in your environment.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg mt-1">
                  <div className="bg-blue-600 w-3 h-3 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">
                    End-to-end encryption
                  </h3>
                  <p className="text-gray-300">
                    Your data is encrypted before it leaves your device and
                    remains encrypted at rest
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg mt-1">
                  <div className="bg-blue-600 w-3 h-3 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">
                    Zero-knowledge architecture
                  </h3>
                  <p className="text-gray-300">
                    We never have access to your encryption keys or decrypted
                    data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg mt-1">
                  <div className="bg-blue-600 w-3 h-3 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">
                    Biometric authentication
                  </h3>
                  <p className="text-gray-300">
                    Secure access with fingerprint or face recognition on
                    supported devices
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-xl h-80 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 inline-block shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-600 w-3 h-3 rounded-full"></div>
                    <div className="bg-blue-600 w-3 h-3 rounded-full"></div>
                    <div className="bg-blue-600 w-3 h-3 rounded-full"></div>
                  </div>
                  <div className="text-gray-900 text-lg font-mono">
                    SecureVault Terminal
                  </div>
                  <div className="text-gray-500 mt-2">
                    Your assets are protected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
