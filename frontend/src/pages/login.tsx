import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, UserCheck, AlertCircle } from "lucide-react";

const ROLE_CREDENTIALS: Record<string, { email: string; label: string }> = {
  ADMIN: { email: "admin@transitops.com", label: "Admin" },
  FLEET_MANAGER: { email: "fleet@transitops.com", label: "Fleet Manager" },
  DISPATCHER: { email: "dispatch@transitops.com", label: "Dispatcher" },
  SAFETY_OFFICER: { email: "safety@transitops.com", label: "Safety Officer" },
  FINANCIAL_ANALYST: { email: "analyst@transitops.com", label: "Financial Analyst" },
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@transitops.com");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<string>("ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ email, password, role });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid email, password, or role selection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
    const cred = ROLE_CREDENTIALS[selectedRole];
    if (cred) {
      setEmail(cred.email);
      setPassword(selectedRole === "ADMIN" ? "admin123" : "password123");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#ffffff]">
      {/* Left panel */}
      <div className="w-full md:w-[42%] bg-[#0F172A] text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="w-full h-full border-r border-b border-white/20 grid grid-cols-6 grid-rows-6" />
        </div>

        <div className="z-10">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#2563EB]" />
            <span className="text-2xl font-bold tracking-tight">
              Transit<span className="text-[#2563EB]">Ops</span>
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-2 font-medium">Smart Transport Operations Platform</p>
        </div>

        <div className="my-auto py-12 md:py-0 z-10">
          <h2 className="text-xl font-semibold mb-6 tracking-wide">Five roles, one platform:</h2>
          <ul className="space-y-4">
            {Object.entries(ROLE_CREDENTIALS).map(([key, val]) => (
              <li key={key} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-2 flex-shrink-0" />
                <div>
                  <span className="font-medium text-sm text-gray-200 block">{val.label}</span>
                  <span className="text-xs text-gray-400">{val.email}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="z-10 text-[10px] text-gray-500 tracking-wider font-semibold">
          TRANSITOPS © 2026 — RBAC ENABLED
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-[58%] flex items-center justify-center p-8 md:p-16 bg-[#ffffff]">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-sm">Authentication Error</h5>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
                Role
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-white text-[#0F172A] text-sm pl-10 pr-4 py-2.5 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors appearance-none cursor-pointer"
                >
                  {Object.entries(ROLE_CREDENTIALS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white text-[#0F172A] text-sm pl-10 pr-4 py-2.5 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white text-[#0F172A] text-sm pl-10 pr-4 py-2.5 rounded-md border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm py-2.5 rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-500">
            <span className="font-semibold text-gray-700 block mb-1">Demo credentials (password: admin123 / password123):</span>
            <ul className="space-y-1 list-disc pl-4 text-gray-500">
              <li>Admin → Full access + RBAC management</li>
              <li>Fleet Manager → Fleet &amp; Maintenance</li>
              <li>Dispatcher → Trips &amp; Drivers</li>
              <li>Safety Officer → Drivers, Maintenance view</li>
              <li>Financial Analyst → Expenses &amp; Analytics</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
