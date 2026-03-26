import React, { useState } from "react";
import { FileText, Copy, Check, Shield, Key, Zap } from "lucide-react";
import { toast } from "sonner";
import { projectId } from "/utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/server`;

const pythonCode = `import requests

API_KEY = "mk_your_api_key_here"  # Get from Tokens page
BASE_URL = "${API_BASE}"

# Chat Completion
response = requests.post(
    f"{BASE_URL}/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "cc/claude-opus-4-6",  # Use model ID from Marketplace
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "temperature": 0.7,
        "max_tokens": 1000
    }
)

result = response.json()
print(result["choices"][0]["message"]["content"])

# Streaming
response = requests.post(
    f"{BASE_URL}/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "cc/claude-opus-4-6",
        "messages": [{"role": "user", "content": "Tell me a story"}],
        "stream": True
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith('data: ') and decoded != 'data: [DONE]':
            import json
            chunk = json.loads(decoded[6:])
            delta = chunk.get('choices', [{}])[0].get('delta', {}).get('content', '')
            print(delta, end='', flush=True)`;

const nodeCode = `const API_KEY = 'mk_your_api_key_here'; // Get from Tokens page
const BASE_URL = '${API_BASE}';

// Chat Completion
async function chat() {
  const response = await fetch(\`\${BASE_URL}/v1/chat/completions\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'cc/claude-opus-4-6', // Use model ID from Marketplace
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  const data = await response.json();
  console.log(data.choices[0].message.content);
}

// Streaming
async function streamChat() {
  const response = await fetch(\`\${BASE_URL}/v1/chat/completions\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'cc/claude-opus-4-6',
      messages: [{ role: 'user', content: 'Tell me a story' }],
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const parsed = JSON.parse(line.slice(6));
        const delta = parsed.choices?.[0]?.delta?.content || '';
        process.stdout.write(delta);
      }
    }
  }
}

chat();`;

export function ApiDocsPage() {
  const [tab, setTab] = useState<"python" | "nodejs">("python");
  const [copied, setCopied] = useState(false);

  const code = tab === "python" ? pythonCode : nodeCode;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Đã copy code!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">API Documentation</h1>
        <p className="text-[#6B7280]">Hướng dẫn tích hợp AI Models API</p>
      </div>

      {/* Architecture info */}
      <div className="bg-[#FAF7F0] border border-[#D4AF37]/30 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-[#8B5A2B] flex items-center gap-2"><Shield className="w-4 h-4" /> Kiến trúc bảo mật</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
            <p className="font-semibold text-[#1F1F1F] mb-1">1. Tạo API Key</p>
            <p className="text-[#6B7280]">Vào trang <a href="/tokens" className="text-[#D4AF37] hover:underline">API Tokens</a> để tạo key <code className="text-xs font-mono bg-[#FAF7F0] px-1 rounded">mk_*</code></p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
            <p className="font-semibold text-[#1F1F1F] mb-1">2. Mua Model</p>
            <p className="text-[#6B7280]">Mua model tại <a href="/marketplace" className="text-[#D4AF37] hover:underline">Marketplace</a> trước khi sử dụng</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
            <p className="font-semibold text-[#1F1F1F] mb-1">3. Gọi API</p>
            <p className="text-[#6B7280]">Sử dụng key <code className="text-xs font-mono bg-[#FAF7F0] px-1 rounded">mk_*</code> để gọi, server proxy bảo mật</p>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#1F1F1F] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#D4AF37]" /> Endpoints
        </h2>
        <div className="space-y-3">
          {[
            { method: "POST", path: "/v1/chat/completions", desc: "Chat completion (hỗ trợ streaming)" },
            { method: "POST", path: "/v1/embeddings", desc: "Tạo embeddings từ text" },
            { method: "GET", path: "/models", desc: "Danh sách models khả dụng" },
          ].map(e => (
            <div key={e.path} className="flex items-center gap-3 p-3 bg-[#FAF7F0] rounded-lg">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.method === "POST" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{e.method}</span>
              <code className="text-sm font-mono text-[#1F1F1F]">{API_BASE}{e.path}</code>
              <span className="text-sm text-[#6B7280] ml-auto hidden sm:block">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Code examples */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4">
          <div className="flex">
            <button onClick={() => setTab("python")} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${tab === "python" ? "border-[#D4AF37] text-[#D4AF37]" : "border-transparent text-[#6B7280]"}`}>Python</button>
            <button onClick={() => setTab("nodejs")} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${tab === "nodejs" ? "border-[#D4AF37] text-[#D4AF37]" : "border-transparent text-[#6B7280]"}`}>Node.js</button>
          </div>
          <button onClick={copy} className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#D4AF37]">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="bg-[#1F1F1F] p-4 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono whitespace-pre">{code}</pre>
        </div>
      </div>

      {/* Auth info */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#1F1F1F] mb-3 flex items-center gap-2"><Key className="w-5 h-5 text-[#D4AF37]" /> Authentication</h2>
        <p className="text-sm text-[#6B7280] mb-3">Sử dụng API key <code className="bg-[#FAF7F0] px-1.5 py-0.5 rounded font-mono text-[#8B5A2B] text-xs">mk_*</code> trong header Authorization:</p>
        <div className="bg-[#FAF7F0] p-3 rounded-lg">
          <code className="text-sm font-mono text-[#8B5A2B]">Authorization: Bearer mk_your_api_key_here</code>
        </div>
        <p className="text-sm text-[#6B7280] mt-3">Tạo API key tại trang <a href="/tokens" className="text-[#D4AF37] hover:underline">API Tokens</a>. Mỗi request sẽ trừ credit theo pricing của model.</p>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <Zap className="w-4 h-4 inline mr-1" />
          <strong>Lưu ý:</strong> Bạn cần mua model trước khi có thể gọi API. Model chưa mua sẽ trả về lỗi 403.
        </div>
      </div>
    </div>
  );
}
