"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrainCircuit, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [user, setUser] = useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Check auth status
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setIsMenuOpen(false); // Close menu on route change
    }, [pathname]);

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

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/quizzes" className="hover:text-white transition">Explore Quizzes</Link>
                    <Link href="/features" className="hover:text-white transition">Features</Link>
                    <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4">
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

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden border-t border-border bg-slate-950 overflow-hidden"
                    >
                        <div className="flex flex-col p-4 space-y-4">
                            {user && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 mb-2">
                                    <span className="text-xs text-muted-foreground">Signed in as</span>
                                    <span className="text-sm font-medium text-teal-300">{user.username}</span>
                                </div>
                            )}
                            <Link href="/quizzes" className="text-muted-foreground hover:text-white py-2 block">Explore Quizzes</Link>
                            <Link href="/features" className="text-muted-foreground hover:text-white py-2 block">Features</Link>
                            <Link href="/pricing" className="text-muted-foreground hover:text-white py-2 block">Pricing</Link>
                            <div className="h-px bg-white/10 my-2" />
                            {user ? (
                                <>
                                    <Link href="/dashboard">
                                        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                                            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                                        </Button>
                                    </Link>
                                    <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </Button>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <Link href="/login">
                                        <Button variant="ghost" className="w-full">Login</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button className="w-full bg-teal">Get Started</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
