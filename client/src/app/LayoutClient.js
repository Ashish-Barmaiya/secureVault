"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ReduxProvider } from "./providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LayoutClient({ children }) {
  const pathname = usePathname();
  const isHeirAuthRoute =
    pathname.startsWith("/heir/dashboard") ||
    pathname.startsWith("/heir/vault") ||
    pathname.startsWith("/heir/claim");
  const isDashboard = pathname.startsWith("/dashboard") || isHeirAuthRoute;

  return (
    <ReduxProvider>
      {!isDashboard && <Navbar />}
      {children}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
        style={{ zIndex: 9999 }}
      />
    </ReduxProvider>
  );
}
