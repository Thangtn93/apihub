import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAuth, api } from "../auth-context";
import { ArrowLeft, CheckCircle2, Copy, Loader2, QrCode, ShieldCheck, Zap } from "lucide-react";
import { ShopLayout } from "../shop-layout";
import { toast } from "sonner";

export function CheckoutPage() {
  const { type, id } = useParams();
  const { accessToken, profile } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    // Load product info
    const endpoint = type === "marketplace" ? "/accounts" : "/models";
    api().get(endpoint).then(data => {
      if (Array.isArray(data)) {
        const found = data.find((p: any) => p.id === id);
        if (found) {
          setProduct(found);
        } else {
          toast.error("Không tìm thấy sản phẩm");
          navigate("/");
        }
      }
      setLoading(false);
    }).catch(err => {
      toast.error("Lỗi khi tải thông tin sản phẩm");
      setLoading(false);
    });
  }, [id, type, accessToken, navigate]);

  const handleCreateOrder = async () => {
    if (!product || submitting) return;
    setSubmitting(true);
    try {
      const amount = product.salePrice || product.price || 0;
      const res = await api(accessToken).post("/orders", {
        productId: product.id,
        productType: type === "marketplace" ? "account" : "model",
        amount,
        paymentMethod: "bank_transfer"
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        setOrder(res);
        toast.success("Đã tạo đơn hàng! Vui lòng thanh toán.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  if (loading) return (
    <ShopLayout sideContent={null}>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    </ShopLayout>
  );

  if (!product) return null;

  const amount = product.salePrice || product.price || 0;
  // Giả sử thông tin ngân hàng cố định
  const BANK_ID = "MB"; // MB Bank
  const ACCOUNT_NO = "0987654321"; // Số tài khoản mẫu
  const ACCOUNT_NAME = "NGUYEN THE THANG"; 
  const qrUrl = order 
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=PAY ${order.id}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : "";

  return (
    <ShopLayout sideContent={null}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Link to={type === "marketplace" ? `/marketplace/${id}` : `/models/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#D4AF37] transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại chi tiết
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#1F1F1F] mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#D4AF37]" /> Thông tin đơn hàng
              </h2>
              
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0">
                  {product.thumbnail ? (
                    <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <QrCode className="w-8 h-8 text-[#D4AF37]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#1F1F1F]">{product.displayName || product.name}</h3>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wider">{product.provider}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6B7280]">Giá sản phẩm</span>
                  <span className="font-bold text-[#1F1F1F]">{amount.toLocaleString('vi-VN')} {type === "marketplace" ? "đ" : "cr"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#6B7280]">Phí giao dịch</span>
                  <span className="text-green-600 font-bold italic">Miễn phí</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-black text-[#1F1F1F]">Tổng cộng</span>
                  <span className="text-2xl font-black text-red-500">{amount.toLocaleString('vi-VN')} {type === "marketplace" ? "đ" : "cr"}</span>
                </div>
              </div>
            </div>

            {!order ? (
              <button 
                onClick={handleCreateOrder}
                disabled={submitting}
                className="w-full py-4 bg-[#1F1F1F] text-white rounded-2xl font-black text-lg hover:bg-[#D4AF37] hover:text-[#1F1F1F] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Xác nhận & Thanh toán"}
              </button>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Đã tạo vận đơn #{order.id}</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    Vui lòng thực hiện chuyển khoản theo mã QR bên cạnh. Hệ thống sẽ tự động duyệt sau khi nhận được tiền.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment QR */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            {!order ? (
              <div className="text-center space-y-4 py-20">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-sm text-[#6B7280]">Vui lòng xác nhận đơn hàng để nhận mã QR thanh toán</p>
              </div>
            ) : (
              <>
                <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]"></div>
                <h3 className="font-bold text-[#1F1F1F] mb-6 uppercase tracking-widest text-xs">Quét mã để thanh toán</h3>
                
                <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-6 group cursor-pointer lg:hover:scale-105 transition-transform">
                  <img 
                    src={qrUrl} 
                    alt="VietQR Payment" 
                    className="w-64 h-64 object-contain"
                  />
                </div>

                <div className="w-full space-y-4">
                  <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#D4AF37]/20">
                    <p className="text-[10px] font-bold text-[#6B7280] uppercase mb-1">Cú pháp chuyển khoản (Bắt buộc)</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-[#8B5A2B]">PAY {order.id}</span>
                      <button onClick={() => copyToClipboard(`PAY ${order.id}`)} className="text-[#D4AF37] hover:bg-white p-1.5 rounded-lg transition">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-[#6B7280]">Sau khi chuyển khoản, vui lòng đợi 1-3 phút để hệ thống xác nhận.</p>
                    <button 
                      onClick={() => navigate("/purchased")}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37] hover:underline underline-offset-4"
                    >
                      <ShieldCheck className="w-4 h-4" /> Xem lịch sử mua hàng
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
