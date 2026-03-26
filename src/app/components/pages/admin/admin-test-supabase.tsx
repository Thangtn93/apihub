import React, { useState } from "react";
import { useAuth, api, supabase } from "../../auth-context";
import { CheckCircle, XCircle, Loader2, Database, Trash2, Plus, Key } from "lucide-react";
import { toast } from "sonner";

export function AdminTestSupabasePage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [fixingJwt, setFixingJwt] = useState(false);

  const fixJwt = async () => {
    setFixingJwt(true);
    try {
      await supabase.auth.signOut();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "ngocthang1493@gmail.com",
        password: "Thang1493@"
      });
      if (error) {
        toast.error(`Login failed: ${error.message}`);
      } else {
        toast.success("Successfully retrieved new JWT! Vui lòng thử lại các bài test.");
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setFixingJwt(false);
    }
  };

  const addResult = (step: string, status: "success" | "error" | "info", message: string, data?: any) => {
    const result = { step, status, message, data, timestamp: new Date().toISOString() };
    setResults(prev => [...prev, result]);
    console.log(`[TEST ${step}]`, status, message, data);
    return result;
  };

  // Test 1: Kiểm tra kết nối Supabase
  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    try {
      addResult("1", "info", "Đang test kết nối server...");
      const health = await api(accessToken).get("/health");
      if (health?.status === "ok") {
        addResult("1", "success", "✓ Server đang hoạt động", health);
      } else {
        addResult("1", "error", "✗ Server không phản hồi đúng", health);
      }
    } catch (e: any) {
      addResult("1", "error", `✗ Lỗi kết nối: ${e.message}`, e);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Liệt kê tất cả keys trong KV store
  const testListAllKeys = async () => {
    setLoading(true);
    try {
      addResult("2", "info", "Đang lấy danh sách tất cả models...");
      const models = await api(accessToken).get("/models");
      if (Array.isArray(models)) {
        const keys = models.map(m => `model:${m.id}`);
        setAllKeys(keys);
        addResult("2", "success", `✓ Tìm thấy ${models.length} models trong database`, { count: models.length, sample: models.slice(0, 3) });
        
        // Log chi tiết các model IDs
        const modelIds = models.map(m => m.id);
        addResult("2", "info", `Model IDs: ${modelIds.length} total`, { ids: modelIds.slice(0, 10), hasSlashIds: modelIds.some(id => id.includes("/")) });
      } else {
        addResult("2", "error", "✗ Response không phải array", models);
      }
    } catch (e: any) {
      addResult("2", "error", `✗ Lỗi: ${e.message}`, e);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Tạo test model
  const testCreateModel = async () => {
    setLoading(true);
    try {
      const testId = `test-model-${Date.now()}`;
      const testIdWithSlash = `test/provider/model-${Date.now()}`;
      
      addResult("3a", "info", `Đang tạo test model đơn giản: ${testId}`);
      const model1 = {
        id: testId,
        name: "Test Model Simple",
        provider: "TestProvider",
        category: "Chat",
        description: "Test model for deletion",
        price: 1,
        inputPrice: 0.001,
        outputPrice: 0.002,
        contextWindow: "4K",
        status: "active"
      };
      
      const created1 = await api(accessToken).post("/models", model1);
      if (created1?.id) {
        addResult("3a", "success", `✓ Tạo thành công model: ${created1.id}`, created1);
      } else {
        addResult("3a", "error", "✗ Không tạo được model", created1);
      }

      addResult("3b", "info", `Đang tạo test model có dấu '/': ${testIdWithSlash}`);
      const model2 = {
        id: testIdWithSlash,
        name: "Test Model With Slash",
        provider: "TestProvider",
        category: "Chat",
        description: "Test model with slash in ID",
        price: 1,
        inputPrice: 0.001,
        outputPrice: 0.002,
        contextWindow: "4K",
        status: "active"
      };
      
      const created2 = await api(accessToken).post("/models", model2);
      if (created2?.id) {
        addResult("3b", "success", `✓ Tạo thành công model có '/': ${created2.id}`, created2);
      } else {
        addResult("3b", "error", "✗ Không tạo được model có '/'", created2);
      }

      // Verify created
      addResult("3c", "info", "Đang verify models đã tạo...");
      const allModels = await api(accessToken).get("/models");
      const found1 = allModels.find((m: any) => m.id === testId);
      const found2 = allModels.find((m: any) => m.id === testIdWithSlash);
      
      if (found1 && found2) {
        addResult("3c", "success", `✓ Verify thành công: tìm thấy cả 2 models`, { found1: found1.id, found2: found2.id });
      } else {
        addResult("3c", "error", `✗ Verify thất bại: found1=${!!found1}, found2=${!!found2}`, { found1, found2 });
      }

    } catch (e: any) {
      addResult("3", "error", `✗ Lỗi: ${e.message}`, e);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Xóa model đơn lẻ (test cả endpoint cũ và mới)
  const testDeleteSingleModel = async () => {
    setLoading(true);
    try {
      // Tìm model để xóa
      const models = await api(accessToken).get("/models");
      const testModels = models.filter((m: any) => m.id?.startsWith("test"));
      
      if (testModels.length === 0) {
        addResult("4", "error", "✗ Không tìm thấy test model nào để xóa. Chạy Test 3 trước.");
        setLoading(false);
        return;
      }

      const modelToDelete = testModels[0];
      addResult("4a", "info", `Đang xóa model: ${modelToDelete.id} (có dấu '/': ${modelToDelete.id.includes("/")})`);

      // Thử xóa bằng POST /models/delete
      const deleteResult = await api(accessToken).post("/models/delete", { id: modelToDelete.id });
      
      if (deleteResult?.success) {
        addResult("4a", "success", `✓ Xóa thành công qua POST /models/delete`, deleteResult);
      } else if (deleteResult?.error) {
        addResult("4a", "error", `✗ Lỗi khi xóa: ${deleteResult.error}`, deleteResult);
      } else {
        addResult("4a", "error", `✗ Response không rõ ràng`, deleteResult);
      }

      // Verify đã xóa
      addResult("4b", "info", "Đang verify model đã bị xóa...");
      const afterDelete = await api(accessToken).get("/models");
      const stillExists = afterDelete.find((m: any) => m.id === modelToDelete.id);
      
      if (!stillExists) {
        addResult("4b", "success", `✓ Verify thành công: model đã bị xóa khỏi database`);
      } else {
        addResult("4b", "error", `✗ Verify thất bại: model vẫn còn trong database`, stillExists);
      }

    } catch (e: any) {
      addResult("4", "error", `✗ Lỗi: ${e.message}`, e);
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Xóa nhiều models với LIKE query (giống clear-models)
  const testBulkDelete = async () => {
    setLoading(true);
    try {
      addResult("5a", "info", "Đang tạo nhiều test models...");
      
      // Tạo 5 test models
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const testModel = {
          id: `bulk-test-${Date.now()}-${i}`,
          name: `Bulk Test ${i}`,
          provider: "BulkTest",
          category: "Chat",
          description: "Bulk deletion test",
          price: 1,
          inputPrice: 0.001,
          outputPrice: 0.002,
          contextWindow: "4K",
          status: "active"
        };
        promises.push(api(accessToken).post("/models", testModel));
      }
      
      await Promise.all(promises);
      addResult("5a", "success", `✓ Tạo thành công 5 test models với prefix 'bulk-test-'`);

      // Verify created
      const beforeDelete = await api(accessToken).get("/models");
      const bulkTestModels = beforeDelete.filter((m: any) => m.id?.startsWith("bulk-test-"));
      addResult("5b", "info", `Tìm thấy ${bulkTestModels.length} models với prefix 'bulk-test-'`, { ids: bulkTestModels.map((m: any) => m.id) });

      // Gọi clear-models
      addResult("5c", "info", "Đang gọi /admin/clear-models để xóa tất cả models...");
      const clearResult = await api(accessToken).post("/admin/clear-models");
      
      if (clearResult?.error) {
        addResult("5c", "error", `✗ Lỗi clear-models: ${clearResult.error}`, clearResult);
      } else if (clearResult?.success) {
        addResult("5c", "success", `✓ Clear-models thành công: đã xóa ${clearResult.deleted} models`, clearResult);
      } else {
        addResult("5c", "error", `✗ Response không rõ ràng`, clearResult);
      }

      // Verify all deleted
      addResult("5d", "info", "Đang verify tất cả models đã bị xóa...");
      const afterDelete = await api(accessToken).get("/models");
      
      if (afterDelete.length === 0) {
        addResult("5d", "success", `✓ Verify thành công: database đã trống (0 models)`);
      } else {
        addResult("5d", "error", `✗ Verify thất bại: vẫn còn ${afterDelete.length} models`, { count: afterDelete.length, sample: afterDelete.slice(0, 5) });
      }

    } catch (e: any) {
      addResult("5", "error", `✗ Lỗi: ${e.message}`, e);
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Test trực tiếp Supabase query
  const testDirectSupabaseQuery = async () => {
    setLoading(true);
    try {
      // Count models
      addResult("6a", "info", "Test COUNT query trực tiếp...");
      const countRes = await api(accessToken).post("/admin/test-supabase-query", { 
        action: "count", 
        pattern: "model:%" 
      });
      if (countRes?.success) {
        addResult("6a", "success", `✓ COUNT query thành công: ${countRes.count} models`, countRes);
      } else {
        addResult("6a", "error", `✗ COUNT query thất bại: ${countRes?.error}`, countRes);
      }

      // List models
      addResult("6b", "info", "Test LIST query trực tiếp...");
      const listRes = await api(accessToken).post("/admin/test-supabase-query", { 
        action: "list", 
        pattern: "model:%" 
      });
      if (listRes?.success) {
        addResult("6b", "success", `✓ LIST query thành công: ${listRes.count} models`, { count: listRes.count, sample: listRes.data?.slice(0, 3) });
      } else {
        addResult("6b", "error", `✗ LIST query thất bại: ${listRes?.error}`, listRes);
      }

      // Test với pattern khác
      addResult("6c", "info", "Test COUNT với pattern 'model:test%'...");
      const countTestRes = await api(accessToken).post("/admin/test-supabase-query", { 
        action: "count", 
        pattern: "model:test%" 
      });
      if (countTestRes?.success) {
        addResult("6c", "success", `✓ COUNT test models: ${countTestRes.count}`, countTestRes);
      } else {
        addResult("6c", "error", `✗ COUNT test thất bại: ${countTestRes?.error}`, countTestRes);
      }

    } catch (e: any) {
      addResult("6", "error", `✗ Lỗi: ${e.message}`, e);
    } finally {
      setLoading(false);
    }
  };

  // Test toàn bộ flow
  const runAllTests = async () => {
    setResults([]);
    setAllKeys([]);
    await testConnection();
    await new Promise(r => setTimeout(r, 500));
    await testListAllKeys();
    await new Promise(r => setTimeout(r, 500));
    await testCreateModel();
    await new Promise(r => setTimeout(r, 500));
    await testDeleteSingleModel();
    await new Promise(r => setTimeout(r, 500));
    await testBulkDelete();
    await new Promise(r => setTimeout(r, 500));
    await testDirectSupabaseQuery();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Test Supabase Delete Functions</h1>
          <p className="text-[#6B7280] text-sm mt-1 flex items-center gap-2">
            Kiểm tra từng bước chức năng xóa models trong Supabase
            {accessToken ? (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" /> Có JWT Token
              </span>
            ) : (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" /> Thiếu JWT Token
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fixJwt} 
            disabled={fixingJwt || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] text-[#1F1F1F] rounded-lg font-semibold hover:border-[#D4AF37] hover:text-[#D4AF37] transition disabled:opacity-50"
          >
            {fixingJwt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Fix JWT Error
          </button>
          <button 
            onClick={runAllTests} 
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {loading ? "Đang test..." : "Chạy Tất Cả Tests"}
          </button>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Hướng Dẫn Sử Dụng
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Mục đích:</strong> Trang này giúp bạn kiểm tra xem chức năng xóa models trong Supabase có hoạt động đúng không.</p>
          <div>
            <strong>Cách sử dụng:</strong>
            <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
              <li>Nhấn <strong>"Chạy Tất Cả Tests"</strong> để test toàn bộ flow tự động</li>
              <li>Hoặc chạy từng test riêng lẻ để debug chi tiết hơn</li>
              <li>Xem kết quả ở phần bên dưới - mỗi bước sẽ có icon màu xanh (✓ thành công) hoặc đỏ (✗ lỗi)</li>
              <li>Mở browser console (F12) để xem log chi tiết từ server</li>
            </ol>
          </div>
          <p className="text-xs mt-2 opacity-80">
            💡 <strong>Tip:</strong> Test 6 (Direct Supabase Query) sẽ cho bạn thấy chính xác Supabase có xử lý LIKE query đúng không.
          </p>
        </div>
      </div>

      {/* Individual test buttons */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="font-semibold text-[#1F1F1F] mb-4">Test Từng Bước</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button onClick={testConnection} disabled={loading} className="p-4 border border-[#E5E7EB] rounded-lg hover:border-[#D4AF37] transition text-left">
            <div className="font-medium text-[#1F1F1F] mb-1">1. Test Connection</div>
            <div className="text-xs text-[#6B7280]">Kiểm tra server có hoạt động</div>
          </button>
          
          <button onClick={testListAllKeys} disabled={loading} className="p-4 border border-[#E5E7EB] rounded-lg hover:border-[#D4AF37] transition text-left">
            <div className="font-medium text-[#1F1F1F] mb-1">2. List All Models</div>
            <div className="text-xs text-[#6B7280]">Liệt kê tất cả models trong DB</div>
          </button>
          
          <button onClick={testCreateModel} disabled={loading} className="p-4 border border-[#E5E7EB] rounded-lg hover:border-[#D4AF37] transition text-left">
            <div className="font-medium text-[#1F1F1F] mb-1">3. Create Test Models</div>
            <div className="text-xs text-[#6B7280]">Tạo models test (có & không có /)</div>
          </button>
          
          <button onClick={testDeleteSingleModel} disabled={loading} className="p-4 border border-[#E5E7EB] rounded-lg hover:border-[#D4AF37] transition text-left">
            <div className="font-medium text-[#1F1F1F] mb-1">4. Delete Single Model</div>
            <div className="text-xs text-[#6B7280]">Test xóa 1 model cụ thể</div>
          </button>
          
          <button onClick={testBulkDelete} disabled={loading} className="p-4 border border-[#E5E7EB] rounded-lg hover:border-[#D4AF37] transition text-left">
            <div className="font-medium text-[#1F1F1F] mb-1">5. Bulk Delete (LIKE)</div>
            <div className="text-xs text-[#6B7280]">Test xóa nhiều với LIKE query</div>
          </button>
          
          <button onClick={testDirectSupabaseQuery} disabled={loading} className="p-4 border border-[#E5E7EB] rounded-lg hover:border-[#D4AF37] transition text-left">
            <div className="font-medium text-[#1F1F1F] mb-1">6. Direct Supabase Query</div>
            <div className="text-xs text-[#6B7280]">Test trực tiếp Supabase query</div>
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="bg-[#FAF7F0] px-6 py-3 border-b border-[#E5E7EB]">
            <h2 className="font-semibold text-[#1F1F1F]">Kết Quả Test ({results.length} steps)</h2>
          </div>
          <div className="divide-y divide-[#E5E7EB] max-h-[600px] overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="p-4 hover:bg-[#FAF7F0]/30 transition">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {r.status === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {r.status === "error" && <XCircle className="w-5 h-5 text-red-600" />}
                    {r.status === "info" && <Database className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs px-2 py-0.5 bg-[#E5E7EB] rounded text-[#6B7280]">
                        Step {r.step}
                      </span>
                      <span className="text-xs text-[#6B7280]">{new Date(r.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className={`text-sm font-medium ${
                      r.status === "success" ? "text-green-700" :
                      r.status === "error" ? "text-red-700" :
                      "text-blue-700"
                    }`}>
                      {r.message}
                    </div>
                    {r.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-[#6B7280] cursor-pointer hover:text-[#D4AF37]">
                          Xem chi tiết data
                        </summary>
                        <pre className="mt-2 p-3 bg-[#1F1F1F] text-[#D4AF37] rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(r.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Keys Summary */}
      {allKeys.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h2 className="font-semibold text-[#1F1F1F] mb-3">Danh Sách Keys trong Database ({allKeys.length})</h2>
          <div className="max-h-[300px] overflow-y-auto">
            <div className="space-y-1">
              {allKeys.slice(0, 50).map((key, i) => (
                <div key={i} className="text-xs font-mono text-[#6B7280] px-3 py-1.5 bg-[#FAF7F0] rounded">
                  {key}
                </div>
              ))}
              {allKeys.length > 50 && (
                <div className="text-xs text-[#6B7280] px-3 py-2 text-center">
                  ... và {allKeys.length - 50} keys khác
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}