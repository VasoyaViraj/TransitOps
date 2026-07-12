import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import type { UserPermissions } from "../hooks/use-auth";
import { ShieldAlert, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: {
    module: keyof UserPermissions;
    level: "VIEW" | "EDIT";
  };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin mb-4" />
        <span className="text-sm font-semibold text-gray-500">Loading TransitOps...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission.module, permission.level)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E2E8F0] rounded-lg">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-[400px]">
          Your user role does not have permission to access the <strong>{permission.module}</strong> module.
          Please contact your administrator if you need access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
