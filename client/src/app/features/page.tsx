"use client";

import { Button } from "@/components/ui/button";
import { BrainCircuit, Zap, BarChart, Smartphone, Users, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FeaturesPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <section className="py-20 text-center container mx-auto px-4">
                <h1 className="text-5xl font-extrabold mb-6 space-y-2">
                    <span className="block text-white">The Future of</span>
                    <span className="bg-gradient-to-r from-teal-400 to-gold bg-clip-text text-transparent">Interactive Learning</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                    AptiArena combines advanced AI generation with seamless live hosting to create the ultimate quiz experience.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                        <Button size="lg" className="bg-teal hover:bg-teal/80 text-white px-8 text-lg">
                            {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                        </Button>
                    </Link>
                    <Link href="#details">
                        <Button size="lg" variant="outline" className="text-lg">Learn More</Button>
                    </Link>
                </div>
            </section>

            {/* Feature Grid */}
            <section id="details" className="py-20 bg-card/30">
                <div className="container mx-auto px-4 grid md:grid-cols-3 gap-12">
                    <div className="text-center space-y-4 p-6 rounded-2xl bg-card border border-border hover:border-teal transition-colors">
                        <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto">
                            <BrainCircuit className="h-8 w-8 text-teal" />
                        </div>
                        <h3 className="text-xl font-bold text-white">AI-Powered Creation</h3>
                        <p className="text-muted-foreground">
                            Upload any PDF, PPT, or text document, and our AI will generate a perfect quiz in seconds. No more manual typing.
                        </p>
                    </div>
                    <div className="text-center space-y-4 p-6 rounded-2xl bg-card border border-border hover:border-teal transition-colors">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Zap className="h-8 w-8 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Live Hosting Modes</h3>
                        <p className="text-muted-foreground">
                            Choose between Live Competition, Self-paced Practice, or Presenter-led Slideshow modes to suit any audience.
                        </p>
                    </div>
                    <div className="text-center space-y-4 p-6 rounded-2xl bg-card border border-border hover:border-teal transition-colors">
                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                            <BarChart className="h-8 w-8 text-gold" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Insightful Analytics</h3>
                        <p className="text-muted-foreground">
                            Track performance with detailed reports. Identify knowledge gaps and celebrate top performers with leaderboards.
                        </p>
                    </div>
                </div>
            </section>

            {/* Detailed Sections */}
            <section className="py-24 container mx-auto px-4 space-y-32">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold text-white">Hosting made simple</h2>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-4 text-lg text-gray-300">
                                <Smartphone className="text-teal" /> works on any device (Mobile/Desktop)
                            </li>
                            <li className="flex items-center gap-4 text-lg text-gray-300">
                                <Globe className="text-teal" /> No app download required
                            </li>
                            <li className="flex items-center gap-4 text-lg text-gray-300">
                                <Users className="text-teal" /> Scales to 100+ concurrent players
                            </li>
                        </ul>
                    </div>
                    {/* Interactive Mock Visual */}
                    <div className="flex-1 min-h-[500px] relative flex items-center justify-center">
                        {/* Blob Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-purple-600/20 rounded-full blur-3xl opacity-50 animate-pulse" />

                        {/* Mock Phone UI */}
                        <div className="relative w-64 h-[500px] bg-gray-900 border-4 border-gray-800 rounded-[3rem] shadow-2xl overflow-hidden transform rotate-[-5deg] hover:rotate-0 transition-all duration-500">
                            {/* Phone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20" />

                            {/* Screen Content */}
                            <div className="h-full w-full bg-gray-950 p-6 flex flex-col items-center pt-16 relative z-10">
                                {/* Logo */}
                                <div className="text-teal font-bold text-xl mb-8 flex items-center gap-2">
                                    <BrainCircuit className="h-6 w-6" /> AptiArena
                                </div>

                                {/* Join Card */}
                                <div className="w-full bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400 uppercase tracking-widest text-center">Enter Game PIN</div>
                                        <div className="h-12 bg-black border border-gray-700 rounded-lg flex items-center justify-center text-2xl font-mono text-white tracking-[0.5em] animate-pulse">
                                            3948
                                        </div>
                                    </div>
                                    <div className="h-10 bg-teal rounded-lg w-full flex items-center justify-center font-bold text-gray-900 shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                                        Join
                                    </div>
                                </div>

                                {/* Participants Bubble */}
                                <div className="mt-8 flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-6 h-6 rounded-full border-2 border-gray-900 bg-gradient-to-br ${i === 1 ? 'from-purple-500 to-indigo-500' : i === 2 ? 'from-teal-500 to-green-500' : 'from-pink-500 to-red-500'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-300 font-medium">24 joined</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute top-10 right-10 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-xl animate-bounce">
                            <Zap className="text-yellow-400 h-6 w-6" fill="currentColor" />
                        </div>
                        <div className="absolute bottom-20 left-10 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-xl animate-[bounce_3s_infinite]">
                            <BarChart className="text-purple-400 h-6 w-6" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
