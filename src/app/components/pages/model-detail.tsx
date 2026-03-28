import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAuth, api } from "../auth-context";
import { ArrowLeft, ShoppingCart, Cpu, Zap, Check, Send, Loader2, Copy, Terminal, ShieldCheck, ImageIcon } from "lucide-react";
import { ShopLayout } from "../shop-layout";
import { toast } from "sonner";
import { projectId } from "/utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

export function ModelDetailPage() {
  const { id } = useParams();
  const { accessToken, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);

  // Playground state
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Tải thông tin sản phẩm (Model hoặc Account)
    Promise.all([
      api().get("/models"),
      api().get("/accounts")
    ]).then(([models, accounts]) => {
      let found = null;
      if (Array.isArray(models)) found = models.find((m: any) => m.id === id);
      if (!found && Array.isArray(accounts)) found = accounts.find((a: any) => a.id === id);
      setModel(found);
    });

    if (accessToken) {
      api(accessToken).get("/purchases").then(d => {
        if (Array.isArray(d)) setPurchased(d.some((p: any) => p.modelId === id || p.accountId === id));
      });
      api(accessToken).get("/tokens").then(d => {
        if (Array.isArray(d)) setTokens(d);
      });
    }
  }, [id, accessToken]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const handlePurchase = async () => {
    if (!accessToken) { navigate("/login"); return; }
    if (!model) return;
    const type = model.salePrice !== undefined ? "marketplace" : "tokens";
    navigate(`/checkout/${type}/${model.id}`);
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);
    setStreamText("");

    try {
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model.id,
          messages: newMessages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error(err.error || `Error ${res.status}`);
        setChatLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  setStreamText(fullText);
                }
              } catch {}
            }
          }
        }
      }

      if (!fullText) {
        try {
          const data = await res.json();
          fullText = data.choices?.[0]?.message?.content || "No response";
        } catch {}
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullText || streamText || "No response" }]);
      setStreamText("");
      refreshProfile();
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  if (!model) return (
    <ShopLayout sideContent={null}>
      <div className="flex items-center justify-center py-20 text-[#6B7280]">Đang tải...</div>
    </ShopLayout>
  );

  const apiEndpoint = `${API_BASE}/v1/chat/completions`;
  const pythonCode = `import requests\n\nresponse = requests.post(\n    "${apiEndpoint}",\n    headers={\n        "Authorization": "Bearer YOUR_MK_API_KEY",\n        "Content-Type": "application/json"\n    },\n    json={\n        "model": "${model.id}",\n        "messages": [\n            {"role": "user", "content": "Hello!"}\n        ],\n        "stream": False\n    }\n)\nprint(response.json()["choices"][0]["message"]["content"])`;
  const nodeCode = `const res = await fetch("${apiEndpoint}", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_MK_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    model: "${model.id}",\n    messages: [\n      { role: "user", content: "Hello!" }\n    ],\n    stream: false\n  })\n});\nconst data = await res.json();\nconsole.log(data.choices[0].message.content);`;
  const curlCode = `curl -X POST "${apiEndpoint}" \\\n  -H "Authorization: Bearer YOUR_MK_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "${model.id}",\n    "messages": [{"role": "user", "content": "Hello!"}]\n  }'`;

  return (
    <ShopLayout sideContent={null}>
      <div className="max-w-5xl mx-auto space-y-8 py-4 px-4 md:px-0">
        <Link to={model.salePrice !== undefined ? "/marketplace" : "/models"} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#D4AF37] transition">
          <ArrowLeft className="w-4 h-4" /> Quay lại {model.salePrice !== undefined ? "Marketplace" : "API Models"}
        </Link>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-10 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shrink-0 shadow-inner ${
              model.salePrice !== undefined ? 'bg-[#FAF7F0]' : 'bg-gradient-to-br from-[#D4AF37] to-[#8B5A2B]'
            }`}>
              {model.thumbnail ? (
                <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover rounded-3xl" />
              ) : model.salePrice !== undefined ? (
                <ImageIcon className="w-12 h-12 text-[#D4AF37]" />
              ) : (
                <Cpu className="w-12 h-12 text-white" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                  {model.provider}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-[#1F1F1F]">
                  {model.category}
                </span>
                {model.salePrice !== undefined && (
                   <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                    TÀI KHOẢN Premium
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-black text-[#1F1F1F] tracking-tight mb-2">
                {model.displayName || model.name}
              </h1>
              <p className="text-sm font-mono text-[#6B7280] bg-gray-50 px-2 py-1 rounded w-fit mb-4 border border-gray-100">
                ID: {model.id}
              </p>
              <p className="text-[#6B7280] leading-relaxed text-lg max-w-2xl">
                {model.description || `Sản phẩm chất lượng cao từ đối tác ${model.provider}. Hỗ trợ đầy đủ các tính năng nâng cao và ổn định.`}
              </p>
            </div>

            <div className="bg-[#FAF7F0] p-6 rounded-2xl border border-[#D4AF37]/20 flex flex-col items-center justify-center min-w-[220px] gap-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-1">Giá ưu đãi</p>
                <p className="text-4xl font-black text-red-500 tracking-tighter">
                  {(model.salePrice || model.price || 0).toLocaleString('vi-VN')}
                  <span className="text-sm ml-1 italic">{model.salePrice !== undefined ? "đ" : "cr"}</span>
                </p>
                {model.originalPrice > model.salePrice && (
                  <p className="text-xs text-[#6B7280] line-through decoration-red-400 mt-1">
                    {model.originalPrice.toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>
              
              {purchased ? (
                <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20">
                  <ShieldCheck className="w-5 h-5" /> ĐÃ SỞ HỮU
                </div>
              ) : (
                <button onClick={handlePurchase} disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-4 bg-[#1F1F1F] text-white rounded-xl font-black hover:bg-[#D4AF37] hover:text-[#1F1F1F] transition-all disabled:opacity-50 shadow-xl shadow-black/10">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                  Mua Ngay
                </button>
              )}
            </div>
          </div>
        </div>

        {model.salePrice === undefined && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Giá Input", value: `$${model.inputPrice}/1K tokens` },
                { label: "Giá Output", value: `$${model.outputPrice}/1K tokens` },
                { label: "Context Window", value: model.contextWindow || "Standard" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center shadow-sm hover:border-[#D4AF37]/30 transition-colors">
                  <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">{s.label}</p>
                  <p className="text-2xl font-black text-[#1F1F1F]">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {purchased && model.category === "Chat" && (
                  <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2 bg-gray-50/50">
                      <Terminal className="w-5 h-5 text-[#D4AF37]" />
                      <h3 className="text-lg font-semibold text-[#1F1F1F]">Playground (Bản thử nghiệm)</h3>
                      <span className="ml-auto text-xs text-[#6B7280] font-medium">Số dư: {profile?.credits?.toFixed(3) || 0} cr</span>
                    </div>

                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-[#FAF7F0]/30">
                      {messages.length === 0 && !chatLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-[#6B7280] gap-3">
                          <Send className="w-8 h-8 opacity-20" />
                          <p className="text-sm">Bắt đầu trò chuyện để kiểm tra hiệu năng Model</p>
                        </div>
                      )}
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-[#D4AF37] text-[#1F1F1F] font-medium shadow-sm"
                              : "bg-white border border-[#E5E7EB] text-[#1F1F1F] shadow-sm"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && streamText && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl px-5 py-3 text-sm bg-white border border-[#E5E7EB] text-[#1F1F1F] whitespace-pre-wrap shadow-sm">
                            {streamText}
                            <span className="animate-pulse inline-block w-1.5 h-4 bg-[#D4AF37] ml-1 align-middle"></span>
                          </div>
                        </div>
                      )}
                      {chatLoading && !streamText && (
                        <div className="flex justify-start">
                          <div className="rounded-2xl px-5 py-3 bg-white border border-[#E5E7EB] shadow-sm">
                            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-[#E5E7EB] bg-white flex gap-3">
                      <textarea
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder="Nhập nội dung tin nhắn..."
                        className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#D4AF37] outline-none resize-none transition-all"
                        disabled={chatLoading}
                      />
                      <button onClick={sendMessage} disabled={chatLoading || !input.trim()}
                        className="px-5 bg-[#D4AF37] text-[#1F1F1F] rounded-xl font-bold hover:bg-[#B08D57] transition-all disabled:opacity-50 flex items-center justify-center">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-[#1F1F1F] flex items-center gap-2 mb-6">
                    <Zap className="w-6 h-6 text-[#D4AF37]" /> Tích hợp nhanh (Quick Start)
                  </h3>
                  <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                    Sử dụng API key <code className="bg-[#FAF7F0] px-2 py-1 rounded text-xs font-mono text-[#8B5A2B] border border-[#D4AF37]/20 font-bold">mk_...</code> để bắt đầu gửi yêu cầu đến endpoint chuẩn OpenAI.
                    {tokens.length > 0 && <span className="block mt-2 font-medium text-[#1F1F1F]">Bạn đang có {tokens.length} API key hoạt động. <Link to="/tokens" className="text-[#D4AF37] hover:underline underline-offset-4 ml-1">Quản lý khóa của bạn →</Link></span>}
                    {tokens.length === 0 && <span className="block mt-2"><Link to="/tokens" className="text-[#D4AF37] font-bold hover:underline underline-offset-4">Tạo API key ngay để bắt đầu →</Link></span>}
                  </p>

                  <div className="space-y-6">
                    {[
                      { label: "cURL (Dòng lệnh)", code: curlCode, lang: "bash" },
                      { label: "Python SDK", code: pythonCode, lang: "python" },
                      { label: "Node.js / JS", code: nodeCode, lang: "javascript" },
                    ].map(ex => (
                      <div key={ex.label} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black text-[#6B7280] uppercase tracking-widest">{ex.label}</span>
                          <button onClick={() => copyCode(ex.code)} className="text-[11px] font-bold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors">
                            <Copy className="w-3.5 h-3.5" /> COPY CODE
                          </button>
                        </div>
                        <div className="bg-[#1F1F1F] rounded-xl p-5 overflow-x-auto shadow-inner border border-white/5">
                          <pre className="text-[13px] text-green-400 font-mono leading-relaxed">{ex.code}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-[#1F1F1F] rounded-2xl p-6 text-white">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Cam kết dịch vụ
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                      Thời gian phản hồi (Uptime): <span className="text-white ml-1">99.9%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                      Tốc độ xử lý: <span className="text-white ml-1">Tối ưu theo hạ tầng gốc</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                      Hỗ trợ kỹ thuật: <span className="text-white ml-1">24/7 qua Ticket</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
