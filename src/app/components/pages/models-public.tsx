import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, Cpu, Star, Filter, ChevronRight, LayoutGrid, List, Zap, ShieldCheck } from "lucide-react";
import { ShopLayout } from "../shop-layout";
import { api } from "../auth-context";

export function PublicModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const providers = ["OpenAI", "Anthropic", "Google", "Meta", "DeepSeek", "Mistral", "Qwen"];
  const categories = ["Chat", "OCR", "Embedding", "RAG"];

  useEffect(() => {
    api().get("/models")
      .then(d => {
        if (Array.isArray(d)) setModels(d.filter(m => m.status === "active" || !m.status));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = models.filter(m => {
    const matchesSearch = (m.displayName || m.name).toLowerCase().includes(search.toLowerCase()) || 
                          m.description?.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(m.provider);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(m.category);
    return matchesSearch && matchesProvider && matchesCategory;
  });

  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
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
              <input 
                type="checkbox" 
                checked={selectedProviders.includes(p)}
                onChange={() => toggleFilter(selectedProviders, setSelectedProviders, p)}
                className="w-5 h-5 border-2 border-[#E5E7EB] rounded checked:bg-[#D4AF37] checked:border-[#D4AF37] transition-all"
              />
              <span className="text-sm text-[#6B7280] group-hover:text-[#1F1F1F]">{p}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-[#E5E7EB]">
        <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider mb-4">Loại Model</h3>
        <div className="space-y-2.5">
          {categories.map(c => (
            <label key={c} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedCategories.includes(c)}
                onChange={() => toggleFilter(selectedCategories, setSelectedCategories, c)}
                className="w-5 h-5 border-2 border-[#E5E7EB] rounded checked:bg-[#D4AF37] checked:border-[#D4AF37] transition-all"
              />
              <span className="text-sm text-[#6B7280] group-hover:text-[#1F1F1F]">{c}</span>
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
              <span className="text-[#1F1F1F] font-medium">API Models</span>
            </nav>
            <h1 className="text-3xl font-black text-[#1F1F1F] tracking-tight flex items-center gap-3">
              Mô hình AI <Zap className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
            </h1>
            <p className="text-[#6B7280] mt-1">Sử dụng sức mạnh của các Large Language Models (LLMs) qua API duy nhất.</p>
          </div>
          
          <div className="flex bg-white border border-[#E5E7EB] p-1 rounded-lg self-end md:self-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#FAF7F0] text-[#D4AF37]' : 'text-[#6B7280]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#FAF7F0] text-[#D4AF37]' : 'text-[#6B7280]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] group-focus-within:text-[#D4AF37] tracking-tight" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm model AI (vd: GPT-4o, Claude 3.5 Sonnet...)"
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all text-sm"
          />
        </div>

        {/* Grid/List Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" 
            : "flex flex-col gap-4"
          }>
            {filtered.map(model => (
              <Link key={model.id} to={`/tokens/${model.id}`} 
                className={`bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:shadow-2xl hover:border-[#D4AF37]/40 transition-all duration-300 group ${
                  viewMode === 'list' ? 'flex items-center justify-between py-4' : 'flex flex-col'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] bg-[#FAF7F0] px-2 py-1 rounded">
                        {model.provider}
                      </span>
                      {model.id.includes('preview') || model.id.includes('beta') ? (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded italic">BETA</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-green-50 text-green-700">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[10px] font-bold">READY</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black text-[#1F1F1F] group-hover:text-[#D4AF37] transition leading-tight mb-2">
                    {model.displayName || model.name}
                  </h3>
                  
                  <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed mb-4">
                    {model.description || `Mô hình ngôn ngữ mạnh mẽ của ${model.provider}. Hỗ trợ context window ${model.contextWindow || 'tiêu chuẩn'}.`}
                  </p>
                </div>

                <div className={`flex items-center justify-between pt-4 border-t border-[#FAF7F0] ${viewMode === 'list' ? 'pt-0 border-0 gap-8' : ''}`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#6B7280] font-medium uppercase tracking-tighter">Giá yêu cầu</span>
                    <span className="text-sm font-black text-[#D4AF37]">
                      {model.price} <span className="text-[10px] opacity-70">cr</span>
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] text-[#6B7280] font-medium uppercase tracking-tighter">Phân loại</span>
                    <span className="text-xs font-bold text-[#1F1F1F]">{model.category || 'Chat'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-[#E5E7EB]">
            <Cpu className="w-16 h-16 mx-auto mb-4 text-[#E5E7EB]" />
            <h3 className="text-lg font-bold text-[#1F1F1F]">Không tìm thấy Model nào</h3>
            <p className="text-[#6B7280] text-sm">Hãy thử tìm kiếm với các từ khóa như "gpt", "claude", "embed"...</p>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
