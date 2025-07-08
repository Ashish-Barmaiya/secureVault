export default function Hero() {
  return (
    <section className="text-center px-6 py-20 bg-[#f0f7ff]">
      <div className="mb-4">
        <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">
          🛡️ Bank-Grade Security
        </span>
      </div>
      <h1 className="text-4xl sm:text-7xl font-bold">
        Secure Your <br />
        <span className="text-teal-600">Digital Legacy</span>
      </h1>
      <p className="mt-4 text-gray-600 text-2xl max-w-4xl mx-auto leading-relaxed">
        Store your crypto wallets, banking details, and digital assets in an
        encrypted vault. Ensure your loved ones can access them when it matters
        most.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow">
          Start Securing Your Legacy →
        </button>
        <button className="border border-gray-300 px-6 py-3 rounded-md text-gray-700 hover:bg-gray-100 hover:border-blue-500">
          Watch Demo
        </button>
      </div>
    </section>
  );
}
