import React, { useEffect, useState } from "react";
import { useAuth, api } from "../../auth-context";
import { ArrowUpCircle } from "lucide-react";

export function AdminTopupsPage() {
  const { accessToken } = useAuth();
  const [topups, setTopups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api(accessToken).get("/topups").then(d => Array.isArray(d) && setTopups(d));
    api(accessToken).get("/admin/users").then(d => Array.isArray(d) && setUsers(d));
  }, [accessToken]);

  const getUser = (id: string) => users.find(u => u.id === id);
  const total = topups.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Quản lý Top-ups</h1>
          <p className="text-[#6B7280]">{topups.length} lần nạp · Tổng: {total.toLocaleString()} credits</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0]">
              <tr>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">User</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {topups.map(t => {
                const u = getUser(t.userId);
                return (
                  <tr key={t.id} className="border-t border-[#E5E7EB]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1F1F1F]">{u?.name || t.userId?.slice(0, 8)}</p>
                      <p className="text-xs text-[#6B7280]">{u?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">+{t.amount} credits</td>
                    <td className="px-4 py-3 text-[#6B7280]">{new Date(t.createdAt).toLocaleString("vi")}</td>
                  </tr>
                );
              })}
              {topups.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-[#6B7280]">Chưa có top-up</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
