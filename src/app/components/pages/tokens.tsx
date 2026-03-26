import React, { useEffect, useState } from "react";
import { useAuth, api } from "../auth-context";
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function TokensPage() {
  const { accessToken } = useAuth();
  const [tokens, setTokens] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const load = () => {
    if (!accessToken) return;
    api(accessToken).get("/tokens").then(d => Array.isArray(d) && setTokens(d));
  };

  useEffect(load, [accessToken]);

  const create = async () => {
    if (!name.trim()) { toast.error("Nhập tên token"); return; }
    setCreating(true);
    try {
      await api(accessToken).post("/tokens", { name });
      setName("");
      toast.success("Tạo token thành công!");
      load();
    } catch { toast.error("Tạo thất bại"); }
    finally { setCreating(false); }
  };

  const remove = async (id: string) => {
    await api(accessToken).del(`/tokens/${id}`);
    toast.success("Đã xóa token");
    load();
  };

  const copy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Đã copy API key!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">API Tokens</h1>
        <p className="text-[#6B7280]">Quản lý API keys để truy cập các models</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        <div className="flex gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên token (vd: Production Key)"
            className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm" />
          <button onClick={create} disabled={creating}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition disabled:opacity-50 text-sm">
            <Plus className="w-4 h-4" /> Tạo Token
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tokens.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1F1F1F]">{t.name}</h3>
                  <p className="text-xs text-[#6B7280]">Tạo ngày {new Date(t.createdAt).toLocaleDateString("vi")}</p>
                </div>
              </div>
              <button onClick={() => remove(t.id)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-[#FAF7F0] px-3 py-2 rounded-lg text-[#1F1F1F] truncate">
                {visible[t.id] ? t.key : t.key.slice(0, 8) + "••••••••••••••••"}
              </code>
              <button onClick={() => setVisible(v => ({ ...v, [t.id]: !v[t.id] }))} className="text-[#6B7280] hover:text-[#1F1F1F]">
                {visible[t.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => copy(t.key)} className="text-[#6B7280] hover:text-[#D4AF37]">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {tokens.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E5E7EB]">
            <Key className="w-12 h-12 mx-auto mb-3 text-[#E5E7EB]" />
            <p className="text-[#6B7280]">Chưa có API token nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
