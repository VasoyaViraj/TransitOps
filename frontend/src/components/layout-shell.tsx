import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  Truck,
  Users,
  Compass,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Menu,
  X
} from "lucide-react";

export const LayoutShell: React.FC = () => {
  const { user, logout, hasPermission, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      label: "Fleet",
      path: "/fleet",
      icon: Truck,
      allowed: isAdmin || hasPermission("fleet", "VIEW"),
    },
    {
      label: "Drivers",
      path: "/drivers",
      icon: Users,
      allowed: isAdmin || hasPermission("drivers", "VIEW"),
    },
    {
      label: "Trips",
      path: "/trips",
      icon: Compass,
      allowed: isAdmin || hasPermission("trips", "VIEW"),
    },
    {
      label: "Maintenance",
      path: "/maintenance",
      icon: Wrench,
      allowed: isAdmin || hasPermission("maintenance", "VIEW"),
    },
    {
      label: "Fuel & Expenses",
      path: "/expenses",
      icon: Fuel,
      allowed: isAdmin || hasPermission("fuelExpenses", "VIEW"),
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      allowed: isAdmin || hasPermission("analytics", "VIEW"),
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
      // Settings accessible to all, but RBAC matrix only shown to Admin
      allowed: true,
    },
  ];

  const formatRole = (role: string) => {
    if (role === "ADMIN") return "Admin";
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const SidebarContent = () => (
    <>
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {navItems
          .filter((item) => item.allowed)
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-[#171717] font-semibold"
                    : "text-gray-500 hover:text-[#171717] hover:bg-gray-50"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-[#3ecf8e]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
      </div>

      <div className="p-4 border-t border-[#dfdfdf] bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-[#171717] font-bold text-sm">
            {user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <span className="block text-xs font-semibold text-[#171717] truncate">{user?.name}</span>
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 border ${
              isAdmin
                ? "bg-purple-50 border-purple-100 text-purple-600"
                : "bg-white border-gray-200 text-gray-500"
            }`}>
              {user ? formatRole(user.role) : ""}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-md text-xs font-semibold text-gray-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] flex text-[#171717]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-[#dfdfdf] flex-shrink-0">
        <div className="p-6 border-b border-[#dfdfdf] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" className="h-autow-auto"/>
          </Link>
        </div>
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-[64px] bg-white border-b border-[#dfdfdf] flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-[#171717] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative max-w-[280px] w-full hidden sm:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-[#fafafa] text-xs pl-9 pr-4 py-2 rounded-md border border-[#dfdfdf] focus:border-[#3ecf8e] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700 hidden sm:block">{user?.name}</span>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isAdmin
                ? "bg-purple-50 border-purple-100 text-purple-600"
                : "bg-emerald-50 border-emerald-100 text-[#24b47e]"
            }`}>
              {user ? formatRole(user.role) : ""}
            </span>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black z-40 md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="fixed top-0 bottom-0 left-0 w-[280px] bg-white border-r border-[#dfdfdf] z-50 md:hidden flex flex-col"
              >
                <div className="p-6 border-b border-[#dfdfdf] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src="/logo.png" className="h-autow-auto"/>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
