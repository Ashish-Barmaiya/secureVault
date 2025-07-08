"use client";

import { useDispatch, useSelector } from "react-redux";
import { persistor } from "@/store/store";
import { Bell, Settings, UserCircle2 } from "lucide-react";
import { Vault } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { logout } from "@/store/userSlice";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        dispatch(logout());
        persistor.purge();
        router.push("/");
      } else {
        alert("Logout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error during logout");
    }
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-white backdrop-blur-md shadow-sm">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <Vault className="h-8 w-8 text-blue-600" />
        <div className="text-2xl font-bold text-slate-700">
          Secure<span className="text-blue-600">Vault</span>
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center gap-6">
        <button className="text-gray-600 hover:text-blue-600">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-600 hover:text-blue-600">
          <Settings className="w-5 h-5" />
        </button>

        {/* Dropdown User Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 text-sm text-slate-800 font-medium hover:text-blue-700 focus:outline-none">
              <UserCircle2 className="w-6 h-6 text-blue-700" />
              {user?.email || "User"}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={6}
              className="bg-white rounded-md shadow-lg p-2 min-w-[180px] text-sm text-slate-700"
            >
              <DropdownMenu.Item className="hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer">
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item className="hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer">
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />
              <DropdownMenu.Item
                onClick={handleLogout}
                className="hover:bg-red-100 text-red-600 px-3 py-2 rounded-md cursor-pointer"
              >
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
}
