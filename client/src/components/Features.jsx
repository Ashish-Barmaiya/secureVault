const features = [
  {
    icon: "🔒",
    title: "Military-Grade Encryption",
    desc: "AES-256 encryption ensures your sensitive data remains secure and inaccessible to unauthorized users.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Smart Inheritance",
    desc: "Pre-designate trusted heirs who can securely access your vault when verification conditions are met.",
  },
  {
    icon: "🗂️",
    title: "Digital Asset Protection",
    desc: "Safely store crypto wallets, bank details, passwords, and important documents in one secure location.",
  },
];

export default function Features() {
  return (
    <section className="px-6 py-20 bg-white text-center">
      <h2 className="text-3xl font-bold">Why Choose SecureVault?</h2>
      <p className="text-gray-600 mt-2 mb-10">
        We combine military-grade encryption with intelligent inheritance
        planning
      </p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map(({ icon, title, desc }) => (
          <div
            key={title}
            className="bg-[#f9fbff] p-6 rounded-lg shadow hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-gray-600 mt-2 text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
