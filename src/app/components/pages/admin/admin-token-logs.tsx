import React, { useEffect, useState } from "react";
import { useAuth, api } from "../../auth-context";
import { ScrollText } from "lucide-react";

export function AdminTokenLogsPage() {
  const { accessToken } = useAuth();
  const [tokens, setTokens] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api(accessToken).get("/tokens").then(d => Array.isArray(d) && setTokens(d));
    api(accessToken).get("/admin/users").then(d => Array.isArray(d) && setUsers(d));
  }, [accessToken]);

  const getUser = (id: string) => users.find(u => u.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Token Logs</h1>
        <p className="text-[#6B7280]">{tokens.length} tokens trong hệ thống</p>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0]">
              <tr>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">User</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Token Name</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Key (prefix)</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Usage</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(t => {
                const u = getUser(t.userId);
                return (
                  <tr key={t.id} className="border-t border-[#E5E7EB]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1F1F1F]">{u?.name || t.userId?.slice(0, 8)}</p>
                      <p className="text-xs text-[#6B7280]">{u?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1F1F1F]">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{t.key?.slice(0, 12)}...</td>
                    <td className="px-4 py-3 text-[#1F1F1F]">{t.usageCount || 0} calls</td>
                    <td className="px-4 py-3 text-[#6B7280]">{new Date(t.createdAt).toLocaleString("vi")}</td>
                  </tr>
                );
              })}
              {tokens.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[#6B7280]">Chưa có token</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
