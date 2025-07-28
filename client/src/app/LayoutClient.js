"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ReduxProvider } from "./providers";

export default function LayoutClient({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <ReduxProvider>
      {!isDashboard && <Navbar />}
      {children}
    </ReduxProvider>
  );
}
