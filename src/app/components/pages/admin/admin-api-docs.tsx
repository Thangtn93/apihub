import React, { useState } from "react";
import { BookOpen, Save } from "lucide-react";
import { toast } from "sonner";

export function AdminApiDocsPage() {
  const [endpoints, setEndpoints] = useState([
    { method: "POST", path: "/v1/chat/completions", desc: "Chat completion với AI model", active: true },
    { method: "POST", path: "/v1/embeddings", desc: "Tạo embeddings từ text", active: true },
    { method: "POST", path: "/v1/ocr", desc: "Nhận dạng text từ ảnh", active: true },
    { method: "POST", path: "/v1/rag/query", desc: "RAG query với context", active: true },
    { method: "GET", path: "/v1/models", desc: "Danh sách models khả dụng", active: true },
    { method: "GET", path: "/v1/usage", desc: "Thống kê usage", active: true },
  ]);

  const toggle = (i: number) => {
    const next = [...endpoints];
    next[i].active = !next[i].active;
    setEndpoints(next);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Quản lý API Docs</h1>
        <p className="text-[#6B7280]">Quản lý nội dung tài liệu API</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h3 className="font-semibold text-[#1F1F1F] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Endpoints
          </h3>
          <button onClick={() => toast.success("Đã lưu cấu hình!")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg text-sm font-semibold hover:bg-[#B08D57]">
            <Save className="w-3 h-3" /> Lưu
          </button>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {endpoints.map((e, i) => (
            <div key={e.path} className="flex items-center gap-4 px-4 py-3">
              <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${e.method === "POST" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{e.method}</span>
              <code className="text-sm font-mono text-[#1F1F1F] shrink-0">{e.path}</code>
              <span className="text-sm text-[#6B7280] flex-1 hidden sm:block">{e.desc}</span>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" checked={e.active} onChange={() => toggle(i)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-[#D4AF37] rounded-full peer-focus:ring-2 peer-focus:ring-[#D4AF37] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-semibold text-[#1F1F1F] mb-3">Tùy chỉnh nội dung API Docs</h3>
        <textarea rows={6} defaultValue="Chào mừng bạn đến với AI Market API. Sử dụng API key để xác thực và truy cập các models AI hàng đầu."
          className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg bg-[#FAF7F0] focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm resize-none" />
        <button onClick={() => toast.success("Đã cập nhật nội dung!")}
          className="mt-3 px-4 py-2 bg-[#D4AF37] text-[#1F1F1F] rounded-lg text-sm font-semibold hover:bg-[#B08D57]">
          Cập nhật
        </button>
      </div>
    </div>
  );
}
