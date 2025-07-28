import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import ProductShowcase from "@/components/ProductShowcase";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="bg-[#f9fbff] text-gray-800">
      <Hero />
      <Features />
      <ProductShowcase />
      <CTA />
      <Footer />
    </main>
  );
}
