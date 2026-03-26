import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Sparkles, ShoppingCart, User, Cpu, Star, ExternalLink, ImageIcon } from "lucide-react";
import { useAuth, api } from "../auth-context";

export function LandingPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    // Lấy API công khai dùng helper (đã có sẵn anon key)
    Promise.all([
      api().get("/accounts"),
      api().get("/models")
    ]).then(([accData, modData]) => {
      if (Array.isArray(accData)) {
        setAccounts(accData.filter(a => a.status === "active").slice(0, 6)); // 6 tài khoản hot nhất
      }
      if (Array.isArray(modData)) {
        setModels(modData.filter(m => m.status === "active" || !m.status).slice(0, 6)); // 6 models hot nhất
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F0] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <span className="text-xl font-bold text-[#1F1F1F]">AI Market</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="text-[#6B7280] hover:text-[#D4AF37] transition p-2">
              <ShoppingCart className="w-5 h-5" />
            </button>
            <Link to="/login" className="text-sm font-semibold text-[#6B7280] hover:text-[#1F1F1F] transition">
              Đăng nhập
            </Link>
            <Link to="/signup" className="text-sm font-semibold px-4 py-2 bg-[#D4AF37] text-[#1F1F1F] rounded-lg hover:bg-[#B08D57] transition shadow-sm">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#1F1F1F] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Kỷ nguyên AI trong tầm tay bạn</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Khám phá và sở hữu các Tài khoản AI & Models (API Tokens) mạnh mẽ nhất hiện nay với giá ưu đãi.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Marketplace Section (Accounts) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] flex items-center gap-2">
                🔥 Tài Khoản AI (Marketplace)
              </h2>
              <p className="text-[#6B7280] mt-1">Các gói tài khoản sử dụng AI Premium</p>
            </div>
            <Link to="/marketplace" className="text-sm font-semibold text-[#D4AF37] hover:underline flex items-center gap-1">
              Xem tất cả <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(acc => {
              const discount = acc.originalPrice > acc.salePrice ? Math.round((1 - acc.salePrice / acc.originalPrice) * 100) : 0;
              return (
                <Link key={acc.id} to={`/marketplace/${acc.id}`} className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-xl hover:border-[#D4AF37]/50 transition group flex flex-col">
                  <div className="aspect-[16/9] w-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {acc.thumbnail ? (
                      <img src={acc.thumbnail} alt={acc.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    )}
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
                        -{discount}%
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-[#1F1F1F] group-hover:text-[#D4AF37] transition line-clamp-2">{acc.name}</h3>
                    <p className="text-sm text-[#6B7280] mt-2 line-clamp-2 flex-1">{acc.description || `${acc.provider} Premium Account`}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        {discount > 0 && <p className="text-[10px] text-[#6B7280] line-through">{acc.originalPrice.toLocaleString('vi-VN')}đ</p>}
                        <p className="text-lg font-bold text-red-500 leading-none">{acc.salePrice.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <button className="px-3 py-1.5 bg-[#D4AF37] text-[#1F1F1F] text-[10px] font-black rounded-lg hover:bg-[#B08D57] transition-all whitespace-nowrap">
                        Mua ngay
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
            {accounts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-[#E5E7EB]">
                <p className="text-[#6B7280]">Chưa có tài khoản nào được đăng bán.</p>
              </div>
            )}
          </div>
        </section>

        {/* Tokens Section (Models) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1F1F1F] flex items-center gap-2">
                ⚡ API Models (Tokens)
              </h2>
              <p className="text-[#6B7280] mt-1">Các mô hình ngôn ngữ lớn (LLMs) được hỗ trợ</p>
            </div>
            <Link to="/tokens" className="text-sm font-semibold text-[#D4AF37] hover:underline flex items-center gap-1">
              Xem tất cả <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {models.map(model => (
              <Link key={model.id} to={`/tokens/${model.id}`} className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-lg hover:border-[#D4AF37]/50 transition group flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] bg-[#FAF7F0] px-2 py-1 rounded w-fit">
                      {model.provider}
                    </span>
                    <h3 className="font-bold text-[#1F1F1F] group-hover:text-[#D4AF37] transition text-lg leading-tight mt-1">{model.displayName || model.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 tracking-wider">
                    ENABLED
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] line-clamp-2 flex-1 mb-4">
                  {model.description || `Mô hình AI từ ${model.provider} với Context Window ${model.contextWindow || 'tiêu chuẩn'}.`}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]/50 gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#6B7280] font-medium">{model.category}</span>
                    <span className="text-sm font-bold text-[#D4AF37]">{model.price} cr</span>
                  </div>
                  <button className="px-3 py-1.5 bg-[#D4AF37] text-[#1F1F1F] text-[10px] font-black rounded-lg hover:bg-[#B08D57] transition-all">
                    Mua ngay
                  </button>
                </div>
              </Link>
            ))}
            {models.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-[#E5E7EB]">
                <p className="text-[#6B7280]">Chưa có model nào được sync.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-[#6B7280] text-sm">
          <p>© 2026 AI Market. Nền tảng phân phối Tài khoản & API Models.</p>
        </div>
      </footer>
    </div>
  );
}
