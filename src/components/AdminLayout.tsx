import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  LogOut,
  FileText,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Transaksi & POS", href: "/pos", icon: ShoppingCart },
    { name: "Data Karyawan", href: "/admin/users", icon: Users },
    { name: "Master Kategori", href: "/admin/categories", icon: Package },
    { name: "Master Produk", href: "/admin/products", icon: Package },
    { name: "Laporan Penjualan", href: "/admin/reports", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-white border-r border-gray-200 flex flex-col z-50 w-64 transform transition-transform duration-300 md:relative md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              id="admin-logo-wrapper"
              className="w-9 h-9 sm:w-10 sm:h-10 relative flex-shrink-0 flex items-center justify-center"
            >
              <img
                src="/logo Pondok Salero.png"
                alt="Logo"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-700 leading-tight tracking-tight">
              Pondok <span className="text-red-600">Salero</span>
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-500",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-0">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 md:hidden bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="w-9 h-9 relative flex-shrink-0 flex items-center justify-center">
              <img
                src="/logo Pondok Salero.png"
                alt="Logo"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">
              Pondok <span className="text-red-600">Salero</span>
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
