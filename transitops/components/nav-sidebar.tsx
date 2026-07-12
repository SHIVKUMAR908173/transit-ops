"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  LogOut,
  Fuel,
  BarChart,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/fuel", label: "Fuel & Expenses", icon: Fuel },
  { href: "/reports", label: "Reports", icon: BarChart },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-white border-r border-gray-200 w-56 h-screen flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center justify-center">
          <img src="/logo.png" alt="TransitOps Logo" className="h-12 w-auto object-contain" />
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="px-3 py-4 border-t border-gray-200">
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors duration-150"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
