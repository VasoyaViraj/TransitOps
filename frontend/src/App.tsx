import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./components/protected-route";
import { LayoutShell } from "./components/layout-shell";
import { Login } from "./pages/login";
import { Dashboard } from "./pages/dashboard";
import { Fleet } from "./pages/fleet";
import { Drivers } from "./pages/drivers";
import { Trips } from "./pages/trips";
import { Maintenance } from "./pages/maintenance";
import { Expenses } from "./pages/expenses";
import { Analytics } from "./pages/analytics";
import { Settings } from "./pages/settings";
import { Kanban } from "./pages/kanban";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontSize: "13px",
                fontWeight: 500,
                background: "#171717",
                color: "#fff",
                borderRadius: "8px",
              },
              success: {
                iconTheme: { primary: "#3ecf8e", secondary: "#171717" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
                style: { background: "#fff", color: "#171717", border: "1px solid #fee2e2" },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <LayoutShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />

              <Route
                path="fleet"
                element={
                  <ProtectedRoute permission={{ module: "fleet", level: "VIEW" }}>
                    <Fleet />
                  </ProtectedRoute>
                }
              />

              <Route
                path="drivers"
                element={
                  <ProtectedRoute permission={{ module: "drivers", level: "VIEW" }}>
                    <Drivers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="trips"
                element={
                  <ProtectedRoute permission={{ module: "trips", level: "VIEW" }}>
                    <Trips />
                  </ProtectedRoute>
                }
              />

              <Route
                path="maintenance"
                element={
                  <ProtectedRoute permission={{ module: "maintenance", level: "VIEW" }}>
                    <Maintenance />
                  </ProtectedRoute>
                }
              />

              <Route
                path="expenses"
                element={
                  <ProtectedRoute permission={{ module: "fuelExpenses", level: "VIEW" }}>
                    <Expenses />
                  </ProtectedRoute>
                }
              />

              <Route
                path="analytics"
                element={
                  <ProtectedRoute permission={{ module: "analytics", level: "VIEW" }}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              <Route
                path="kanban"
                element={
                  <ProtectedRoute>
                    <Kanban />
                  </ProtectedRoute>
                }
              />

              {/* Settings accessible to all authenticated users */}
              <Route path="settings" element={<Settings />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
