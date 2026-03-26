# TỔNG QUAN DỰ ÁN — AI Market Marketplace

## 🏗️ KIẾN TRÚC TỔNG THỂ

```
Frontend (React + Vite + Tailwind CSS v4)
    └─ /src/app/App.tsx  →  AuthProvider + RouterProvider + Toaster (Sonner)
         └─ /src/app/routes.tsx  →  createBrowserRouter (react-router)
              └─ /src/app/components/layout.tsx  →  Sidebar + Header + <Outlet>

Backend (Supabase Edge Function - Deno)
    └─ /supabase/functions/server/index.tsx  →  Hono app
         ├─ KV Store (kv_store.tsx)  →  PostgreSQL-backed key-value
         ├─ Supabase Auth (service role)
         └─ 9Router Proxy  →  https://thang.apiaihub.shop/v1
```

**API Base URL:** `https://{projectId}.supabase.co/functions/v1/make-server-67c97e37`

---

## 🎨 DESIGN SYSTEM

| Token | Giá trị | Vai trò |
|-------|---------|---------|
| `#D4AF37` | Vàng kim | Màu chính, accent, active state |
| `#1F1F1F` | Đen/nâu tối | Background sidebar, text heading |
| `#8B5A2B` | Nâu đất | Accent phụ |
| `#B08D57` | Vàng nhạt | Hover states |
| `#FAF7F0` | Trắng ngà | Background chính |
| `#6B7280` | Xám | Text phụ, placeholder |
| `#E5E7EB` | Xám nhạt | Border |

**UI Library:** Shadcn/ui (`/src/app/components/ui/`) — accordion, alert, avatar, badge, button, calendar, card, chart, dialog, dropdown, form, input, select, sheet, sidebar, skeleton, table, tabs, v.v.

---

## 🔐 HỆ THỐNG AUTH

Hai màn hình đăng nhập riêng biệt:
- `/login` → **LoginPage** — người dùng thông thường, có Google OAuth
- `/login/admin` → **AdminLoginPage** — chỉ admin, có nút "Khởi tạo tài khoản Test"

**Tài khoản test** (qua `/dev/reset-users`):

| Email | Password | Role | Credits |
|-------|----------|------|---------|
| admin@example.com | password123 | admin | 99,999 |
| user1@example.com | password123 | user | 100 |
| user2@example.com | password123 | user | 50 |

**Auth Flow** (`auth-context.tsx`):
```
signIn(email, password)
  → supabase.auth.signInWithPassword()
  → api(token).get("/user/profile")  [tầng 1: KV store]
  → nếu fail: user_metadata.role     [tầng 2: Supabase JWT - fallback]
  → nếu fail: role = "user"          [tầng 3: safe default]
  → return { session, user, profile }
```

**Route Guard** (`layout.tsx`):
- `!user` → redirect `/login`
- `profile loaded + isAdminRoute + !isAdmin` → redirect `/dashboard`
- `loading` → spinner toàn màn hình

> [!NOTE]
> Email `ngocthang1493@gmail.com` được tự động nâng lên admin khi login (hard-coded trong `fetchProfile` và `signIn`).

---

## 📡 BACKEND API ENDPOINTS

### 🌍 Public Routes

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/health` | Health check |
| POST | `/dev/reset-users` | Xóa toàn bộ user, tạo lại 3 test accounts |
| POST | `/auth/signup` | Đăng ký tài khoản mới |
| POST | `/admin/bootstrap` | Nâng role user thành admin (public!) |
| GET | `/models` | Danh sách models |
| GET | `/providers` | Danh sách providers |

### 🔑 User Routes (`authMiddleware`)

| Method | Path | Mô tả |
|--------|------|-------|
| GET/PUT | `/user/profile` | Xem/cập nhật profile |
| POST/GET | `/purchases` | Mua model / xem lịch sử mua |
| POST/GET | `/topups` | Nạp credits / lịch sử nạp |
| POST/GET | `/tokens` | Tạo API token |
| DELETE | `/tokens/:id` | Xóa token |
| POST/GET | `/usage-logs` | Ghi / xem log usage |

### 🛡️ Admin Routes (`adminMiddleware`)

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/users` | Danh sách users |
| PUT | `/admin/users/:id` | Cập nhật user |
| POST | `/admin/set-role` | Đổi role user |
| POST/PUT | `/models` | Tạo/sửa model |
| POST | `/models/delete` | Xóa model |
| POST/DELETE | `/providers` | Quản lý providers |
| POST | `/sync-models` | Sync models từ 9Router |
| POST | `/admin/clear-data` | Xóa toàn bộ dữ liệu (trừ users) |
| POST | `/admin/clear-models` | Xóa toàn bộ models |
| GET | `/admin/router-config` | Xem config 9Router |
| POST | `/admin/test-supabase-query` | Debug KV store |

### 🔄 Proxy Routes (9Router)

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/v1/chat/completions` | Chat AI có kiểm tra purchase + trừ credits |
| POST | `/v1/:endpoint` | Forward các endpoint khác |

**Auth proxy:** Hỗ trợ cả Supabase JWT (`Bearer eyJ...`) và custom API key (`mk_...`)

---

## 🗄️ KV STORE DATA MODEL

| Key Pattern | Value | Mô tả |
|-------------|-------|-------|
| `user:{id}` | `{id, email, name, role, credits, createdAt}` | Profile người dùng |
| `model:{id}` | `{id, name, provider, category, price, inputPrice, outputPrice, contextWindow, status, routerModelId, ...}` | AI Model |
| `provider:{id}` | `{id, name, ...}` | Provider |
| `purchase:{id}` | `{id, userId, modelId, price, createdAt}` | Lịch sử mua |
| `topup:{id}` | `{id, userId, amount, createdAt}` | Lịch sử nạp tiền |
| `token:{id}` | `{id, userId, name, key, createdAt, lastUsed, usageCount}` | API Token |
| `usage:{id}` | `{id, userId, modelId, type, cost, createdAt}` | Usage log |

---

## 📄 ROUTING TABLE (Frontend)

```
/                     → redirect /dashboard
/login                → LoginPage
/login/admin          → AdminLoginPage
/signup               → SignupPage
/register             → redirect /signup
/forgot-password      → ForgotPasswordPage
/dashboard            → DashboardPage
/marketplace          → MarketplacePage
/marketplace/:id      → ModelDetailPage
/purchased            → PurchasedPage
/api-docs             → ApiDocsPage
/tokens               → TokensPage
/usage                → UsagePage
/wallet               → WalletPage
/profile              → ProfilePage
/admin                → AdminDashboardPage
/admin/users          → AdminUsersPage
/admin/providers      → AdminProvidersPage
/admin/models         → AdminModelsPage
/admin/purchases      → AdminPurchasesPage
/admin/topups         → AdminTopupsPage
/admin/token-logs     → AdminTokenLogsPage
/admin/api-docs       → AdminApiDocsPage
/admin/test-supabase  → AdminTestSupabasePage
/admin/unit-test      → AdminUnitTestPage
*                     → redirect /dashboard
```

---

## 🧩 TÍNH NĂNG THEO MODULE

| Module | Tính năng |
|--------|-----------|
| Dashboard | Stats (credits, purchases, tokens, API calls 7d), BarChart usage, Recent Activity |
| Marketplace | Grid models, filter by category (Chat/OCR/RAG/Embedding), filter by provider, search |
| Model Detail | Xem chi tiết, mua model bằng credits |
| Purchased | Danh sách models đã mua |
| Wallet | Số dư, nạp credits (preset + custom), lịch sử giao dịch gộp topup + purchase |
| API Tokens | Tạo/xóa/copy/toggle visibility API keys (format `mk_...`) |
| Usage Logs | Xem log usage theo user |
| API Docs | Hướng dẫn dùng API |
| Profile | Xem/cập nhật thông tin cá nhân |
| Admin Dashboard | Stats toàn hệ thống, AreaChart revenue 7d, nút Clear All Data |
| Admin Users | Danh sách users, đổi role, chỉnh credits |
| Admin Models | CRUD models, nút Sync từ 9Router |
| Admin Providers | CRUD providers |
| Admin Purchases/Topups | Xem lịch sử toàn hệ thống |
| Admin Token Logs | Xem tất cả API tokens |
| Admin API Docs | Quản lý tài liệu API |
| Admin Test Supabase | Debug KV store (list/count/delete theo prefix) |
| Admin Unit Test | Chạy test tự động các endpoint |

---

## ⚙️ TECH STACK

| Layer | Công nghệ |
|-------|-----------|
| Framework | React 18 + Vite |
| Routing | react-router (Data Mode) |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn/ui |
| Icons | lucide-react |
| Charts | recharts (BarChart, AreaChart) |
| Notifications | sonner (toast) |
| Auth | Supabase Auth (email + Google OAuth) |
| Backend | Supabase Edge Functions + Hono |
| Database | Supabase KV Store (PostgreSQL-backed) |
| AI Proxy | 9Router (`https://thang.apiaihub.shop/v1`) |

---

## 🐛 BUG ĐÃ FIX GẦN ĐÂY

1. **Admin login false-negative** — `result.profile = null` khi KV fetch fail → chặn nhầm admin hợp lệ
   - **Fix:** `signIn()` thêm tầng fallback từ `user_metadata` (luôn có trong JWT, không phụ thuộc network call thứ 2)

2. **AuthContext crash** khi dùng ngoài Provider
   - **Fix:** Dùng `defaultAuthContext` thay vì `null`
