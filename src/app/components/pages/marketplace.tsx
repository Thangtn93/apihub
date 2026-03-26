import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../auth-context";
import { Search, Filter, Cpu, MessageSquare, ScanText, Database, Layers, Star } from "lucide-react";

const categories = [
  { id: "all", label: "Tất cả", icon: Layers },
  { id: "Chat", label: "Chat", icon: MessageSquare },
  { id: "OCR", label: "OCR", icon: ScanText },
  { id: "RAG", label: "RAG", icon: Database },
  { id: "Embedding", label: "Embedding", icon: Cpu },
];

const providerColors: Record<string, string> = {
  OpenAI: "bg-green-100 text-green-700",
  Anthropic: "bg-purple-100 text-purple-700",
  Google: "bg-blue-100 text-blue-700",
  Cohere: "bg-orange-100 text-orange-700",
  Meta: "bg-indigo-100 text-indigo-700",
};

export function MarketplacePage() {
  const [models, setModels] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [provider, setProvider] = useState("all");
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    api().get("/models").then(d => Array.isArray(d) && setModels(d));
    api().get("/providers").then(d => Array.isArray(d) && setProviders(d));
  }, []);

  const filtered = models.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "all" && m.category !== category) return false;
    if (provider !== "all" && m.provider !== provider) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Marketplace</h1>
        <p className="text-[#6B7280]">Khám phá và mua các AI models hàng đầu</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm models..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                category === c.id ? "bg-[#D4AF37] text-[#1F1F1F]" : "bg-[#E5E7EB] text-[#6B7280] hover:bg-[#D4AF37]/20"
              }`}>
              <c.icon className="w-3.5 h-3.5" /> {c.label}
            </button>
          ))}
          <select value={provider} onChange={e => setProvider(e.target.value)}
            className="ml-auto px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-sm bg-white outline-none">
            <option value="all">Tất cả Providers</option>
            {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(model => (
          <Link key={model.id} to={`/marketplace/${model.id}`}
            className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-lg hover:border-[#D4AF37]/50 transition group">
            <div className="flex items-start justify-between mb-3">
              <div className={`px-2 py-1 rounded text-xs font-medium ${providerColors[model.provider] || "bg-gray-100 text-gray-700"}`}>
                {model.provider}
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37]">{model.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1F1F1F] group-hover:text-[#D4AF37] transition">{model.name}</h3>
            <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">{model.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                <span className="text-sm text-[#6B7280]">4.8</span>
              </div>
              <span className="text-lg font-bold text-[#D4AF37]">{model.price} <span className="text-xs text-[#6B7280]">credits</span></span>
            </div>
            {model.contextWindow && (
              <div className="mt-2 text-xs text-[#6B7280]">Context: {model.contextWindow}</div>
            )}
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-[#6B7280]">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy model nào</p>
        </div>
      )}
    </div>
  );
}
