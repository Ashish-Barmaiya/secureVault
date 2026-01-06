"use client";

import { usePathname } from "next/navigation";
import HeirNavbar from "@/components/HeirNavbar";

export default function HeirLayout({ children }) {
  const pathname = usePathname();
  const showHeirNavbar =
    pathname.startsWith("/heir/dashboard") ||
    pathname.startsWith("/heir/vault") ||
    pathname.startsWith("/heir/claim");

  return (
    <>
      {showHeirNavbar && <HeirNavbar />}
      {children}
    </>
  );
}
