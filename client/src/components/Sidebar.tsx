"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, History, BarChart2, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Hydration safe user fetching
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

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

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16">
            <div className="p-6">
                <h2 className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-4">Host Menu</h2>
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
            </div>

            <div className="mt-auto border-t border-gray-800">
                <div className="p-4">
                    {user && (
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center text-teal font-bold border border-teal/30">
                                {user.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user.username || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email || "user@example.com"}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
}
