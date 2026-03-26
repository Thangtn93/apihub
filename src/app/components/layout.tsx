import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from "react-router";
import { useAuth } from "./auth-context";
import {
  Sparkles, LayoutDashboard, Store, ShoppingBag, FileText, Key, BarChart3,
  Wallet, UserCircle, LogOut, Menu, X, ChevronDown,
  Users, Server, Box, DollarSign, Receipt, ArrowUpCircle, ScrollText, BookOpen, Shield, Bug
} from "lucide-react";

const userNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/purchased", label: "Đã mua", icon: ShoppingBag },
  { to: "/api-docs", label: "API Docs", icon: FileText },
  { to: "/tokens", label: "API Tokens", icon: Key },
  { to: "/usage", label: "Usage Logs", icon: BarChart3 },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

const adminNav = [
  { to: "/admin", label: "Admin Dashboard", icon: Shield },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/providers", label: "Providers", icon: Server },
  { to: "/admin/models", label: "Models", icon: Box },
  { to: "/admin/purchases", label: "Purchases", icon: Receipt },
  { to: "/admin/topups", label: "Top-ups", icon: ArrowUpCircle },
  { to: "/admin/token-logs", label: "Token Logs", icon: ScrollText },
  { to: "/admin/api-docs", label: "API Docs Mgmt", icon: BookOpen },
  { to: "/admin/unit-test", label: "🧪 Unit Tests", icon: Bug },
  { to: "/admin/test-supabase", label: "🔧 DB Tests", icon: Bug },
];

export function Layout() {
  const { profile, signOut, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = profile?.role === "admin";
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0]">
      <div className="text-center">
        <Sparkles className="w-10 h-10 text-[#D4AF37] mx-auto animate-pulse" />
        <p className="text-[#6B7280] mt-3">Đang tải...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  // If profile is loaded and user is not admin but trying to access admin routes → redirect
  if (profile && isAdminRoute && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navLink = (item: typeof userNav[0], onClick?: () => void) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === "/admin"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? "bg-[#D4AF37] text-[#1F1F1F]"
            : "text-[#FAF7F0]/70 hover:bg-white/10 hover:text-[#FAF7F0]"
        }`
      }
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </NavLink>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2 border-b border-white/10">
        <Sparkles className="w-7 h-7 text-[#D4AF37]" />
        <span className="text-lg font-bold text-[#FAF7F0]">AI Market</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-1 text-xs text-[#FAF7F0]/40 uppercase tracking-wider">Menu</p>
        {userNav.map(item => navLink(item, () => setSidebarOpen(false)))}
        {isAdmin && (
          <>
            <button onClick={() => setShowAdmin(!showAdmin)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#D4AF37] hover:bg-white/10 transition mt-2">
              <Shield className="w-4 h-4" />
              Admin Panel
              <ChevronDown className={`w-4 h-4 ml-auto transition ${showAdmin ? "rotate-180" : ""}`} />
            </button>
            {showAdmin && (
              <div className="ml-2 space-y-1">
                {adminNav.map(item => navLink(item, () => setSidebarOpen(false)))}
              </div>
            )}
          </>
        )}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1F1F1F] font-bold text-sm">
            {profile?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#FAF7F0] truncate">{profile?.name || "User"}</p>
            <p className="text-xs text-[#FAF7F0]/50 truncate">{profile?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FAF7F0]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1F1F1F] flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#1F1F1F]">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center px-4 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 text-[#1F1F1F]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#D4AF37]/10 px-3 py-1.5 rounded-full">
              <Wallet className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-semibold text-[#D4AF37]">{(profile?.credits || 0).toLocaleString()} credits</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}