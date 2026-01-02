import Link from "next/link";
import { BrainCircuit, Github } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-gray-900 py-12 border-t border-gray-800 text-gray-400 text-sm">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-teal-500" />
                        <span className="text-lg font-bold text-white">AptiArena</span>
                    </div>

                    {/* Links */}
                    <div className="flex gap-8">
                        <Link href="/terms" className="hover:text-white transition">Privacy & Terms</Link>
                        <Link href="https://github.com/Bharath-Kumar-K-0930/AptiArena/blob/main/LICENSE" target="_blank" className="hover:text-white transition">MIT License</Link>
                        <Link href="mailto:apti.arenahelpdesk@gmail.com" className="hover:text-white transition">Feedback</Link>
                    </div>

                    {/* Social / Repo */}
                    <Link
                        href="https://github.com/Bharath-Kumar-K-0930/AptiArena"
                        target="_blank"
                        className="flex items-center gap-2 hover:text-white transition bg-gray-800 px-4 py-2 rounded-full"
                    >
                        <Github className="h-4 w-4" />
                        <span>View Code</span>
                    </Link>
                </div>

                {/* Copyright & Dev Credit */}
                <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col items-center gap-2">
                    <p>© 2025 AptiArena. All rights reserved.</p>
                    <div className="flex items-center gap-1 text-xs">
                        <span>Developed with ❤️ by</span>
                        <span className="text-teal-400 font-bold">Bharath Kumar K</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
