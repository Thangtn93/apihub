import React, { useEffect, useState } from "react";
import { useAuth, api } from "../../auth-context";
import { Plus, Trash2, Edit2, Save, X, ImageIcon, Percent } from "lucide-react";
import { toast } from "sonner";

const emptyAccount = { 
  name: "", 
  provider: "OpenAI", 
  thumbnail: "", 
  description: "", 
  originalPrice: 0, 
  salePrice: 0, 
  status: "active" 
};

export function AdminAccountsPage() {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyAccount });
  const [editing, setEditing] = useState<string | null>(null);

  const load = () => {
    api(accessToken).get("/accounts").then(d => {
      if (Array.isArray(d)) setAccounts(d);
    });
  };

  useEffect(() => { load(); }, [accessToken]);

  const add = async () => {
    if (!form.name || !form.salePrice) {
      toast.error("Vui lòng nhập tên và giá bán");
      return;
    }
    await api(accessToken).post("/accounts", form);
    toast.success("Thêm tài khoản thành công!");
    setForm({ ...emptyAccount });
    setShowAdd(false);
    load();
  };

  const update = async (id: string) => {
    await api(accessToken).put(`/accounts/${id}`, form);
    toast.success("Cập nhật thành công!");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa tài khoản này khỏi hệ thống?")) return;
    await api(accessToken).del(`/accounts/${id}`);
    toast.success("Đã xóa tài khoản");
    load();
  };

  const renderField = (label: string, field: string, type = "text", placeholder = "") => (
    <div key={field}>
      <label className="text-xs text-[#6B7280] block mb-1">{label}</label>
      <input 
        type={type} 
        value={(form as any)[field] || ""} 
        placeholder={placeholder}
        onChange={e => setForm({ ...form, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none" 
      />
    </div>
  );

  const formUI = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {renderField("Tên Tài Khoản (vd: ChatGPT Plus)", "name")}
      <div>
        <label className="text-xs text-[#6B7280] block mb-1">Provider (App)</label>
        <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0] focus:ring-[#D4AF37] outline-none">
          {["OpenAI", "Anthropic", "Google", "Midjourney", "Notion", "Khác"].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      {renderField("Link Ảnh Bìa (Thumbnail URL)", "thumbnail", "text", "https://...")}
      {renderField("Giá Sale (VND)", "salePrice", "number")}
      {renderField("Giá Gốc (VND)", "originalPrice", "number")}
      <div>
        <label className="text-xs text-[#6B7280] block mb-1">Trạng thái</label>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0] focus:ring-[#D4AF37] outline-none">
          <option value="active">Đang Bán (Active)</option>
          <option value="inactive">Tạm Ngưng (Inactive)</option>
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className="text-xs text-[#6B7280] block mb-1">Mô tả ngắn</label>
        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Mô tả các tính năng tài khoản..."
          className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Quản lý Tài Khoản (Marketplace)</h1>
          <p className="text-[#6B7280]">{accounts.length} sản phẩm đang có</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setForm({ ...emptyAccount }); }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition text-sm">
          <Plus className="w-4 h-4" /> Thêm Sản Phẩm
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-[#D4AF37] shadow-lg p-5 space-y-4">
          <h3 className="font-semibold text-[#1F1F1F] border-b pb-2">Đăng bán Tài khoản AI mới</h3>
          {formUI}
          <div className="flex gap-2 pt-2">
            <button onClick={add} className="px-5 py-2 bg-[#D4AF37] text-[#1F1F1F] rounded-lg text-sm font-semibold hover:bg-[#B08D57]">Lưu Sản Phẩm</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] hover:bg-gray-50">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0]">
              <tr>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium w-16">Ảnh</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Tên Tài Khoản</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Provider</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Giá Bán</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Giá Gốc</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Trạng thái</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => {
                const discount = acc.originalPrice > acc.salePrice ? Math.round((1 - acc.salePrice / acc.originalPrice) * 100) : 0;
                return (
                  <React.Fragment key={acc.id}>
                    <tr className="border-t border-[#E5E7EB] hover:bg-[#FAF7F0]/50">
                      <td className="px-4 py-3">
                        {acc.thumbnail ? (
                          <img src={acc.thumbnail} alt={acc.name} className="w-10 h-10 rounded object-cover border border-[#E5E7EB]" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1F1F1F]">{acc.name}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{acc.provider}</td>
                      <td className="px-4 py-3 font-bold text-red-500">{acc.salePrice?.toLocaleString('vi-VN')} đ</td>
                      <td className="px-4 py-3 text-[#6B7280]">
                        <span className="line-through">{acc.originalPrice?.toLocaleString('vi-VN')} đ</span>
                        {discount > 0 && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">-{discount}%</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${acc.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {acc.status === "active" ? "Đang bán" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => { setEditing(editing === acc.id ? null : acc.id); setForm(acc); }} className="p-1.5 text-[#6B7280] hover:text-[#D4AF37] bg-white border border-[#E5E7EB] rounded shadow-sm hover:border-[#D4AF37]"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => remove(acc.id)} className="p-1.5 text-red-400 hover:text-white bg-white border border-red-200 rounded shadow-sm hover:bg-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                    {editing === acc.id && (
                      <tr className="border-t border-[#D4AF37]/30 bg-[#FAF7F0]">
                        <td colSpan={7} className="px-4 py-5 shadow-inner">
                          {formUI}
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => update(acc.id)} className="px-4 py-2 bg-[#D4AF37] text-[#1F1F1F] rounded-lg text-sm font-semibold shadow hover:bg-[#B08D57]"><Save className="w-4 h-4 inline mr-1" /> Cập nhật</button>
                            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] shadow hover:bg-gray-50"><X className="w-4 h-4 inline mr-1" /> Hủy</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-[#E5E7EB] mb-3" />
                      <p>Chưa có tài khoản nào được đăng bán.</p>
                      <button onClick={() => { setShowAdd(true); setForm({ ...emptyAccount }); }} className="mt-3 text-[#D4AF37] underline font-medium">Thêm sản phẩm đầu tiên</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
