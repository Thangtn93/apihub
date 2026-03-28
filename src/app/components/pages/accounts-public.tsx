import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, ImageIcon, Star, Filter, ChevronRight, LayoutGrid, List } from "lucide-react";
import { ShopLayout } from "../shop-layout";
import { api } from "../auth-context";

export function PublicAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const providers = ["OpenAI", "Anthropic", "Google", "Midjourney", "Notion", "Khác"];

  useEffect(() => {
    api().get("/accounts")
      .then(d => {
        if (Array.isArray(d)) setAccounts(d.filter(a => a.status === "active"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(search.toLowerCase()) || 
                          acc.description?.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(acc.provider);
    return matchesSearch && matchesProvider;
  });

  const toggleProvider = (p: string) => {
    setSelectedProviders(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const Sidebar = (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#D4AF37]" /> Provider
        </h3>
        <div className="space-y-2.5">
          {providers.map(p => (
            <label key={p} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedProviders.includes(p)}
                  onChange={() => toggleProvider(p)}
                  className="peer appearance-none w-5 h-5 border-2 border-[#E5E7EB] rounded checked:bg-[#D4AF37] checked:border-[#D4AF37] transition-all"
                />
                <ChevronRight className="absolute w-3 h-3 text-[#1F1F1F] left-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm text-[#6B7280] group-hover:text-[#1F1F1F] transition-colors">{p}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-[#E5E7EB]">
        <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider mb-4">Loại hình</h3>
        <div className="space-y-2">
          {["Theo tháng", "Vĩnh viễn", "Theo tài khoản"].map(t => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group opacity-50 cursor-not-allowed">
              <input type="checkbox" disabled className="w-5 h-5 border-2 border-[#E5E7EB] rounded" />
              <span className="text-sm text-[#6B7280]">{t}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ShopLayout sideContent={Sidebar}>
      <div className="space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <nav className="flex items-center gap-2 text-xs text-[#6B7280] mb-2">
              <Link to="/" className="hover:text-[#D4AF37]">Trang chủ</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#1F1F1F] font-medium">Marketplace</span>
            </nav>
            <h1 className="text-3xl font-black text-[#1F1F1F] tracking-tight">Tài Khoản AI</h1>
            <p className="text-[#6B7280] mt-1">Danh sách tất cả các loại tài khoản AI đang được hỗ trợ.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-[#E5E7EB] p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#FAF7F0] text-[#D4AF37]' : 'text-[#6B7280] hover:text-[#1F1F1F]'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#FAF7F0] text-[#D4AF37]' : 'text-[#6B7280] hover:text-[#1F1F1F]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] group-focus-within:text-[#D4AF37] transition-colors" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm tài khoản (vd: GPT Plus, Midjourney...)"
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all text-sm"
          />
        </div>

        {/* Grid/List Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" 
            : "flex flex-col gap-4"
          }>
            {filtered.map(acc => {
              const discount = acc.originalPrice > acc.salePrice ? Math.round((1 - acc.salePrice / acc.originalPrice) * 100) : 0;
              return (
                <Link key={acc.id} to={`/marketplace/${acc.id}`} 
                  className={`bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-2xl hover:border-[#D4AF37]/40 transition-all duration-300 group ${
                    viewMode === 'list' ? 'flex items-center gap-6 p-4' : 'flex flex-col'
                  }`}
                >
                  <div className={`${viewMode === 'list' ? 'w-48 shrink-0 aspect-[4/3]' : 'aspect-[16/9] w-full'} bg-[#FAF7F0] relative overflow-hidden flex items-center justify-center`}>
                    {acc.thumbnail ? (
                      <img src={acc.thumbnail} alt={acc.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-[#E5E7EB]" />
                    )}
                    {discount > 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg uppercase tracking-tight">
                        Giảm {discount}%
                      </div>
                    )}
                  </div>

                  <div className={`p-6 flex flex-col flex-1 ${viewMode === 'list' ? 'p-0' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">
                        {acc.provider}
                      </span>
                      <div className="flex items-center gap-1 text-[#D4AF37]">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-bold">4.9</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1F1F1F] group-hover:text-[#D4AF37] transition line-clamp-2 leading-tight">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-3 line-clamp-2 leading-relaxed flex-1">
                      {acc.description || `${acc.provider} Premium Account with full access.`}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-[#FAF7F0] flex items-center justify-between gap-3">
                      <div className="flex-1">
                        {discount > 0 && (
                          <p className="text-[10px] text-[#6B7280] line-through decoration-red-400">
                            {acc.originalPrice.toLocaleString('vi-VN')}đ
                          </p>
                        )}
                        <p className="text-lg font-black text-red-500 tracking-tight">
                          {acc.salePrice.toLocaleString('vi-VN')}
                          <span className="text-xs ml-0.5 font-bold italic">đ</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/marketplace/${acc.id}`} className="px-3 py-2 bg-gray-100 text-[#1F1F1F] text-[10px] font-bold rounded-lg hover:bg-gray-200 transition-all">
                          Chi tiết
                        </Link>
                        <Link 
                          to={`/checkout/marketplace/${acc.id}`}
                          className="px-4 py-2 bg-[#D4AF37] text-[#1F1F1F] text-xs font-black rounded-lg hover:bg-[#B08D57] transition-all shadow-sm"
                        >
                          Mua ngay
                        </Link>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-[#E5E7EB]">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-[#E5E7EB]" />
            <h3 className="text-lg font-bold text-[#1F1F1F]">Không tìm thấy kết quả</h3>
            <p className="text-[#6B7280] text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
