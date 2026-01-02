"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, History, BarChart2, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        // Hydration safe user fetching
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const links = [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/quiz/create", label: "Create Quiz", icon: PlusCircle },
        { href: "/dashboard/quizzes", label: "My Quizzes", icon: History },
        { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const UserProfile = () => (
        <div className="mt-auto p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center font-bold text-white uppercase">
                    {user?.name?.[0] || "U"}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium w-full"
            >
                <LogOut className="h-4 w-4" />
                Sign Out
            </button>
        </div>
    );

    const NavLinks = () => (
        <nav className="space-y-2">
            {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive
                                ? "bg-teal/10 text-teal hover:bg-teal/20"
                                : "text-gray-400 hover:text-white hover:bg-gray-800"
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="rounded-full h-14 w-14 shadow-2xl bg-teal-500 hover:bg-teal-600 text-white p-0 flex items-center justify-center"
                >
                    {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16">
                <div className="p-6 flex-1">
                    <h2 className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-4">Host Menu</h2>
                    <NavLinks />
                </div>
                <UserProfile />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-gray-900 border-r border-gray-800 z-50 md:hidden flex flex-col pt-20"
                        >
                            <div className="p-6 flex-1 overflow-y-auto">
                                <h2 className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-4">Menu</h2>
                                <NavLinks />
                            </div>
                            <UserProfile />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
