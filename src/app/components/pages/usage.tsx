import React, { useEffect, useState, useMemo } from "react";
import { useAuth, api } from "../auth-context";
import { BarChart3, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function UsagePage() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api(accessToken).get("/usage-logs").then(d => Array.isArray(d) && setLogs(d));
  }, [accessToken]);

  // Build chart data from real logs (last 14 days)
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dayStr = d.toISOString().split("T")[0];
      const dayLogs = logs.filter(l => l.createdAt?.startsWith(dayStr));
      return {
        date: d.toLocaleDateString("vi", { day: "2-digit", month: "2-digit" }),
        calls: dayLogs.length,
        cost: dayLogs.reduce((s: number, l: any) => s + (l.cost || 0), 0),
      };
    });
  }, [logs]);

  const totalCalls = chartData.reduce((s, d) => s + d.calls, 0);
  const totalCost = chartData.reduce((s, d) => s + d.cost, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Usage Logs</h1>
        <p className="text-[#6B7280]">Theo dõi lịch sử sử dụng API</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Calls (14d)", value: totalCalls.toLocaleString() },
          { label: "Total Cost (credits)", value: totalCost.toFixed(3) },
          { label: "Avg Calls/Day", value: Math.round(totalCalls / 14).toLocaleString() },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <p className="text-sm text-[#6B7280]">{s.label}</p>
            <p className="text-2xl font-bold text-[#1F1F1F] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
        <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#D4AF37]" /> API Calls (14 ngày)
        </h3>
        <div className="h-64">
          {totalCalls === 0 ? (
            <div className="flex items-center justify-center h-full text-[#6B7280] text-sm">Chưa có dữ liệu usage</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#D4AF37" strokeWidth={2} dot={{ fill: "#D4AF37" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="font-semibold text-[#1F1F1F] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" /> Log chi tiết
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0]">
              <tr>
                <th className="text-left px-4 py-2 text-[#6B7280] font-medium">Ngày</th>
                <th className="text-left px-4 py-2 text-[#6B7280] font-medium">Model</th>
                <th className="text-left px-4 py-2 text-[#6B7280] font-medium">Type</th>
                <th className="text-left px-4 py-2 text-[#6B7280] font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-[#6B7280]">Chưa có log nào</td></tr>
              ) : (
                logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((l) => (
                  <tr key={l.id} className="border-t border-[#E5E7EB]">
                    <td className="px-4 py-2.5 text-[#1F1F1F]">{new Date(l.createdAt).toLocaleString("vi")}</td>
                    <td className="px-4 py-2.5 text-[#1F1F1F] font-mono text-xs">{l.modelId || "-"}</td>
                    <td className="px-4 py-2.5 text-[#1F1F1F]">{l.type || "-"}</td>
                    <td className="px-4 py-2.5 text-[#1F1F1F]">{(l.cost || 0).toFixed(4)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
