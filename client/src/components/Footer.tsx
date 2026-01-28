"use client";

import Link from "next/link";
import { BrainCircuit, Github, Instagram, Mail, Linkedin } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();

    // Routes where the footer should be HIDDEN
    const hideFooterRoutes = [
        "/dashboard",           // Overview
        "/dashboard/quizzes",   // My Quizzes
        "/dashboard/analytics", // Analytics
        "/quiz/create",         // Create Quiz
    ];

    // Check if current path starts with /host (Hosting screens)
    const isHosting = pathname?.startsWith("/host");

    // Check if it's one of the specific dashboard routes to hide
    const isDashboardToHide = hideFooterRoutes.includes(pathname || "");

    if (isDashboardToHide || isHosting) {
        return null;
    }

    return (
        <footer className="bg-gray-900 pt-10 pb-6 border-t border-gray-800 text-gray-400 text-sm">
            <div className="container mx-auto px-4">

                {/* Main Row: Brand, Links, View Code */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-teal-500" />
                        <span className="text-xl font-bold text-white">AptiArena</span>
                    </div>

                    {/* Main Links */}
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
                        <Link href="/terms" className="hover:text-white transition-colors">Privacy & Terms</Link>
                        <Link href="https://github.com/Bharath-Kumar-K-0930/AptiArena/blob/main/LICENSE" target="_blank" className="hover:text-white transition-colors">MIT License</Link>
                        <Link href="mailto:apti.arenahelpdesk@gmail.com" className="hover:text-white transition-colors">Feedback</Link>
                    </div>

                    {/* Social / Repo */}
                    <Link
                        href="https://github.com/Bharath-Kumar-K-0930/AptiArena"
                        target="_blank"
                        className="flex items-center gap-2 hover:text-white transition-all bg-gray-800/50 hover:bg-gray-800 px-5 py-2 rounded-full border border-gray-700"
                    >
                        <Github className="h-4 w-4" />
                        <span className="font-semibold text-xs">View Code</span>
                    </Link>
                </div>

                {/* Connect Section - Compact & Below Links */}
                <div className="flex flex-col items-center py-8 border-t border-gray-800/50">
                    <div className="text-center mb-4">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-1">
                            Connect With Us
                        </h3>
                        <p className="text-gray-500 text-[10px] max-w-md mx-auto">
                            Join our community and stay updated with the latest news
                        </p>
                    </div>

                    <div className="flex justify-center gap-8">
                        {/* Instagram */}
                        <Link href="https://instagram.com/bhar_ath.b.k" target="_blank" className="group flex flex-col items-center gap-1.5">
                            <div className="text-gray-500 group-hover:text-[#E1306C] transition-colors">
                                <Instagram className="h-5 w-5" />
                            </div>
                            <span className="text-[8px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">Instagram</span>
                        </Link>

                        {/* Email */}
                        <Link href="mailto:apti.arenahelpdesk@gmail.com" className="group flex flex-col items-center gap-1.5">
                            <div className="text-gray-500 group-hover:text-[#EA4335] transition-colors">
                                <Mail className="h-5 w-5" />
                            </div>
                            <span className="text-[8px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">Email</span>
                        </Link>

                        {/* GitHub */}
                        <Link href="https://github.com/Bharath-Kumar-K-0930" target="_blank" className="group flex flex-col items-center gap-1.5">
                            <div className="text-gray-500 group-hover:text-white transition-colors">
                                <Github className="h-5 w-5" />
                            </div>
                            <span className="text-[8px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">GitHub</span>
                        </Link>

                        {/* LinkedIn */}
                        <Link href="https://www.linkedin.com/in/bharath-kumar-k-b35ba0304" target="_blank" className="group flex flex-col items-center gap-1.5">
                            <div className="text-gray-500 group-hover:text-[#0077b5] transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </div>
                            <span className="text-[8px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">LinkedIn</span>
                        </Link>
                    </div>
                </div>

                {/* Copyright & Dev Credit */}
                <div className="pt-4 border-t border-gray-800 flex flex-col items-center gap-1.5">
                    <p className="text-gray-600 text-[9px]">© 2025 AptiArena. All rights reserved.</p>
                    <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-gray-700">
                        <span>Developed with</span>
                        <span className="text-red-500 animate-pulse">❤️</span>
                        <span>by</span>
                        <span className="text-teal-500 font-black">Bharath Kumar K</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
