import React, { useState, useEffect } from "react";
import { useAuth, api, supabase } from "../../auth-context";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Play, Bug, Database, Key } from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  id: string;
  name: string;
  status: "pending" | "running" | "passed" | "failed" | "warning";
  message: string;
  details?: any;
  timestamp?: string;
  duration?: number;
}

export function AdminUnitTestPage() {
  const { accessToken } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autoFix, setAutoFix] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [fixingJwt, setFixingJwt] = useState(false);

  const fixJwt = async () => {
    setFixingJwt(true);
    try {
      // First, sign out to clear any corrupted state
      await supabase.auth.signOut();
      
      // Sign in with the provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "ngocthang1493@gmail.com",
        password: "Thang1493@"
      });
      
      if (error) {
        toast.error(`Login failed: ${error.message}`);
      } else {
        toast.success("Successfully retrieved new JWT! You can now run the tests.");
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setFixingJwt(false);
    }
  };

  const updateTest = (id: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const log = (testId: string, message: string, data?: any) => {
    console.log(`[TEST ${testId}]`, message, data || "");
    if (data) {
      console.log(`[TEST ${testId} DATA]`, JSON.stringify(data, null, 2));
    }
  };

  // ========================================
  // DIAGNOSTIC FUNCTIONS
  // ========================================

  const runDiagnostics = async () => {
    const diag: any = {
      timestamp: new Date().toISOString(),
      supabase: {},
      server: {},
      database: {}
    };

    try {
      // Check server health
      const health = await api(accessToken).get("/health");
      diag.server.health = health;
      diag.server.healthy = health?.status === "ok";

      // Check router config
      const routerConfig = await api(accessToken).get("/admin/router-config");
      diag.server.routerConfig = routerConfig;

      // Direct Supabase query - COUNT all model keys
      const countResult = await api(accessToken).post("/admin/test-supabase-query", {
        action: "count",
        pattern: "model:%"
      });
      diag.database.modelCount = countResult?.count || 0;
      diag.database.countSuccess = countResult?.success;
      diag.database.countError = countResult?.error;

      // Direct Supabase query - LIST all model keys
      const listResult = await api(accessToken).post("/admin/test-supabase-query", {
        action: "list",
        pattern: "model:%"
      });
      diag.database.modelList = listResult?.data?.slice(0, 5) || [];
      diag.database.listSuccess = listResult?.success;
      diag.database.listError = listResult?.error;

      // Get models via API
      const modelsViaAPI = await api(accessToken).get("/models");
      diag.database.modelsViaAPI = {
        count: modelsViaAPI?.length || 0,
        sample: modelsViaAPI?.slice(0, 3) || [],
        hasSlashIds: modelsViaAPI?.some((m: any) => m.id?.includes("/"))
      };

      // Check consistency
      diag.database.consistent = diag.database.modelCount === (modelsViaAPI?.length || 0);

      setDiagnostics(diag);
      return diag;
    } catch (e: any) {
      diag.error = e.message;
      setDiagnostics(diag);
      return diag;
    }
  };

  // ========================================
  // TEST SUITE
  // ========================================

  const testSuite = [
    {
      id: "T001",
      name: "Server Health Check",
      run: async () => {
        const start = Date.now();
        try {
          log("T001", "Testing server health...");
          const health = await api(accessToken).get("/health");
          log("T001", "Health response:", health);
          
          if (health?.status === "ok") {
            return { 
              status: "passed", 
              message: "✓ Server is healthy",
              duration: Date.now() - start
            };
          }
          return { 
            status: "failed", 
            message: "✗ Server returned unexpected response",
            details: health,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return { 
            status: "failed", 
            message: `✗ Server connection failed: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T002",
      name: "Supabase Query - COUNT operation",
      run: async () => {
        const start = Date.now();
        try {
          log("T002", "Testing Supabase COUNT query...");
          const result = await api(accessToken).post("/admin/test-supabase-query", {
            action: "count",
            pattern: "model:%"
          });
          log("T002", "COUNT result:", result);

          if (result?.success) {
            return {
              status: "passed",
              message: `✓ COUNT query works: ${result.count} models`,
              details: result,
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ COUNT query failed: ${result?.error}`,
            details: result,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T003",
      name: "Supabase Query - LIST operation",
      run: async () => {
        const start = Date.now();
        try {
          log("T003", "Testing Supabase LIST query...");
          const result = await api(accessToken).post("/admin/test-supabase-query", {
            action: "list",
            pattern: "model:%"
          });
          log("T003", "LIST result:", { success: result?.success, count: result?.count });

          if (result?.success) {
            return {
              status: "passed",
              message: `✓ LIST query works: ${result.count} models`,
              details: { count: result.count, sample: result.data?.slice(0, 3) },
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ LIST query failed: ${result?.error}`,
            details: result,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T004",
      name: "Create Model - Simple ID",
      run: async () => {
        const start = Date.now();
        try {
          const testId = `unittest-simple-${Date.now()}`;
          log("T004", `Creating model with simple ID: ${testId}`);
          
          const model = {
            id: testId,
            name: "Unit Test Simple",
            provider: "TestProvider",
            category: "Chat",
            description: "Unit test model with simple ID",
            price: 1,
            inputPrice: 0.001,
            outputPrice: 0.002,
            contextWindow: "4K",
            status: "active"
          };

          const created = await api(accessToken).post("/models", model);
          log("T004", "Create response:", created);

          if (created?.id === testId) {
            // Verify it exists
            const allModels = await api(accessToken).get("/models");
            const found = allModels?.find((m: any) => m.id === testId);
            
            if (found) {
              return {
                status: "passed",
                message: `✓ Model created and verified: ${testId}`,
                details: { created, found },
                duration: Date.now() - start
              };
            }
            return {
              status: "failed",
              message: `✗ Model created but not found in list`,
              details: { created, allCount: allModels?.length },
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ Create returned unexpected ID`,
            details: created,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T005",
      name: "Create Model - ID with Slashes",
      run: async () => {
        const start = Date.now();
        try {
          const testId = `unittest/provider/model-${Date.now()}`;
          log("T005", `Creating model with slash ID: ${testId}`);
          
          const model = {
            id: testId,
            name: "Unit Test Slash",
            provider: "TestProvider",
            category: "Chat",
            description: "Unit test model with slashes in ID",
            price: 1,
            inputPrice: 0.001,
            outputPrice: 0.002,
            contextWindow: "4K",
            status: "active"
          };

          const created = await api(accessToken).post("/models", model);
          log("T005", "Create response:", created);

          if (created?.id === testId) {
            // Verify it exists
            const allModels = await api(accessToken).get("/models");
            const found = allModels?.find((m: any) => m.id === testId);
            
            if (found) {
              return {
                status: "passed",
                message: `✓ Model with / created and verified: ${testId}`,
                details: { created, found },
                duration: Date.now() - start
              };
            }
            return {
              status: "failed",
              message: `✗ Model created but not found in list`,
              details: { created, allCount: allModels?.length },
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ Create returned unexpected ID`,
            details: created,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T006",
      name: "Delete Model - Simple ID",
      run: async () => {
        const start = Date.now();
        try {
          // Find a simple ID model to delete
          const allModels = await api(accessToken).get("/models");
          const simpleModel = allModels?.find((m: any) => 
            m.id?.startsWith("unittest-simple-") && !m.id.includes("/")
          );

          if (!simpleModel) {
            return {
              status: "warning",
              message: "⚠ No simple test model found to delete (run T004 first)",
              duration: Date.now() - start
            };
          }

          log("T006", `Deleting model: ${simpleModel.id}`);
          const deleteResult = await api(accessToken).post("/models/delete", { id: simpleModel.id });
          log("T006", "Delete response:", deleteResult);

          if (deleteResult?.success) {
            // Verify it's gone
            const afterDelete = await api(accessToken).get("/models");
            const stillExists = afterDelete?.find((m: any) => m.id === simpleModel.id);

            if (!stillExists) {
              return {
                status: "passed",
                message: `✓ Model deleted successfully: ${simpleModel.id}`,
                details: { deleteResult },
                duration: Date.now() - start
              };
            }
            return {
              status: "failed",
              message: `✗ Delete returned success but model still exists`,
              details: { deleteResult, stillExists },
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ Delete failed: ${deleteResult?.error || "Unknown error"}`,
            details: deleteResult,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T007",
      name: "Delete Model - ID with Slashes",
      run: async () => {
        const start = Date.now();
        try {
          // Find a slash ID model to delete
          const allModels = await api(accessToken).get("/models");
          const slashModel = allModels?.find((m: any) => 
            m.id?.startsWith("unittest/") && m.id.includes("/")
          );

          if (!slashModel) {
            return {
              status: "warning",
              message: "⚠ No slash test model found to delete (run T005 first)",
              duration: Date.now() - start
            };
          }

          log("T007", `Deleting model with /: ${slashModel.id}`);
          const deleteResult = await api(accessToken).post("/models/delete", { id: slashModel.id });
          log("T007", "Delete response:", deleteResult);

          if (deleteResult?.success) {
            // Verify it's gone
            const afterDelete = await api(accessToken).get("/models");
            const stillExists = afterDelete?.find((m: any) => m.id === slashModel.id);

            if (!stillExists) {
              return {
                status: "passed",
                message: `✓ Model with / deleted successfully: ${slashModel.id}`,
                details: { deleteResult },
                duration: Date.now() - start
              };
            }
            return {
              status: "failed",
              message: `✗ Delete returned success but model still exists`,
              details: { deleteResult, stillExists },
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ Delete failed: ${deleteResult?.error || "Unknown error"}`,
            details: deleteResult,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T008",
      name: "Bulk Delete - Create and Delete Multiple",
      run: async () => {
        const start = Date.now();
        try {
          const baseId = `bulktest-${Date.now()}`;
          log("T008", `Creating 3 test models with prefix: ${baseId}`);

          // Create 3 models
          const createPromises = [];
          for (let i = 0; i < 3; i++) {
            const model = {
              id: `${baseId}-${i}`,
              name: `Bulk Test ${i}`,
              provider: "BulkTest",
              category: "Chat",
              description: "Bulk delete test",
              price: 1,
              inputPrice: 0.001,
              outputPrice: 0.002,
              contextWindow: "4K",
              status: "active"
            };
            createPromises.push(api(accessToken).post("/models", model));
          }
          await Promise.all(createPromises);
          log("T008", "Created 3 models");

          // Verify created
          const beforeDelete = await api(accessToken).get("/models");
          const bulkModels = beforeDelete?.filter((m: any) => m.id?.startsWith(baseId));
          
          if (bulkModels.length !== 3) {
            return {
              status: "failed",
              message: `✗ Expected 3 models, found ${bulkModels.length}`,
              details: { bulkModels },
              duration: Date.now() - start
            };
          }

          // Delete using clear-models (which uses LIKE query)
          log("T008", "Calling clear-models to delete all models...");
          const clearResult = await api(accessToken).post("/admin/clear-models");
          log("T008", "Clear-models result:", clearResult);

          if (clearResult?.success) {
            // Verify all deleted
            const afterDelete = await api(accessToken).get("/models");
            
            if (afterDelete.length === 0) {
              return {
                status: "passed",
                message: `✓ Bulk delete successful: ${clearResult.deleted} models deleted`,
                details: { clearResult, beforeCount: beforeDelete.length },
                duration: Date.now() - start
              };
            }
            return {
              status: "warning",
              message: `⚠ Clear-models ran but ${afterDelete.length} models remain`,
              details: { clearResult, remaining: afterDelete.length, sample: afterDelete.slice(0, 3) },
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ Clear-models failed: ${clearResult?.error}`,
            details: clearResult,
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    },
    {
      id: "T009",
      name: "Data Consistency Check",
      run: async () => {
        const start = Date.now();
        try {
          log("T009", "Checking data consistency between API and direct Supabase...");

          // Get via API
          const modelsViaAPI = await api(accessToken).get("/models");
          const countViaAPI = modelsViaAPI?.length || 0;

          // Get via direct Supabase COUNT
          const countResult = await api(accessToken).post("/admin/test-supabase-query", {
            action: "count",
            pattern: "model:%"
          });
          const countViaSupabase = countResult?.count || 0;

          log("T009", "Counts:", { api: countViaAPI, supabase: countViaSupabase });

          if (countViaAPI === countViaSupabase) {
            return {
              status: "passed",
              message: `✓ Data consistent: ${countViaAPI} models in both sources`,
              details: { countViaAPI, countViaSupabase },
              duration: Date.now() - start
            };
          }
          return {
            status: "failed",
            message: `✗ Data inconsistent: API=${countViaAPI}, Supabase=${countViaSupabase}`,
            details: { countViaAPI, countViaSupabase },
            duration: Date.now() - start
          };
        } catch (e: any) {
          return {
            status: "failed",
            message: `✗ Exception: ${e.message}`,
            details: e,
            duration: Date.now() - start
          };
        }
      }
    }
  ];

  // ========================================
  // RUN ALL TESTS
  // ========================================

  const runAllTests = async () => {
    setRunning(true);
    setTests(testSuite.map(t => ({ ...t, status: "pending", message: "Waiting..." })));

    // Run diagnostics first
    console.log("========================================");
    console.log("RUNNING DIAGNOSTICS...");
    console.log("========================================");
    await runDiagnostics();

    console.log("========================================");
    console.log("RUNNING TEST SUITE...");
    console.log("========================================");

    for (const test of testSuite) {
      updateTest(test.id, { status: "running", message: "Running..." });
      
      try {
        const result = await test.run();
        updateTest(test.id, {
          status: result.status as any,
          message: result.message,
          details: result.details,
          timestamp: new Date().toISOString(),
          duration: result.duration
        });
        
        // Small delay between tests
        await new Promise(r => setTimeout(r, 300));
      } catch (e: any) {
        updateTest(test.id, {
          status: "failed",
          message: `✗ Unexpected error: ${e.message}`,
          details: e,
          timestamp: new Date().toISOString()
        });
      }
    }

    setRunning(false);
    
    // Final diagnostics
    console.log("========================================");
    console.log("FINAL DIAGNOSTICS...");
    console.log("========================================");
    const finalDiag = await runDiagnostics();
    
    // Summary
    const passed = tests.filter(t => t.status === "passed").length;
    const failed = tests.filter(t => t.status === "failed").length;
    const warnings = tests.filter(t => t.status === "warning").length;
    
    console.log("========================================");
    console.log("TEST SUMMARY");
    console.log("========================================");
    console.log(`Total: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    console.log("========================================");

    if (failed > 0) {
      toast.error(`${failed} test(s) failed. Check console for details.`);
    } else if (warnings > 0) {
      toast.warning(`All tests passed with ${warnings} warning(s).`);
    } else {
      toast.success("All tests passed!");
    }
  };

  useEffect(() => {
    setTests(testSuite.map(t => ({ ...t, status: "pending", message: "Ready to run" })));
  }, []);

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "passed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "running": return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "passed": return "text-green-700 bg-green-50";
      case "failed": return "text-red-700 bg-red-50";
      case "warning": return "text-yellow-700 bg-yellow-50";
      case "running": return "text-blue-700 bg-blue-50";
      default: return "text-gray-700 bg-gray-50";
    }
  };

  const passedCount = tests.filter(t => t.status === "passed").length;
  const failedCount = tests.filter(t => t.status === "failed").length;
  const warningCount = tests.filter(t => t.status === "warning").length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F1F1F] flex items-center gap-2">
            <Bug className="w-7 h-7 text-[#D4AF37]" />
            Comprehensive Unit Tests
          </h1>
          <p className="text-[#6B7280] text-sm mt-1 flex items-center gap-2">
            Automated test suite với auto-diagnostics và logging
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
            disabled={fixingJwt || running}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-[#E5E7EB] text-[#1F1F1F] rounded-lg font-semibold hover:border-[#D4AF37] hover:text-[#D4AF37] transition disabled:opacity-50"
            title="Auto-login with ngocthang1493@gmail.com to get a fresh token"
          >
            {fixingJwt ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
            Fix JWT Error
          </button>
          <button
            onClick={runAllTests}
            disabled={running}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#D4AF37] text-[#1F1F1F] rounded-lg font-semibold hover:bg-[#B08D57] transition disabled:opacity-50"
          >
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {running ? "Running Tests..." : "Run All Tests"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {tests.some(t => t.status !== "pending") && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-sm text-[#6B7280] mb-1">Total Tests</div>
            <div className="text-2xl font-bold text-[#1F1F1F]">{tests.length}</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="text-sm text-green-700 mb-1">Passed</div>
            <div className="text-2xl font-bold text-green-700">{passedCount}</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="text-sm text-red-700 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-700">{failedCount}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="text-sm text-yellow-700 mb-1">Warnings</div>
            <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
          </div>
        </div>
      )}

      {/* Diagnostics */}
      {diagnostics && (
        <div className="bg-[#1F1F1F] rounded-xl p-5 text-[#D4AF37] font-mono text-xs">
          <div className="flex items-center gap-2 mb-3 text-white font-bold">
            <Database className="w-4 h-4" />
            SYSTEM DIAGNOSTICS
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#FAF7F0] px-6 py-3 border-b border-[#E5E7EB]">
          <h2 className="font-semibold text-[#1F1F1F]">Test Results</h2>
        </div>
        <div className="divide-y divide-[#E5E7EB]">
          {tests.map(test => (
            <div key={test.id} className={`p-5 ${getStatusColor(test.status)}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-0.5">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs px-2 py-0.5 bg-white rounded border border-gray-300">
                      {test.id}
                    </span>
                    <span className="font-semibold text-[#1F1F1F]">{test.name}</span>
                    {test.duration && (
                      <span className="text-xs text-gray-500">({test.duration}ms)</span>
                    )}
                  </div>
                  <div className="text-sm mb-2">{test.message}</div>
                  {test.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:text-[#D4AF37] font-medium">
                        View Details
                      </summary>
                      <pre className="mt-2 p-3 bg-[#1F1F1F] text-[#D4AF37] rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                  {test.timestamp && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(test.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
        <div className="font-semibold mb-2">📋 Instructions:</div>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Click "Run All Tests" để chạy toàn bộ test suite</li>
          <li>Mở Browser Console (F12) để xem detailed logs</li>
          <li>Kiểm tra màu của từng test: Xanh = Pass, Đỏ = Fail, Vàng = Warning</li>
          <li>Click "View Details" để xem response data chi tiết</li>
          <li>Diagnostics panel hiển thị system state trước và sau tests</li>
        </ol>
      </div>
    </div>
  );
}
