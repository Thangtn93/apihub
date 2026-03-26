import React, { useEffect, useState } from "react";
import { useAuth, api } from "../../auth-context";
import { Box, Plus, Trash2, Edit2, Save, X, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

const emptyModel = { name: "", provider: "", category: "Chat", description: "", price: 0, inputPrice: 0, outputPrice: 0, contextWindow: "", status: "active" };

export function AdminModelsPage() {
  const { accessToken } = useAuth();
  const [models, setModels] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyModel });
  const [editing, setEditing] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [routerInfo, setRouterInfo] = useState<any>(null);

  const load = () => api().get("/models").then(d => Array.isArray(d) && setModels(d));
  useEffect(() => {
    load();
    // Load router config for debug
    if (accessToken) {
      api(accessToken).get("/admin/router-config").then(d => !d.error && setRouterInfo(d));
    }
  }, [accessToken]);

  const add = async () => {
    if (!form.name) return;
    await api(accessToken).post("/models", form);
    toast.success("Thêm model thành công!");
    setForm({ ...emptyModel });
    setShowAdd(false);
    load();
  };

  const update = async (id: string) => {
    await api(accessToken).put(`/models/${id}`, form);
    toast.success("Cập nhật thành công!");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa model này?")) return;
    await api(accessToken).post("/models/delete", { id });
    toast.success("Đã xóa model");
    load();
  };

  const syncModels = async () => {
    setSyncing(true);
    try {
      const res = await api(accessToken).post("/sync-models");
      console.log("Sync response:", JSON.stringify(res));
      if (res.error) {
        toast.error(`Sync lỗi: ${res.error}${res.url ? ` (URL: ${res.url})` : ""}`);
      } else {
        toast.success(`Sync thành công! ${res.synced}/${res.total} models từ 9Router`);
        load();
      }
    } catch (e: any) {
      toast.error(`Sync lỗi: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const F = ({ label, field, type = "text" }: { label: string; field: string; type?: string }) => (
    <div>
      <label className="text-xs text-[#6B7280] block mb-1">{label}</label>
      <input type={type} value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none" />
    </div>
  );

  const formUI = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <F label="Tên model" field="name" />
      <F label="Provider" field="provider" />
      <div>
        <label className="text-xs text-[#6B7280] block mb-1">Category</label>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0]">
          {["Chat", "OCR", "RAG", "Embedding"].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <F label="Price (credits)" field="price" type="number" />
      <F label="Input Price ($/1K tokens)" field="inputPrice" type="number" />
      <F label="Output Price ($/1K tokens)" field="outputPrice" type="number" />
      <F label="Context Window" field="contextWindow" />
      <div>
        <label className="text-xs text-[#6B7280] block mb-1">Status</label>
        <select value={(form as any).status || "active"} onChange={e => setForm({ ...form, status: e.target.value })}
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0]">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-[#6B7280] block mb-1">Mô tả</label>
        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none" />
      </div>
    </div>
  );

  const categories = ["All", ...Array.from(new Set(models.map(m => m.category).filter(Boolean)))];
  const filtered = models.filter(m => {
    const matchSearch = !filter || m.name?.toLowerCase().includes(filter.toLowerCase()) || m.provider?.toLowerCase().includes(filter.toLowerCase()) || m.id?.toLowerCase().includes(filter.toLowerCase());
    const matchCat = catFilter === "All" || m.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Quản lý Models</h1>
          <p className="text-[#6B7280]">{models.length} models ({filtered.length} hiển thị)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncModels} disabled={syncing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#8B5A2B] text-white rounded-lg font-semibold hover:bg-[#6d4522] transition text-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Đang sync..." : "Sync từ 9Router"}
          </button>
          <button onClick={async () => {
              if (!confirm(`Xóa toàn bộ ${models.length} models?`)) return;
              setClearing(true);
              try {
                console.log("Calling clear-models, token:", accessToken ? "SET" : "NULL");
                const res = await api(accessToken).post("/admin/clear-models");
                console.log("clear-models response:", JSON.stringify(res));
                if (res.error) {
                  toast.error(`Lỗi: ${res.error}`);
                } else {
                  toast.success(`Đã xóa ${res.deleted || 0} models`);
                  load();
                }
              } catch (e: any) {
                console.error("clear-models exception:", e);
                toast.error(`Lỗi: ${e.message}`);
              } finally {
                setClearing(false);
              }
            }}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition text-sm disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> {clearing ? "Đang xóa..." : "Xóa tất cả Models"}
          </button>
          <button onClick={() => { setShowAdd(!showAdd); setForm({ ...emptyModel }); }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition text-sm">
            <Plus className="w-4 h-4" /> Thêm Model
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#FAF7F0] border border-[#D4AF37]/30 rounded-xl p-4 text-sm text-[#8B5A2B]">
        <p className="font-semibold mb-1">Kiến trúc Backend Proxy</p>
        <p>Models được sync từ 9Router API. User sử dụng API key <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">mk_*</code> riêng để gọi API qua server proxy.</p>
        {routerInfo && (
          <div className="mt-2 p-2 bg-white rounded-lg border border-[#E5E7EB] text-xs font-mono">
            <p>API Base: <span className="text-[#D4AF37]">{routerInfo.ROUTER_API_BASE}</span></p>
            <p>API Key: <span className={routerInfo.ROUTER_API_KEY_SET ? "text-green-600" : "text-red-500"}>{routerInfo.ROUTER_API_KEY_SET ? `✓ Set (${routerInfo.ROUTER_API_KEY_PREVIEW})` : "✗ NOT SET"}</span></p>
            <p>Fetch URL: <span className="text-[#6B7280]">{routerInfo.ROUTER_API_BASE}/v1/models</span></p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input placeholder="Tìm kiếm model..." value={filter} onChange={e => setFilter(e.target.value)}
          className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#D4AF37] outline-none" />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${catFilter === c ? "bg-[#D4AF37] text-[#1F1F1F]" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#D4AF37]"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-4">
          <h3 className="font-semibold text-[#1F1F1F]">Thêm model mới (thủ công)</h3>
          {formUI}
          <div className="flex gap-2">
            <button onClick={add} className="px-4 py-2 bg-[#D4AF37] text-[#1F1F1F] rounded-lg text-sm font-semibold hover:bg-[#B08D57]">Thêm</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280]">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0]">
              <tr>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Model ID</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Display Name</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Provider</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Category</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Price</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <React.Fragment key={m.id}>
                  <tr className="border-t border-[#E5E7EB] hover:bg-[#FAF7F0]/50">
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280] max-w-[200px] truncate" title={m.id}>{m.id}</td>
                    <td className="px-4 py-3 font-medium text-[#1F1F1F]">{m.displayName || m.name}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{m.provider}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-[#D4AF37]/10 text-[#D4AF37]">{m.category}</span></td>
                    <td className="px-4 py-3 font-medium text-[#D4AF37]">{m.price} cr</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${m.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {m.status || "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <button onClick={() => { setEditing(editing === m.id ? null : m.id); setForm(m); }} className="text-[#6B7280] hover:text-[#D4AF37]"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => remove(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  {editing === m.id && (
                    <tr className="border-t border-[#E5E7EB] bg-[#FAF7F0]">
                      <td colSpan={7} className="px-4 py-4">
                        {formUI}
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => update(m.id)} className="px-3 py-1.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg text-xs font-semibold"><Save className="w-3 h-3 inline mr-1" />Save</button>
                          <button onClick={() => setEditing(null)} className="px-3 py-1.5 border rounded-lg text-xs text-[#6B7280]"><X className="w-3 h-3 inline mr-1" />Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#6B7280]">Không có model nào. Nhấn "Sync từ 9Router" để lấy danh sách.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}