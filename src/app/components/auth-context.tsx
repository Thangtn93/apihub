import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const supabaseUrl = `https://${projectId}.supabase.co`;
const API_BASE = `${supabaseUrl}/functions/v1/server`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  credits: number;
  createdAt: string;
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ session: any; user: any; profile: UserProfile | null }>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  profile: null,
  accessToken: null,
  loading: true,
  signIn: async () => ({ session: null, user: null, profile: null }),
  signUp: async () => ({}),
  signOut: async () => {},
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function useAuth() {
  const ctx = useContext(AuthContext);
  // Fallback to default context instead of crashing if used outside provider
  return ctx ?? defaultAuthContext;
}

export function api(token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else headers["Authorization"] = `Bearer ${publicAnonKey}`;
  return {
    get: async (path: string) => {
      const res = await fetch(`${API_BASE}${path}`, { headers });
      return res.json();
    },
    post: async (path: string, body?: any) => {
      const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: body ? JSON.stringify(body) : undefined });
      return res.json();
    },
    put: async (path: string, body?: any) => {
      const res = await fetch(`${API_BASE}${path}`, { method: "PUT", headers, body: body ? JSON.stringify(body) : undefined });
      return res.json();
    },
    del: async (path: string) => {
      const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers });
      return res.json();
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const p = await api(token).get("/user/profile");
      if (!p.error) {
        // Auto-bootstrap admin for specific email
        if (p.email === "ngocthang1493@gmail.com" && p.role !== "admin") {
          try {
            await api(token).post("/admin/bootstrap", { email: "ngocthang1493@gmail.com" });
            const updated = await api(token).get("/user/profile");
            if (!updated.error) { setProfile(updated); return; }
          } catch (e) { console.log("Bootstrap error:", e); }
        }
        setProfile(p);
      }
    } catch (e) {
      console.log("Profile fetch error:", e);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setAccessToken(session.access_token);
        fetchProfile(session.access_token);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setAccessToken(session.access_token);
        fetchProfile(session.access_token);
      } else {
        setUser(null);
        setProfile(null);
        setAccessToken(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch profile immediately so callers can check role before navigating
    let fetchedProfile: UserProfile | null = null;
    try {
      const token = data.session?.access_token;
      if (token) {
        const p = await api(token).get("/user/profile");
        if (!p.error) {
          // Auto-bootstrap admin for specific email
          if (p.email === "ngocthang1493@gmail.com" && p.role !== "admin") {
            try {
              await api(token).post("/admin/bootstrap", { email: "ngocthang1493@gmail.com" });
              const updated = await api(token).get("/user/profile");
              if (!updated.error) {
                fetchedProfile = updated;
                setProfile(updated);
              }
            } catch (e) { console.log("Bootstrap error:", e); }
          } else {
            fetchedProfile = p;
            setProfile(p);
          }
        }
      }
    } catch (e) {
      console.log("Profile fetch error during signIn:", e);
    }

    // Fallback: if KV profile fetch failed, build a minimal profile from
    // Supabase Auth user_metadata (set by reset-users / signup endpoints)
    if (!fetchedProfile && data.user) {
      const meta = data.user.user_metadata ?? {};
      fetchedProfile = {
        id: data.user.id,
        email: data.user.email ?? email,
        name: meta.name ?? email.split("@")[0],
        role: meta.role ?? "user",
        credits: 0,
        createdAt: data.user.created_at ?? new Date().toISOString(),
      };
      setProfile(fetchedProfile);
      console.log("signIn: using user_metadata fallback profile, role =", fetchedProfile.role);
    }

    return { session: data.session, user: data.user, profile: fetchedProfile };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const res = await api().post("/auth/signup", { email, password, name });
    if (res.error) throw new Error(res.error);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setAccessToken(null);
  };

  const refreshProfile = async () => {
    if (accessToken) await fetchProfile(accessToken);
  };

  return (
    <AuthContext.Provider value={{ user, profile, accessToken, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}