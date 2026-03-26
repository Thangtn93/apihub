import React, { useState } from "react";
import { Link } from "react-router";
import { supabase } from "../auth-context";
import { Sparkles, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
      toast.success("Email đặt lại mật khẩu đã được gửi!");
    } catch (err: any) {
      toast.error(err.message || "Gửi thất bại");
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
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Quên mật khẩu</h1>
          <p className="text-[#6B7280] mt-1">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <p className="text-[#1F1F1F]">Chúng tôi đã gửi email đặt lại mật khẩu đến <strong>{email}</strong></p>
              <Link to="/login" className="inline-flex items-center gap-1 text-[#D4AF37] font-semibold hover:underline">
                <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-[#1F1F1F] mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#D4AF37] text-[#1F1F1F] font-semibold rounded-lg hover:bg-[#B08D57] transition disabled:opacity-50">
                {loading ? "Đang gửi..." : "Gửi email đặt lại"}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-[#6B7280] hover:text-[#D4AF37]">
                <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
