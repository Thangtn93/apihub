import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth, api } from "../auth-context";
import { ArrowLeft, ShoppingCart, Star, Cpu, Zap, Check, Send, Loader2, Copy, Terminal } from "lucide-react";
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
    api().get("/models").then(d => {
      if (Array.isArray(d)) {
        const m = d.find((m: any) => m.id === id);
        setModel(m);
      }
    });
    if (accessToken) {
      api(accessToken).get("/purchases").then(d => {
        if (Array.isArray(d)) setPurchased(d.some((p: any) => p.modelId === id));
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
    setLoading(true);
    try {
      const res = await api(accessToken).post("/purchases", { modelId: model.id, price: model.price });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Mua model thành công!");
      setPurchased(true);
      refreshProfile();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
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

      // Handle streaming
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
        // Non-streaming fallback
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

  if (!model) return <div className="flex items-center justify-center py-20 text-[#6B7280]">Đang tải...</div>;

  const apiEndpoint = `${API_BASE}/v1/chat/completions`;

  const pythonCode = `import requests

response = requests.post(
    "${apiEndpoint}",
    headers={
        "Authorization": "Bearer YOUR_MK_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "${model.id}",
        "messages": [
            {"role": "user", "content": "Hello!"}
        ],
        "stream": False
    }
)
print(response.json()["choices"][0]["message"]["content"])`;

  const nodeCode = `const res = await fetch("${apiEndpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_MK_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "${model.id}",
    messages: [
      { role: "user", content: "Hello!" }
    ],
    stream: false
  })
});
const data = await res.json();
console.log(data.choices[0].message.content);`;

  const curlCode = `curl -X POST "${apiEndpoint}" \\
  -H "Authorization: Bearer YOUR_MK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.id}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#D4AF37]">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B5A2B] flex items-center justify-center shrink-0">
            <Cpu className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#8B5A2B]/10 text-[#8B5A2B]">{model.provider}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37]">{model.category}</span>
              {model.routerModelId && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">9Router</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#1F1F1F]">{model.displayName || model.name}</h1>
            <p className="text-sm font-mono text-[#6B7280] mt-0.5">{model.id}</p>
            <p className="text-[#6B7280] mt-2">{model.description}</p>
          </div>
          <div className="text-right space-y-3 shrink-0">
            <p className="text-3xl font-bold text-[#D4AF37]">{model.price} <span className="text-sm text-[#6B7280]">credits</span></p>
            {purchased ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
                <Check className="w-4 h-4" /> Đã mua
              </div>
            ) : (
              <button onClick={handlePurchase} disabled={loading}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition disabled:opacity-50">
                <ShoppingCart className="w-4 h-4" /> {loading ? "Đang xử lý..." : "Mua ngay"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Input Price", value: `$${model.inputPrice}/1K tokens` },
          { label: "Output Price", value: `$${model.outputPrice}/1K tokens` },
          { label: "Context Window", value: model.contextWindow || "N/A" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-center">
            <p className="text-sm text-[#6B7280]">{s.label}</p>
            <p className="text-xl font-bold text-[#1F1F1F] mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Playground - only for purchased models */}
      {purchased && model.category === "Chat" && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-lg font-semibold text-[#1F1F1F]">Playground</h3>
            <span className="ml-auto text-xs text-[#6B7280]">Credits: {profile?.credits?.toFixed(3) || 0}</span>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-[#FAF7F0]">
            {messages.length === 0 && !chatLoading && (
              <div className="flex items-center justify-center h-full text-[#6B7280] text-sm">
                Gửi tin nhắn để test model...
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#D4AF37] text-[#1F1F1F]"
                    : "bg-white border border-[#E5E7EB] text-[#1F1F1F]"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && streamText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm bg-white border border-[#E5E7EB] text-[#1F1F1F] whitespace-pre-wrap">
                  {streamText}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
            {chatLoading && !streamText && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-2.5 bg-white border border-[#E5E7EB]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-[#E5E7EB] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#D4AF37] outline-none"
              disabled={chatLoading}
            />
            <button onClick={sendMessage} disabled={chatLoading || !input.trim()}
              className="px-4 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Code Examples */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="text-lg font-semibold text-[#1F1F1F] flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#D4AF37]" /> Quick Start
        </h3>
        <p className="text-sm text-[#6B7280] mb-4">
          Sử dụng API key <code className="bg-[#FAF7F0] px-1.5 py-0.5 rounded text-xs font-mono text-[#8B5A2B]">mk_*</code> của bạn.
          {tokens.length > 0 && <> Bạn có {tokens.length} API key. <a href="/tokens" className="text-[#D4AF37] hover:underline">Quản lý</a></>}
          {tokens.length === 0 && <> <a href="/tokens" className="text-[#D4AF37] hover:underline">Tạo API key</a></>}
        </p>

        {[
          { label: "cURL", code: curlCode },
          { label: "Python", code: pythonCode },
          { label: "Node.js", code: nodeCode },
        ].map(ex => (
          <div key={ex.label} className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[#6B7280]">{ex.label}</span>
              <button onClick={() => copyCode(ex.code)} className="text-xs text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
            </div>
            <div className="bg-[#1F1F1F] rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre">{ex.code}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
