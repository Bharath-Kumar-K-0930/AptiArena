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
                    <div className="flex-1 space-y-6">
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
                    <div className="flex-1 h-64 bg-gradient-to-br from-teal/20 to-purple-500/20 rounded-2xl border border-white/10 flex items-center justify-center">
                        <span className="text-muted-foreground italic">Interactive Demo Visual Placeholder</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
