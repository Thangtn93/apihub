import React, { useState } from "react";
import { Link, Outlet } from "react-router";
import { Sparkles, ShoppingCart, User, Menu, X, Filter } from "lucide-react";
import { useAuth } from "./auth-context";

interface ShopLayoutProps {
  sideContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function ShopLayout({ sideContent, children }: ShopLayoutProps) {
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] h-16 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden p-2 text-[#6B7280] hover:bg-gray-100 rounded-lg"
            >
              <Filter className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              <span className="text-xl font-bold text-[#1F1F1F] hidden sm:inline">AI Market</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/marketplace" className="text-sm font-medium text-[#6B7280] hover:text-[#D4AF37] transition">Marketplace</Link>
              <Link to="/models" className="text-sm font-medium text-[#6B7280] hover:text-[#D4AF37] transition">API Models</Link>
            </nav>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-[#6B7280] hover:text-[#D4AF37] transition">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">0</span>
              </button>
              
              {user ? (
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1F1F1F] text-[10px] font-bold">
                    {profile?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-bold hidden sm:inline">{profile?.credits?.toLocaleString()} cr</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-[#6B7280] hover:text-[#1F1F1F] transition hidden sm:inline">Đăng nhập</Link>
                  <Link to="/signup" className="text-sm font-semibold px-4 py-2 bg-[#D4AF37] text-[#1F1F1F] rounded-lg hover:bg-[#B08D57] transition shadow-sm">Đăng ký</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-[#E5E7EB] p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          {sideContent}
        </aside>

        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-80 bg-white p-6 shadow-xl animate-in slide-in-from-left">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1F1F1F]">Bộ lọc</h2>
                <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5 text-[#6B7280]" /></button>
              </div>
              {sideContent}
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12 px-4 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-lg font-bold text-[#1F1F1F]">AI Market</span>
          </div>
          <p className="text-[#6B7280] text-sm italic">Cung cấp giải pháp AI hàng đầu cho doanh nghiệp và cá nhân.</p>
          <div className="text-[#6B7280] text-xs">© 2026 AI Market. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
