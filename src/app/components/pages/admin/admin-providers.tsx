import React, { useEffect, useState } from "react";
import { useAuth, api } from "../../auth-context";
import { Server, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminProvidersPage() {
  const { accessToken } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = () => {
    api().get("/providers").then(d => Array.isArray(d) && setProviders(d));
  };
  useEffect(load, []);

  const add = async () => {
    if (!name.trim()) return;
    await api(accessToken).post("/providers", { name, description: desc, modelsCount: 0, status: "active" });
    toast.success("Thêm provider thành công!");
    setName(""); setDesc("");
    load();
  };

  const remove = async (id: string) => {
    await api(accessToken).del(`/providers/${id}`);
    toast.success("Đã xóa provider");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Quản lý Providers</h1>
        <p className="text-[#6B7280]">{providers.length} providers</p>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên provider"
            className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mô tả"
            className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm" />
          <button onClick={add} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition text-sm shrink-0">
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#8B5A2B]/10 flex items-center justify-center">
                  <Server className="w-5 h-5 text-[#8B5A2B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1F1F1F]">{p.name}</h3>
                  <p className="text-xs text-[#6B7280]">{p.description}</p>
                </div>
              </div>
              <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">{p.status}</span>
              <span className="text-xs text-[#6B7280]">{p.modelsCount} models</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
