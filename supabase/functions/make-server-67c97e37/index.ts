import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const PREFIX = "/make-server-67c97e37";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// 9Router config
const ROUTER_API_BASE = Deno.env.get("ROUTER_API_BASE") || "https://thang.apiaihub.shop";
const ROUTER_API_KEY = Deno.env.get("ROUTER_API_KEY") || "";

// Helper to get user from token
async function getUserFromToken(authHeader: string | undefined) {
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Middlewares
const authMiddleware = async (c: any, next: any) => {
  const user = await getUserFromToken(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  c.set('user', user);
  return await next();
};

const adminMiddleware = async (c: any, next: any) => {
  const user = await getUserFromToken(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const profileStr = await kv.get(`user:${user.id}`);
  if (!profileStr || JSON.parse(profileStr).role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  c.set('user', user);
  return await next();
};


// =============================================
// PUBLIC ROUTES
// =============================================

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

app.post(`${PREFIX}/dev/reset-users`, async (c) => {
  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    for (const u of users) {
      await supabase.auth.admin.deleteUser(u.id);
      await kv.del(`user:${u.id}`);
    }
    
    const { data: adminData } = await supabase.auth.admin.createUser({
      email: "admin@example.com", password: "password123", email_confirm: true, user_metadata: { name: "System Admin", role: "admin" }
    });
    if (adminData.user) {
      await kv.set(`user:${adminData.user.id}`, JSON.stringify({
        id: adminData.user.id, email: "admin@example.com", name: "System Admin", role: "admin", credits: 99999, createdAt: new Date().toISOString()
      }));
    }

    const { data: u1Data } = await supabase.auth.admin.createUser({
      email: "user1@example.com", password: "password123", email_confirm: true, user_metadata: { name: "Regular User 1", role: "user" }
    });
    if (u1Data.user) {
      await kv.set(`user:${u1Data.user.id}`, JSON.stringify({
        id: u1Data.user.id, email: "user1@example.com", name: "Regular User 1", role: "user", credits: 100, createdAt: new Date().toISOString()
      }));
    }

    const { data: u2Data } = await supabase.auth.admin.createUser({
      email: "user2@example.com", password: "password123", email_confirm: true, user_metadata: { name: "Regular User 2", role: "user" }
    });
    if (u2Data.user) {
      await kv.set(`user:${u2Data.user.id}`, JSON.stringify({
        id: u2Data.user.id, email: "user2@example.com", name: "Regular User 2", role: "user", credits: 50, createdAt: new Date().toISOString()
      }));
    }

    return c.json({ success: true, message: "Reset users completed" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/auth/signup`, async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, user_metadata: { name, role: "user" }, email_confirm: true,
    });
    if (error) return c.json({ error: `Signup error: ${error.message}` }, 400);
    const existingUsers = await kv.getByPrefix("user:");
    const role = existingUsers.length === 0 ? "admin" : "user";
    await kv.set(`user:${data.user.id}`, JSON.stringify({
      id: data.user.id, email, name, role, credits: role === "admin" ? 99999 : 0, createdAt: new Date().toISOString(),
    }));
    return c.json({ user: data.user, role });
  } catch (e) {
    return c.json({ error: `Signup failed: ${e}` }, 500);
  }
});

app.post(`${PREFIX}/admin/bootstrap`, async (c) => {
  try {
    const { email } = await c.req.json();
    const allUsers = await kv.getByPrefix("user:");
    for (const raw of allUsers) {
      const u = JSON.parse(raw);
      if (u.email === email) {
        u.role = "admin";
        u.credits = Math.max(u.credits || 0, 99999);
        await kv.set(`user:${u.id}`, JSON.stringify(u));
        return c.json({ success: true, user: u });
      }
    }
    return c.json({ error: "User not found" }, 404);
  } catch (e) {
    return c.json({ error: `Bootstrap failed: ${e}` }, 500);
  }
});

app.get(`${PREFIX}/models`, async (c) => {
  const models = await kv.getByPrefix("model:");
  return c.json(models.map((m: string) => JSON.parse(m)));
});

app.get(`${PREFIX}/providers`, async (c) => {
  const providers = await kv.getByPrefix("provider:");
  return c.json(providers.map((p: string) => JSON.parse(p)));
});


// =============================================
// USER ROUTES (Requires Authentication)
// =============================================

app.get(`${PREFIX}/user/profile`, authMiddleware, async (c) => {
  const user = c.get('user');
  const profile = await kv.get(`user:${user.id}`);
  if (!profile) {
    const p = { id: user.id, email: user.email, name: user.user_metadata?.name || "", role: user.user_metadata?.role || "user", credits: 0, createdAt: new Date().toISOString() };
    await kv.set(`user:${user.id}`, JSON.stringify(p));
    return c.json(p);
  }
  return c.json(JSON.parse(profile));
});

app.put(`${PREFIX}/user/profile`, authMiddleware, async (c) => {
  const user = c.get('user');
  const updates = await c.req.json();
  const existing = await kv.get(`user:${user.id}`);
  const profile = existing ? JSON.parse(existing) : {};
  const updated = { ...profile, ...updates, id: user.id };
  await kv.set(`user:${user.id}`, JSON.stringify(updated));
  return c.json(updated);
});

app.post(`${PREFIX}/purchases`, authMiddleware, async (c) => {
  const user = c.get('user');
  const { modelId, price } = await c.req.json();
  const profileStr = await kv.get(`user:${user.id}`);
  if (!profileStr) return c.json({ error: "Profile not found" }, 404);
  const profile = JSON.parse(profileStr);
  if (profile.credits < price) return c.json({ error: "Insufficient credits" }, 400);
  profile.credits -= price;
  await kv.set(`user:${user.id}`, JSON.stringify(profile));
  const id = crypto.randomUUID();
  const purchase = { id, userId: user.id, modelId, price, createdAt: new Date().toISOString() };
  await kv.set(`purchase:${id}`, JSON.stringify(purchase));
  return c.json(purchase);
});

app.get(`${PREFIX}/purchases`, authMiddleware, async (c) => {
  const user = c.get('user');
  const all = await kv.getByPrefix("purchase:");
  const purchases = all.map((p: string) => JSON.parse(p));
  const profile = await kv.get(`user:${user.id}`);
  const role = profile ? JSON.parse(profile).role : "user";
  if (role === "admin") return c.json(purchases);
  return c.json(purchases.filter((p: any) => p.userId === user.id));
});

app.post(`${PREFIX}/topups`, authMiddleware, async (c) => {
  const user = c.get('user');
  const { amount } = await c.req.json();
  const profileStr = await kv.get(`user:${user.id}`);
  if (!profileStr) return c.json({ error: "Profile not found" }, 404);
  const profile = JSON.parse(profileStr);
  profile.credits = (profile.credits || 0) + amount;
  await kv.set(`user:${user.id}`, JSON.stringify(profile));
  const id = crypto.randomUUID();
  const topup = { id, userId: user.id, amount, createdAt: new Date().toISOString() };
  await kv.set(`topup:${id}`, JSON.stringify(topup));
  return c.json(topup);
});

app.get(`${PREFIX}/topups`, authMiddleware, async (c) => {
  const user = c.get('user');
  const all = await kv.getByPrefix("topup:");
  const topups = all.map((t: string) => JSON.parse(t));
  const profile = await kv.get(`user:${user.id}`);
  const role = profile ? JSON.parse(profile).role : "user";
  if (role === "admin") return c.json(topups);
  return c.json(topups.filter((t: any) => t.userId === user.id));
});

app.post(`${PREFIX}/tokens`, authMiddleware, async (c) => {
  const user = c.get('user');
  const { name } = await c.req.json();
  const id = crypto.randomUUID();
  const key = `mk_${crypto.randomUUID().replace(/-/g, "")}`;
  const token = { id, userId: user.id, name, key, createdAt: new Date().toISOString(), lastUsed: null, usageCount: 0 };
  await kv.set(`token:${id}`, JSON.stringify(token));
  return c.json(token);
});

app.get(`${PREFIX}/tokens`, authMiddleware, async (c) => {
  const user = c.get('user');
  const all = await kv.getByPrefix("token:");
  const tokens = all.map((t: string) => JSON.parse(t));
  const profile = await kv.get(`user:${user.id}`);
  const role = profile ? JSON.parse(profile).role : "user";
  if (role === "admin") return c.json(tokens);
  return c.json(tokens.filter((t: any) => t.userId === user.id));
});

app.delete(`${PREFIX}/tokens/:id`, authMiddleware, async (c) => {
  await kv.del(`token:${c.req.param("id")}`);
  return c.json({ success: true });
});

app.post(`${PREFIX}/usage-logs`, authMiddleware, async (c) => {
  const user = c.get('user');
  const log = await c.req.json();
  const id = crypto.randomUUID();
  const entry = { ...log, id, userId: user.id, createdAt: new Date().toISOString() };
  await kv.set(`usage:${id}`, JSON.stringify(entry));
  return c.json(entry);
});

app.get(`${PREFIX}/usage-logs`, authMiddleware, async (c) => {
  const user = c.get('user');
  const all = await kv.getByPrefix("usage:");
  const logs = all.map((l: string) => JSON.parse(l));
  const profile = await kv.get(`user:${user.id}`);
  const role = profile ? JSON.parse(profile).role : "user";
  if (role === "admin") return c.json(logs);
  return c.json(logs.filter((l: any) => l.userId === user.id));
});


// =============================================
// ADMIN ROUTES (Requires Admin Role)
// =============================================

app.post(`${PREFIX}/admin/set-role`, adminMiddleware, async (c) => {
  const { userId, role } = await c.req.json();
  const targetStr = await kv.get(`user:${userId}`);
  if (!targetStr) return c.json({ error: "User not found" }, 404);
  const target = JSON.parse(targetStr);
  target.role = role;
  await kv.set(`user:${userId}`, JSON.stringify(target));
  return c.json(target);
});

app.post(`${PREFIX}/models`, adminMiddleware, async (c) => {
  const model = await c.req.json();
  const id = model.id || crypto.randomUUID();
  const m = { ...model, id, createdAt: new Date().toISOString() };
  await kv.set(`model:${id}`, JSON.stringify(m));
  return c.json(m);
});

app.put(`${PREFIX}/models/:id`, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();
  const existing = await kv.get(`model:${id}`);
  if (!existing) return c.json({ error: "Model not found" }, 404);
  const updated = { ...JSON.parse(existing), ...updates };
  await kv.set(`model:${id}`, JSON.stringify(updated));
  return c.json(updated);
});

app.post(`${PREFIX}/models/delete`, adminMiddleware, async (c) => {
  const { id } = await c.req.json();
  if (!id) return c.json({ error: "Missing model id" }, 400);
  try {
    const existing = await kv.get(`model:${id}`);
    if (!existing) return c.json({ success: false, error: "Model not found", searchedKey: `model:${id}` }, 404);
    await kv.del(`model:${id}`);
    return c.json({ success: true, id });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

app.post(`${PREFIX}/providers`, adminMiddleware, async (c) => {
  const provider = await c.req.json();
  const id = crypto.randomUUID();
  const p = { ...provider, id, createdAt: new Date().toISOString() };
  await kv.set(`provider:${id}`, JSON.stringify(p));
  return c.json(p);
});

app.delete(`${PREFIX}/providers/:id`, adminMiddleware, async (c) => {
  await kv.del(`provider:${c.req.param("id")}`);
  return c.json({ success: true });
});

app.get(`${PREFIX}/admin/users`, adminMiddleware, async (c) => {
  const users = await kv.getByPrefix("user:");
  return c.json(users.map((u: string) => JSON.parse(u)));
});

app.put(`${PREFIX}/admin/users/:id`, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json();
  const existing = await kv.get(`user:${id}`);
  if (!existing) return c.json({ error: "User not found" }, 404);
  const updated = { ...JSON.parse(existing), ...updates };
  await kv.set(`user:${id}`, JSON.stringify(updated));
  return c.json(updated);
});

app.post(`${PREFIX}/seed`, adminMiddleware, async (c) => {
  return c.json({ success: true, message: "Seed disabled." });
});

app.post(`${PREFIX}/admin/clear-data`, adminMiddleware, async (c) => {
  try {
    const prefixes = ["model:", "provider:", "purchase:", "topup:", "usage:", "token:"];
    let deleted = 0;
    for (const prefix of prefixes) {
      const itemsStr = await kv.getByPrefix(prefix);
      const keys = itemsStr.map((itemStr: string) => `${prefix}${JSON.parse(itemStr).id}`);
      if (keys.length > 0) {
        await kv.mdel(keys);
        deleted += keys.length;
      }
    }
    return c.json({ success: true, deleted });
  } catch (e: any) {
    return c.json({ error: `Exception: ${e.message}` }, 500);
  }
});

app.post(`${PREFIX}/admin/clear-models`, adminMiddleware, async (c) => {
  try {
    const modelsStr = await kv.getByPrefix("model:");
    const keys = modelsStr.map((mStr: string) => `model:${JSON.parse(mStr).id}`);
    if (keys.length === 0) return c.json({ success: true, deleted: 0 });
    await kv.mdel(keys);
    return c.json({ success: true, deleted: keys.length });
  } catch (e: any) {
    return c.json({ error: `Exception: ${e.message}` }, 500);
  }
});

app.post(`${PREFIX}/admin/test-supabase-query`, adminMiddleware, async (c) => {
  try {
    const { action, pattern } = await c.req.json();
    const prefix = pattern ? pattern.replace("%", "") : "model:";
    if (action === "list") {
      const items = await kv.getByPrefix(prefix);
      const data = items.map((itemStr: string) => {
        const item = JSON.parse(itemStr);
        return { key: `${prefix}${item.id}`, value: item };
      });
      return c.json({ success: true, data, count: data.length });
    } else if (action === "delete") {
      const items = await kv.getByPrefix(prefix);
      const keys = items.map((itemStr: string) => `${prefix}${JSON.parse(itemStr).id}`);
      if (keys.length > 0) await kv.mdel(keys);
      return c.json({ success: true, deleted: keys.length, keys });
    } else if (action === "count") {
      const items = await kv.getByPrefix(prefix);
      return c.json({ success: true, count: items.length });
    } else {
      return c.json({ error: "Invalid action" }, 400);
    }
  } catch (e: any) {
    return c.json({ error: `Exception: ${e.message}` }, 500);
  }
});

app.get(`${PREFIX}/admin/router-config`, adminMiddleware, async (c) => {
  return c.json({
    ROUTER_API_BASE,
    ROUTER_API_KEY_SET: !!ROUTER_API_KEY,
    ROUTER_API_KEY_LENGTH: ROUTER_API_KEY?.length || 0,
    ROUTER_API_KEY_PREVIEW: ROUTER_API_KEY ? `${ROUTER_API_KEY.substring(0, 6)}...${ROUTER_API_KEY.substring(ROUTER_API_KEY.length - 4)}` : "NOT SET",
  });
});

app.post(`${PREFIX}/sync-models`, adminMiddleware, async (c) => {
  try {
    const fetchUrl = `${ROUTER_API_BASE}/v1/models`;
    const res = await fetch(fetchUrl, {
      headers: { "Authorization": `Bearer ${ROUTER_API_KEY}` },
    });
    if (!res.ok) {
      const errText = await res.text();
      return c.json({ error: `Failed to fetch: ${res.status} ${errText}` }, 500);
    }
    const data = await res.json();
    const modelsList = data.data || data || [];
    let synced = 0;
    for (const m of modelsList) {
      const modelId = m.id || m.name;
      if (!modelId) continue;
      let category = "Chat";
      const idLower = modelId.toLowerCase();
      if (idLower.includes("embed")) category = "Embedding";
      else if (idLower.includes("ocr") || idLower.includes("vision")) category = "OCR";
      else if (idLower.includes("rag")) category = "RAG";
      let provider = "Unknown";
      if (idLower.includes("gpt") || idLower.includes("openai") || idLower.includes("o1") || idLower.includes("o3") || idLower.includes("o4")) provider = "OpenAI";
      else if (idLower.includes("claude") || idLower.includes("anthropic")) provider = "Anthropic";
      else if (idLower.includes("gemini") || idLower.includes("google")) provider = "Google";
      else if (idLower.includes("llama") || idLower.includes("meta")) provider = "Meta";
      else if (idLower.includes("mistral")) provider = "Mistral";
      else if (idLower.includes("cohere") || idLower.includes("command")) provider = "Cohere";
      else if (idLower.includes("deepseek")) provider = "DeepSeek";
      else if (idLower.includes("qwen")) provider = "Qwen";
      
      const parts = modelId.split("/");
      const routerPrefix = parts.length > 1 ? parts[0] : "";
      const displayName = parts.length > 1 ? parts.slice(1).join("/") : modelId;

      const existing = await kv.get(`model:${modelId}`);
      if (existing) {
        const ex = JSON.parse(existing);
        const updated = { ...ex, routerModelId: modelId, routerPrefix, displayName, ownedBy: m.owned_by || provider, syncedAt: new Date().toISOString() };
        await kv.set(`model:${modelId}`, JSON.stringify(updated));
      } else {
        const model = {
          id: modelId, name: displayName, routerModelId: modelId, routerPrefix, displayName,
          provider, ownedBy: m.owned_by || provider, category, description: `${displayName} - via 9Router`,
          price: 10, inputPrice: 0.001, outputPrice: 0.002, contextWindow: "N/A", status: "active",
          createdAt: new Date().toISOString(), syncedAt: new Date().toISOString(),
        };
        await kv.set(`model:${modelId}`, JSON.stringify(model));
      }
      synced++;
    }
    return c.json({ success: true, synced, total: modelsList.length });
  } catch (e: any) {
    return c.json({ error: `Sync failed: ${e.message}` }, 500);
  }
});


// =============================================
// PROXY ROUTES
// =============================================

app.post(`${PREFIX}/v1/chat/completions`, async (c) => {
  try {
    let userId: string | null = null;
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];

    if (token?.startsWith("mk_")) {
      const allTokens = await kv.getByPrefix("token:");
      const tokenRecord = allTokens.map((t: string) => JSON.parse(t)).find((t: any) => t.key === token);
      if (!tokenRecord) return c.json({ error: "Invalid API key" }, 401);
      userId = tokenRecord.userId;
      tokenRecord.lastUsed = new Date().toISOString();
      tokenRecord.usageCount = (tokenRecord.usageCount || 0) + 1;
      await kv.set(`token:${tokenRecord.id}`, JSON.stringify(tokenRecord));
    } else {
      const user = await getUserFromToken(authHeader);
      if (!user) return c.json({ error: "Unauthorized" }, 401);
      userId = user.id;
    }

    const body = await c.req.json();
    const modelId = body.model;

    if (!modelId) return c.json({ error: "Missing model field" }, 400);

    const allPurchases = await kv.getByPrefix("purchase:");
    const userPurchases = allPurchases.map((p: string) => JSON.parse(p)).filter((p: any) => p.userId === userId);
    const hasPurchased = userPurchases.some((p: any) => p.modelId === modelId);
    if (!hasPurchased) return c.json({ error: "You haven't purchased this model. Please purchase it first." }, 403);

    const profileStr = await kv.get(`user:${userId}`);
    if (!profileStr) return c.json({ error: "User profile not found" }, 404);
    const profile = JSON.parse(profileStr);

    const modelStr = await kv.get(`model:${modelId}`);
    const modelData = modelStr ? JSON.parse(modelStr) : null;
    const costPerRequest = modelData?.inputPrice || 0.001;

    if (profile.credits < costPerRequest) {
      return c.json({ error: "Insufficient credits. Please top up." }, 402);
    }

    const routerModelId = modelData?.routerModelId || modelId;
    const forwardBody = { ...body, model: routerModelId };
    const isStream = body.stream === true;

    const routerRes = await fetch(`${ROUTER_API_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(forwardBody),
    });

    if (!routerRes.ok) {
      const errText = await routerRes.text();
      return c.json({ error: `Upstream error: ${routerRes.status}` }, routerRes.status as any);
    }

    profile.credits = Math.max(0, profile.credits - costPerRequest);
    await kv.set(`user:${userId}`, JSON.stringify(profile));

    const usageId = crypto.randomUUID();
    await kv.set(`usage:${usageId}`, JSON.stringify({
      id: usageId, userId, modelId, type: "chat/completions", cost: costPerRequest, createdAt: new Date().toISOString(),
    }));

    if (isStream && routerRes.body) {
      return new Response(routerRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const result = await routerRes.json();
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: `Proxy error: ${e.message}` }, 500);
  }
});

app.post(`${PREFIX}/v1/:endpoint`, async (c) => {
  try {
    const endpoint = c.req.param("endpoint");
    if (endpoint === "chat") return c.json({ error: "Use /v1/chat/completions" }, 400);

    let userId: string | null = null;
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];

    if (token?.startsWith("mk_")) {
      const allTokens = await kv.getByPrefix("token:");
      const tokenRecord = allTokens.map((t: string) => JSON.parse(t)).find((t: any) => t.key === token);
      if (!tokenRecord) return c.json({ error: "Invalid API key" }, 401);
      userId = tokenRecord.userId;
      tokenRecord.lastUsed = new Date().toISOString();
      tokenRecord.usageCount = (tokenRecord.usageCount || 0) + 1;
      await kv.set(`token:${tokenRecord.id}`, JSON.stringify(tokenRecord));
    } else {
      const user = await getUserFromToken(authHeader);
      if (!user) return c.json({ error: "Unauthorized" }, 401);
      userId = user.id;
    }

    const body = await c.req.json();

    const routerRes = await fetch(`${ROUTER_API_BASE}/v1/${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!routerRes.ok) {
      return c.json({ error: `Upstream error: ${routerRes.status}` }, routerRes.status as any);
    }

    const usageId = crypto.randomUUID();
    await kv.set(`usage:${usageId}`, JSON.stringify({
      id: usageId, userId, type: endpoint, cost: 0.001, createdAt: new Date().toISOString(),
    }));

    const result = await routerRes.json();
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: `Proxy error: ${e.message}` }, 500);
  }
});

Deno.serve(app.fetch);