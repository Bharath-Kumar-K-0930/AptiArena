"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrainCircuit, LayoutDashboard, LogOut } from "lucide-react";

export default function Navbar() {
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Check auth status
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
    }, [pathname]); // Re-check on route change

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/");
    };

    return (
        <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <BrainCircuit className="h-8 w-8 text-teal" />
                        <span className="text-xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-200 bg-clip-text text-transparent tracking-wide drop-shadow-sm">
                            AptiArena
                        </span>
                    </Link>
                    {user && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <span className="text-xs text-muted-foreground">Welcome,</span>
                            <span className="text-sm font-medium text-teal-300">{user.username}</span>
                        </div>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/quizzes" className="hover:text-white transition">Explore Quizzes</Link>
                    <Link href="/features" className="hover:text-white transition">Features</Link>
                    <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link href="/dashboard">
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleLogout}
                                className="flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-teal hover:bg-teal/80 text-white">Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
