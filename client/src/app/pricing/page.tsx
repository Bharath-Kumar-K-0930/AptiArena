import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-muted-foreground">Start for free, upgrade as you grow.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-card border border-border rounded-2xl p-8 flex flex-col relative overflow-hidden">
                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold text-white">Starter</h3>
                            <div className="text-4xl font-extrabold text-white">$0 <span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                            <p className="text-muted-foreground">Perfect for trying out the platform.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> 5 Quizzes per month</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> up to 20 Players per game</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> Basic AI Generation</li>
                            <li className="flex items-center gap-3 text-sm opacity-50"><X className="h-5 w-5" /> Export Reports</li>
                            <li className="flex items-center gap-3 text-sm opacity-50"><X className="h-5 w-5" /> Priority Support</li>
                        </ul>
                        <Link href="/register">
                            <Button className="w-full bg-white/10 hover:bg-white/20 text-white">Get Started</Button>
                        </Link>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-card border-2 border-teal rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-teal/20">
                        <div className="absolute top-0 right-0 bg-teal text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold text-teal">Pro Host</h3>
                            <div className="text-4xl font-extrabold text-white">$12 <span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                            <p className="text-muted-foreground">For educators and regular hosts.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> Unlimited Quizzes</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> up to 100 Players per game</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> Advanced AI (PDF/PPT)</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> Detailed Analytics & Exports</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-teal" /> Slide Show Mode</li>
                        </ul>
                        <Link href="/register">
                            <Button className="w-full bg-teal hover:bg-teal/80 text-white shadow-lg">Start Free Trial</Button>
                        </Link>
                    </div>

                    {/* Enterprise/School Tier */}
                    <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
                        <div className="space-y-4 mb-8">
                            <h3 className="text-2xl font-bold text-white">Institution</h3>
                            <div className="text-4xl font-extrabold text-white">Custom</div>
                            <p className="text-muted-foreground">For schools and large organizations.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-gold" /> All Pro features</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-gold" /> 500+ Players support</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-gold" /> SSO Integration</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-gold" /> Dedicated Success Manager</li>
                            <li className="flex items-center gap-3 text-sm"><Check className="h-5 w-5 text-gold" /> Custom Branding</li>
                        </ul>
                        <Link href="/contact">
                            <Button className="w-full bg-white/10 hover:bg-white/20 text-white">Contact Sales</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
