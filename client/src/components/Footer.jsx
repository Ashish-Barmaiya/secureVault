// components/Footer.jsx
import {
  Vault,
  Lock,
  Shield,
  Globe,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black/90 backdrop-blur border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Vault className="h-6 w-6 text-blue-500" />
              <div className="text-xl font-bold text-white">
                Secure<span className="text-blue-500">Vault</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6">
              Protect your digital legacy with military-grade encryption and
              smart inheritance.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Github size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Use Cases
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Guides
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Partners
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Legal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 md:mb-0">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Lock size={16} className="text-blue-500" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-700"></div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield size={16} className="text-blue-500" />
              <span>AES-256 encryption</span>
            </div>
          </div>

          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} SecureVault. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
