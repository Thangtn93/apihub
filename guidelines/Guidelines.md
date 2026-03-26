# Guidelines — AI Market Marketplace

## 🏗️ Kiến trúc dự án

- **Frontend**: React 18 + Vite + Tailwind CSS v4, chạy tại `http://localhost:5173/`
- **Backend**: Supabase Edge Function (Deno + Hono), đã deploy trên Supabase Cloud
- **Database**: Supabase PostgreSQL (KV Store — bảng `kv_store_67c97e37`)
- **AI Proxy**: 9Router tại `https://thang.apiaihub.shop/v1`

## 🔑 Thông tin Supabase Project

| Thông tin | Giá trị |
|-----------|---------|
| Project ID | `xubuquskwfkseafjjxjy` |
| Project URL | `https://xubuquskwfkseafjjxjy.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1YnVxdXNrd2Zrc2VhZmpqeGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjIyNDcsImV4cCI6MjA4OTU5ODI0N30.V-oiHsuV8sWoeU8x_tof5EZ5ey9G4-Bu8yClBiUNA-U` |
| Edge Function Name | `make-server-67c97e37` |
| API Base URL | `https://xubuquskwfkseafjjxjy.supabase.co/functions/v1/make-server-67c97e37` |
| Dashboard Functions | https://supabase.com/dashboard/project/xubuquskwfkseafjjxjy/functions |
| Dashboard DB | https://supabase.com/dashboard/project/xubuquskwfkseafjjxjy/database/tables |

## 🚀 Cách deploy Edge Function

```bash
# 1. Cài Supabase CLI (nếu chưa có)
brew install supabase/tap/supabase

# 2. Login (dùng token của chủ project)
supabase login --token <ACCESS_TOKEN>

# 3. Link project
supabase link --project-ref xubuquskwfkseafjjxjy

# 4. Copy source vào đúng folder CLI yêu cầu
mkdir -p supabase/functions/make-server-67c97e37
cp supabase/functions/server/index.tsx supabase/functions/make-server-67c97e37/index.ts
cp supabase/functions/server/kv_store.tsx supabase/functions/make-server-67c97e37/kv_store.tsx

# 5. Deploy
supabase functions deploy make-server-67c97e37 --no-verify-jwt
```

> **Lưu ý quan trọng:** Supabase CLI yêu cầu folder `supabase/functions/<function-name>/index.ts` — tên folder phải khớp với tên function. Source thực tế nằm ở `supabase/functions/server/`, cần copy sang trước khi deploy.

## 🌱 Khởi tạo tài khoản test

```bash
curl -X POST "https://xubuquskwfkseafjjxjy.supabase.co/functions/v1/make-server-67c97e37/dev/reset-users" \
  -H "Authorization: Bearer <ANON_KEY>"
```

Tạo lại 3 tài khoản:
| Email | Password | Role | Credits |
|-------|----------|------|---------|
| admin@example.com | password123 | admin | 99,999 |
| user1@example.com | password123 | user | 100 |
| user2@example.com | password123 | user | 50 |

## 🖥️ Cách chạy Frontend local

```bash
npm install
npm run dev
# → http://localhost:5173/
```

## 📁 Cấu trúc source chính

```
src/app/
  App.tsx                  # Root: AuthProvider + RouterProvider
  routes.tsx               # React Router routes
  components/
    auth-context.tsx       # Auth state + signIn/signOut
    layout.tsx             # Sidebar + Header + Outlet (route guard)
    pages/                 # User pages
    pages/admin/           # Admin pages
    ui/                    # Shadcn/ui components

supabase/functions/server/
  index.tsx                # Hono app — tất cả API endpoints
  kv_store.tsx             # KV Store interface (PostgreSQL-backed)

utils/supabase/info.tsx    # projectId + publicAnonKey
```

## 🎨 Design System

| Token | Giá trị | Vai trò |
|-------|---------|---------|
| `#D4AF37` | Vàng kim | Màu chính, accent, active |
| `#1F1F1F` | Đen/nâu tối | Background sidebar, heading |
| `#8B5A2B` | Nâu đất | Accent phụ |
| `#FAF7F0` | Trắng ngà | Background chính |

## ⚙️ Biến môi trường Edge Function

Không cần cấu hình thủ công — Supabase tự inject khi chạy trên cloud:
- `SUPABASE_URL` — URL của project
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (full quyền DB)
- `ROUTER_API_BASE` — Base URL của 9Router (default: `https://thang.apiaihub.shop`)
- `ROUTER_API_KEY` — API key để gọi 9Router (set qua Supabase Dashboard → Settings → Edge Functions → Secrets)

## 🔗 GitHub Repository

```
https://github.com/Thangtn93/apihub.git
```
