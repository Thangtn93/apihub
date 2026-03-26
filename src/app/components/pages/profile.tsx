import React, { useState } from "react";
import { useAuth, api } from "../auth-context";
import { UserCircle, Save } from "lucide-react";
import { toast } from "sonner";

export function ProfilePage() {
  const { profile, accessToken, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api(accessToken).put("/user/profile", { name });
      await refreshProfile();
      toast.success("Cập nhật profile thành công!");
    } catch { toast.error("Cập nhật thất bại"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Profile</h1>
        <p className="text-[#6B7280]">Quản lý thông tin cá nhân</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B5A2B] flex items-center justify-center text-white text-2xl font-bold">
            {profile?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1F1F1F]">{profile?.name}</h2>
            <p className="text-sm text-[#6B7280]">{profile?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] capitalize">{profile?.role}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#1F1F1F] mb-1 block">Họ tên</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none" />
          </div>
          <div>
            <label className="text-sm text-[#1F1F1F] mb-1 block">Email</label>
            <input value={profile?.email || ""} disabled
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-gray-100 text-[#6B7280]" />
          </div>
          <div>
            <label className="text-sm text-[#1F1F1F] mb-1 block">Ngày tham gia</label>
            <input value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi") : ""} disabled
              className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-gray-100 text-[#6B7280]" />
          </div>
          <button onClick={handleSave} disabled={loading}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition disabled:opacity-50">
            <Save className="w-4 h-4" /> {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
