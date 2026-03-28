import React, { useEffect, useState } from "react";
import { api, useAuth } from "../../auth-context";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Ban
} from "lucide-react";
import { toast } from "sonner";

export function AdminOrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api(accessToken).get("/admin/orders");
      if (Array.isArray(data)) {
        setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err: any) {
      toast.error("Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [accessToken]);

  const handleApprove = async (id: string) => {
    if (!confirm("Xác nhận đã nhận tiền và phê duyệt đơn hàng này?")) return;
    try {
      const res = await api(accessToken).post(`/admin/orders/${id}/approve`, {});
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Đã phê duyệt đơn hàng!");
        fetchOrders(); // Refresh
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    try {
      const res = await api(accessToken).post(`/admin/orders/${id}/cancel`, {});
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Đã hủy đơn hàng!");
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || 
                          o.userEmail?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F1F1F] tracking-tight">QUẢN LÝ ĐƠN HÀNG</h1>
          <p className="text-sm text-[#6B7280]">Phê duyệt các giao dịch thanh toán qua QR</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-2.5 bg-white border border-[#E5E7EB] rounded-xl hover:bg-gray-50 transition shadow-sm text-[#6B7280]"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo ID hoặc Email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#D4AF37]/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === s 
                  ? 'bg-[#1F1F1F] text-white shadow-lg shadow-black/10' 
                  : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ duyệt' : s === 'completed' ? 'Hoàn tất' : 'Đã hủy'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[#E5E7EB]">
              <th className="px-6 py-4 font-bold text-[#1F1F1F]">Đơn hàng</th>
              <th className="px-6 py-4 font-bold text-[#1F1F1F]">Khách hàng</th>
              <th className="px-6 py-4 font-bold text-[#1F1F1F]">Sản phẩm</th>
              <th className="px-6 py-4 font-bold text-[#1F1F1F]">Số tiền</th>
              <th className="px-6 py-4 font-bold text-[#1F1F1F]">Trạng thái</th>
              <th className="px-6 py-4 font-bold text-[#1F1F1F] text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-[#6B7280]">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-[#6B7280]">
                  Không tìm thấy đơn hàng nào.
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-[#1F1F1F]">#{order.id}</div>
                    <div className="text-[10px] text-[#6B7280] mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#1F1F1F]">{order.userEmail}</div>
                    <div className="text-[10px] text-[#6B7280] font-mono">{order.userId.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        order.productType === 'account' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.productType}
                      </span>
                      <span className="text-[#1F1F1F] font-medium truncate max-w-[120px]">{order.productId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-[#1F1F1F]">
                    {order.amount.toLocaleString('vi-VN')} 
                    <span className="text-[10px] ml-1 opacity-50">{order.productType === 'account' ? 'đ' : 'cr'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {order.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                        <Clock className="w-3 h-3" /> CHỜ DUYỆT
                      </span>
                    ) : order.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        <CheckCircle className="w-3 h-3" /> HOÀN TẤT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                        <XCircle className="w-3 h-3" /> ĐÃ HỦY
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleCancel(order.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Hủy đơn"
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleApprove(order.id)}
                          className="px-3 py-1.5 bg-[#1F1F1F] text-white rounded-lg text-xs font-bold hover:bg-green-600 transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" /> DUYỆT
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
