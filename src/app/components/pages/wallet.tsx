import React, { useEffect, useState } from "react";
import { useAuth, api } from "../auth-context";
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";

const amounts = [50, 100, 200, 500, 1000, 5000];

export function WalletPage() {
  const { accessToken, profile, refreshProfile } = useAuth();
  const [topups, setTopups] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selected, setSelected] = useState(100);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api(accessToken).get("/topups").then(d => Array.isArray(d) && setTopups(d));
    api(accessToken).get("/purchases").then(d => Array.isArray(d) && setPurchases(d));
  }, [accessToken]);

  const handleTopup = async () => {
    const amount = custom ? parseInt(custom) : selected;
    if (!amount || amount <= 0) { toast.error("Số tiền không hợp lệ"); return; }
    setLoading(true);
    try {
      const res = await api(accessToken).post("/topups", { amount });
      if (res.error) { toast.error(res.error); return; }
      toast.success(`Nạp ${amount} credits thành công!`);
      refreshProfile();
      setCustom("");
      api(accessToken).get("/topups").then(d => Array.isArray(d) && setTopups(d));
    } catch { toast.error("Nạp thất bại"); }
    finally { setLoading(false); }
  };

  const history = [
    ...topups.map(t => ({ ...t, type: "topup" as const })),
    ...purchases.map(p => ({ ...p, type: "purchase" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Wallet</h1>
        <p className="text-[#6B7280]">Quản lý credits và nạp tiền</p>
      </div>

      <div className="bg-gradient-to-r from-[#1F1F1F] to-[#8B5A2B] rounded-2xl p-6 text-white">
        <p className="text-sm opacity-70">Số dư hiện tại</p>
        <p className="text-4xl font-bold mt-1">{(profile?.credits || 0).toLocaleString()} <span className="text-lg opacity-70">credits</span></p>
        <div className="flex items-center gap-4 mt-4 text-sm opacity-70">
          <span>~ ${((profile?.credits || 0) * 0.01).toFixed(2)} USD</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#D4AF37]" /> Nạp Credits
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {amounts.map(a => (
            <button key={a} onClick={() => { setSelected(a); setCustom(""); }}
              className={`py-2 rounded-lg text-sm font-semibold transition ${
                selected === a && !custom ? "bg-[#D4AF37] text-[#1F1F1F]" : "bg-[#FAF7F0] text-[#6B7280] hover:bg-[#D4AF37]/20"
              }`}>{a}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <input type="number" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Hoặc nhập số tùy chọn..."
            className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm" />
          <button onClick={handleTopup} disabled={loading}
            className="px-6 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition disabled:opacity-50 text-sm">
            {loading ? "Đang xử lý..." : "Nạp ngay"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="font-semibold text-[#1F1F1F] flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#D4AF37]" /> Lịch sử giao dịch
          </h3>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {history.length === 0 && (
            <p className="text-center py-12 text-[#6B7280]">Chưa có giao dịch</p>
          )}
          {history.map(h => (
            <div key={h.id} className="flex items-center gap-3 px-4 py-3">
              {h.type === "topup" ? (
                <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1F1F1F]">{h.type === "topup" ? "Nạp credits" : `Mua model ${h.modelId}`}</p>
                <p className="text-xs text-[#6B7280]">{new Date(h.createdAt).toLocaleString("vi")}</p>
              </div>
              <span className={`text-sm font-semibold ${h.type === "topup" ? "text-green-600" : "text-red-600"}`}>
                {h.type === "topup" ? `+${h.amount}` : `-${h.price}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
