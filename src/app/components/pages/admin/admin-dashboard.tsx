import React, { useEffect, useState, useMemo } from "react";
import { useAuth, api } from "../../auth-context";
import { Users, Box, DollarSign, BarChart3, TrendingUp, Trash2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [topups, setTopups] = useState<any[]>([]);
  const [clearing, setClearing] = useState(false);

  const loadData = () => {
    if (!accessToken) return;
    const a = api(accessToken);
    a.get("/admin/users").then(d => Array.isArray(d) && setUsers(d));
    a.get("/models").then(d => Array.isArray(d) && setModels(d));
    a.get("/purchases").then(d => Array.isArray(d) && setPurchases(d));
    a.get("/topups").then(d => Array.isArray(d) && setTopups(d));
  };

  useEffect(() => { loadData(); }, [accessToken]);

  const clearFakeData = async () => {
    if (!confirm("Xóa tất cả dữ liệu (models, providers, purchases, topups, usage, tokens)? Dữ liệu user sẽ được giữ lại.")) return;
    setClearing(true);
    try {
      const res = await api(accessToken).post("/admin/clear-data");
      alert(`Đã xóa ${res.deleted || 0} records. Giờ hãy sync models thật từ 9Router tại Admin > Models.`);
      loadData();
    } catch (e) { alert("Lỗi: " + e); }
    setClearing(false);
  };

  const totalRevenue = topups.reduce((s, t) => s + (t.amount || 0), 0);

  // Build revenue chart from real topup data (last 7 days)
  const revenueChartData = useMemo(() => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().split("T")[0];
      const dayTopups = topups.filter(t => t.createdAt?.startsWith(dayStr));
      return {
        name: days[d.getDay()],
        revenue: dayTopups.reduce((s: number, t: any) => s + (t.amount || 0), 0),
      };
    });
  }, [topups]);

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Total Models", value: models.length, icon: Box, color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
    { label: "Total Purchases", value: purchases.length, icon: BarChart3, color: "bg-green-50 text-green-600" },
    { label: "Revenue (credits)", value: totalRevenue.toLocaleString(), icon: DollarSign, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1F1F1F]">Admin Dashboard</h1>
            <p className="text-[#6B7280]">Tổng quan hệ thống</p>
          </div>
          <button onClick={clearFakeData} disabled={clearing} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm">
            <Trash2 className="w-4 h-4" />
            {clearing ? "Đang xóa..." : "Xóa toàn bộ dữ liệu"}
          </button>
        </div>
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

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#D4AF37]" /> Revenue Overview (7 ngày)
        </h3>
        <div className="h-64">
          {totalRevenue === 0 ? (
            <div className="flex items-center justify-center h-full text-[#6B7280] text-sm">Chưa có dữ liệu revenue</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
