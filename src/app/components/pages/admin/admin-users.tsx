import React, { useEffect, useState } from "react";
import { useAuth, api } from "../../auth-context";
import { Users, Shield, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

export function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const load = () => {
    if (!accessToken) return;
    api(accessToken).get("/admin/users").then(d => Array.isArray(d) && setUsers(d));
  };
  useEffect(load, [accessToken]);

  const save = async (id: string) => {
    await api(accessToken).put(`/admin/users/${id}`, editData);
    toast.success("Cập nhật thành công!");
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Quản lý Users</h1>
        <p className="text-[#6B7280]">{users.length} users</p>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF7F0]">
              <tr>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">User</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Role</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Credits</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Ngày tạo</th>
                <th className="text-left px-4 py-3 text-[#6B7280] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-[#E5E7EB]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[#1F1F1F]">{u.name || "N/A"}</p>
                      <p className="text-xs text-[#6B7280]">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editing === u.id ? (
                      <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })}
                        className="px-2 py-1 border rounded text-xs">
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-gray-100 text-gray-600"}`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === u.id ? (
                      <input type="number" value={editData.credits} onChange={e => setEditData({ ...editData, credits: parseInt(e.target.value) || 0 })}
                        className="w-24 px-2 py-1 border rounded text-xs" />
                    ) : (
                      <span className="font-medium text-[#1F1F1F]">{(u.credits || 0).toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi") : "N/A"}</td>
                  <td className="px-4 py-3">
                    {editing === u.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => save(u.id)} className="text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditing(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditing(u.id); setEditData({ role: u.role, credits: u.credits || 0 }); }} className="text-[#6B7280] hover:text-[#D4AF37]">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
