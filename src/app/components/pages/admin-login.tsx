import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, supabase, api } from "../auth-context";
import { Eye, EyeOff, ShieldAlert, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { publicAnonKey, projectId } from "/utils/supabase/info";

export function AdminLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn(email, password);

      const role = result.profile?.role;
      console.log("Admin login: role =", role, "| profile =", result.profile);

      if (role !== "admin") {
        await supabase.auth.signOut();
        toast.error(
          role
            ? "Tài khoản này không có quyền Admin. Vui lòng dùng trang đăng nhập người dùng."
            : "Không lấy được thông tin tài khoản. Vui lòng thử lại."
        );
        return;
      }

      toast.success("Đăng nhập Admin thành công!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsers = async () => {
    if (!confirm("Hành động này sẽ XÓA TOÀN BỘ user hiện tại và tạo lại 1 Admin + 2 Users. Tiếp tục?")) return;
    setResetting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/server/dev/reset-users`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${publicAnonKey}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã reset tài khoản thành công! Bạn có thể đăng nhập ngay.");
      setEmail("admin@example.com");
      setPassword("password123");
    } catch (e: any) {
      toast.error("Lỗi khi reset: " + e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <span className="text-2xl font-bold text-white">AI Market</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Quản Trị Viên</h1>
          <p className="text-gray-400 mt-1">Đăng nhập bằng tài khoản Admin</p>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" className="w-full pl-10 pr-4 py-2.5 border border-gray-700 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-2.5 border border-gray-700 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 mt-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50">
              {loading ? "Đang xử lý..." : "Đăng Nhập Admin"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-3 text-center">Dành cho Developer (Kiểm thử logic)</p>
            <button onClick={handleResetUsers} disabled={resetting} className="w-full py-2 border border-gray-600 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 hover:text-white transition disabled:opacity-50">
              {resetting ? "Đang tạo..." : "Khởi tạo tài khoản Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}