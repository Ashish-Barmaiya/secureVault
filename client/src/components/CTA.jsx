// components/CTA.jsx
"use client";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-zinc-50 to-stone-50 border border-gray-200 rounded-2xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to secure your digital legacy?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of users who trust SecureVault to protect their most
            valuable digital assets
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
