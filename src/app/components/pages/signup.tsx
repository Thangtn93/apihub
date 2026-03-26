import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../auth-context";
import { Eye, EyeOff, Sparkles, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Mật khẩu không khớp"); return; }
    if (password.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    setLoading(true);
    try {
      await signUp(email, password, name);
      toast.success("Đăng ký thành công!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-2xl font-bold text-[#1F1F1F]">AI Market</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Tạo tài khoản mới</h1>
          <p className="text-[#6B7280] mt-1">Bắt đầu sử dụng AI Models Marketplace</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-[#1F1F1F] mb-1 block">Họ tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#1F1F1F] mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#1F1F1F] mb-1 block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-2.5 border border-[#E5E7EB] rounded-lg bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-[#1F1F1F] mb-1 block">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#D4AF37] text-[#1F1F1F] font-semibold rounded-lg hover:bg-[#B08D57] transition disabled:opacity-50">
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-[#6B7280]">
            Đã có tài khoản? <Link to="/login" className="text-[#D4AF37] font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
