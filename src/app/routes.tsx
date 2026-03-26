import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./components/pages/login";
import { AdminLoginPage } from "./components/pages/admin-login";
import { SignupPage } from "./components/pages/signup";
import { ForgotPasswordPage } from "./components/pages/forgot-password";
import { Layout } from "./components/layout";
import { DashboardPage } from "./components/pages/dashboard";
import { MarketplacePage } from "./components/pages/marketplace";
import { ModelDetailPage } from "./components/pages/model-detail";
import { PurchasedPage } from "./components/pages/purchased";
import { ApiDocsPage } from "./components/pages/api-docs";
import { TokensPage } from "./components/pages/tokens";
import { UsagePage } from "./components/pages/usage";
import { WalletPage } from "./components/pages/wallet";
import { ProfilePage } from "./components/pages/profile";
import { AdminDashboardPage } from "./components/pages/admin/admin-dashboard";
import { AdminUsersPage } from "./components/pages/admin/admin-users";
import { AdminProvidersPage } from "./components/pages/admin/admin-providers";
import { AdminModelsPage } from "./components/pages/admin/admin-models";
import { AdminPurchasesPage } from "./components/pages/admin/admin-purchases";
import { AdminTopupsPage } from "./components/pages/admin/admin-topups";
import { AdminTokenLogsPage } from "./components/pages/admin/admin-token-logs";
import { AdminApiDocsPage } from "./components/pages/admin/admin-api-docs";
import { AdminTestSupabasePage } from "./components/pages/admin/admin-test-supabase";
import { AdminUnitTestPage } from "./components/pages/admin/admin-unit-test";

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0]"><div className="text-center"><h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Something went wrong</h1><a href="/" className="text-[#D4AF37] underline">Go Home</a></div></div>,
    children: [
      { path: "login", Component: LoginPage },
      { path: "login/admin", Component: AdminLoginPage },
      { path: "signup", Component: SignupPage },
      { path: "register", element: <Navigate to="/signup" replace /> },
      { path: "forgot-password", Component: ForgotPasswordPage },
      {
        path: "",
        Component: Layout,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", Component: DashboardPage },
          { path: "marketplace", Component: MarketplacePage },
          { path: "marketplace/:id", Component: ModelDetailPage },
          { path: "purchased", Component: PurchasedPage },
          { path: "api-docs", Component: ApiDocsPage },
          { path: "tokens", Component: TokensPage },
          { path: "usage", Component: UsagePage },
          { path: "wallet", Component: WalletPage },
          { path: "profile", Component: ProfilePage },
          { path: "admin", Component: AdminDashboardPage },
          { path: "admin/users", Component: AdminUsersPage },
          { path: "admin/providers", Component: AdminProvidersPage },
          { path: "admin/models", Component: AdminModelsPage },
          { path: "admin/purchases", Component: AdminPurchasesPage },
          { path: "admin/topups", Component: AdminTopupsPage },
          { path: "admin/token-logs", Component: AdminTokenLogsPage },
          { path: "admin/api-docs", Component: AdminApiDocsPage },
          { path: "admin/test-supabase", Component: AdminTestSupabasePage },
          { path: "admin/unit-test", Component: AdminUnitTestPage },
        ],
      },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);