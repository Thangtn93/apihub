import React, { useEffect, useState } from "react";
import { useAuth, api } from "../auth-context";
import { Link } from "react-router";
import { ShoppingBag, ExternalLink, Cpu } from "lucide-react";

export function PurchasedPage() {
  const { accessToken } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api(accessToken).get("/purchases").then(d => Array.isArray(d) && setPurchases(d));
    api().get("/models").then(d => Array.isArray(d) && setModels(d));
  }, [accessToken]);

  const getModel = (id: string) => models.find(m => m.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Models đã mua</h1>
        <p className="text-[#6B7280]">Quản lý các model bạn đã mua</p>
      </div>
      {purchases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E5E7EB]">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-[#E5E7EB]" />
          <p className="text-[#6B7280]">Bạn chưa mua model nào</p>
          <Link to="/marketplace" className="inline-block mt-3 text-[#D4AF37] font-semibold hover:underline">Khám phá Marketplace</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {purchases.map(p => {
            const m = getModel(p.modelId);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B5A2B] flex items-center justify-center shrink-0">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1F1F1F]">{m?.name || p.modelId}</h3>
                    <p className="text-xs text-[#6B7280]">{m?.provider} · {m?.category}</p>
                    <p className="text-xs text-[#6B7280] mt-1">Mua ngày {new Date(p.createdAt).toLocaleDateString("vi")}</p>
                  </div>
                  <Link to={`/marketplace/${p.modelId}`} className="text-[#D4AF37] hover:text-[#8B5A2B]">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
