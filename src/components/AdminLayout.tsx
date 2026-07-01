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
  ChevronLeft,
  Utensils,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Transaksi & POS", href: "/pos", icon: ShoppingCart },
    { name: "Data Karyawan", href: "/admin/users", icon: Users },
    { name: "Master Kategori", href: "/admin/categories", icon: Package },
    { name: "Master Produk", href: "/admin/products", icon: Package },
    { name: "Laporan Penjualan", href: "/admin/reports", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-warm-50 to-warm-100">
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col z-50 transition-all duration-300 ease-in-out",
          "md:relative",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          sidebarCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo Area */}
        <div className={cn(
          "h-16 flex items-center border-b border-white/5 px-4",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 relative flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-amber-600 rounded-xl blur-sm opacity-60" />
              <div className="relative w-full h-full bg-gray-900 rounded-xl flex items-center justify-center border border-white/10">
                <Utensils className="w-5 h-5 text-red-400" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
                Pondok <span className="text-red-400">Salero</span>
              </h1>
            )}
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white/50 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                  sidebarCollapsed ? "justify-center" : "",
                  isActive
                    ? "bg-gradient-to-r from-red-600/20 to-amber-600/10 text-red-300 border border-red-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isActive ? "text-red-400" : "text-gray-500 group-hover:text-gray-300"
                )} />
                {!sidebarCollapsed && (
                  <span className={cn(isActive && "font-semibold")}>{item.name}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-red-400 shadow-lg shadow-red-500/50" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex items-center justify-center h-8 mx-3 mb-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>

        {/* Profile Section */}
        <div className={cn(
          "border-t border-white/5 p-4",
          sidebarCollapsed && "flex flex-col items-center"
        )}>
          <div className={cn(
            "flex items-center gap-3 mb-3",
            sidebarCollapsed && "flex-col"
          )}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-500/20 flex-shrink-0">
              {profile?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile?.name}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{profile?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/10 hover:border-red-500/20",
              sidebarCollapsed ? "w-10 h-10 p-0" : "w-full"
            )}
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 -ml-2"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                <Utensils className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">
              Pondok <span className="text-red-600">Salero</span>
            </h1>
          </div>
          <div className="w-10" /> {/* spacer */}
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
