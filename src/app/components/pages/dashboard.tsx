import React, { useEffect, useState } from "react";
import { useAuth, api } from "../auth-context";
import { Wallet, ShoppingBag, Key, BarChart3, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function DashboardPage() {
  const { profile, accessToken } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    const a = api(accessToken);
    a.get("/purchases").then(d => Array.isArray(d) && setPurchases(d));
    a.get("/tokens").then(d => Array.isArray(d) && setTokens(d));
    a.get("/usage-logs").then(d => Array.isArray(d) && setUsageLogs(d));
  }, [accessToken]);

  // Build usage chart from real data (last 7 days)
  const usageChartData = (() => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return last7.map(d => {
      const dayStr = d.toISOString().split("T")[0];
      const calls = usageLogs.filter(l => l.createdAt?.startsWith(dayStr)).length;
      return { name: days[d.getDay()], calls };
    });
  })();

  const totalCalls7d = usageLogs.filter(l => {
    const d = new Date(l.createdAt);
    return d > new Date(Date.now() - 7 * 86400000);
  }).length;

  const stats = [
    { label: "Credit Balance", value: (profile?.credits || 0).toLocaleString(), icon: Wallet, color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
    { label: "Models Purchased", value: purchases.length, icon: ShoppingBag, color: "bg-[#8B5A2B]/10 text-[#8B5A2B]" },
    { label: "API Tokens", value: tokens.length, icon: Key, color: "bg-[#B08D57]/10 text-[#B08D57]" },
    { label: "API Calls (7d)", value: totalCalls7d.toLocaleString(), icon: BarChart3, color: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Dashboard</h1>
        <p className="text-[#6B7280]">Xin chào, {profile?.name || "User"}!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#6B7280]">{s.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1F1F1F]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" /> API Usage (7 ngày)
          </h3>
          <div className="h-64">
            {totalCalls7d === 0 ? (
              <div className="flex items-center justify-center h-full text-[#6B7280] text-sm">Chưa có dữ liệu usage</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
          <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D4AF37]" /> Hoạt động gần đây
          </h3>
          <div className="space-y-3">
            {purchases.length === 0 ? (
              <p className="text-[#6B7280] text-sm text-center py-8">Chưa có hoạt động nào</p>
            ) : (
              purchases.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1F1F1F]">Mua model {p.modelId}</p>
                    <p className="text-xs text-[#6B7280]">{new Date(p.createdAt).toLocaleDateString("vi")}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#8B5A2B]">-{p.price} credits</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
