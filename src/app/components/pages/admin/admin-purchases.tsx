import React, { useEffect, useState } from "react";
import { useAuth, api } from "../../auth-context";
import { Receipt } from "lucide-react";

export function AdminPurchasesPage() {
  const { accessToken } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api(accessToken).get("/purchases").then(d => Array.isArray(d) && setPurchases(d));
    api(accessToken).get("/admin/users").then(d => Array.isArray(d) && setUsers(d));
    api().get("/models").then(d => Array.isArray(d) && setModels(d));
  }, [accessToken]);

  const getUser = (id: string) => users.find(u => u.id === id);
  const getModel = (id: string) => models.find(m => m.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Quản lý Purchases</h1>
        <p className="text-[#6B7280]">{purchases.length} giao dịch mua</p>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0]">
              <tr>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">User</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Model</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Price</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => {
                const u = getUser(p.userId);
                const m = getModel(p.modelId);
                return (
                  <tr key={p.id} className="border-t border-[#E5E7EB]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1F1F1F]">{u?.name || p.userId.slice(0, 8)}</p>
                      <p className="text-xs text-[#6B7280]">{u?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1F1F1F]">{m?.name || p.modelId}</td>
                    <td className="px-4 py-3 font-semibold text-[#D4AF37]">{p.price} credits</td>
                    <td className="px-4 py-3 text-[#6B7280]">{new Date(p.createdAt).toLocaleString("vi")}</td>
                  </tr>
                );
              })}
              {purchases.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-[#6B7280]">Chưa có giao dịch</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
