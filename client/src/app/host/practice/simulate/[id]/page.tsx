"use client";

import { useParams, useRouter } from "next/navigation";
import HostArena from "@/components/Arena/HostArena";
import ParticipantArena from "@/components/Arena/ParticipantArena";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { Monitor, Smartphone, Layout, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PracticeSimulatePage() {
    const { id } = useParams();
    const router = useRouter();
    const [pin, setPin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        const userData = JSON.parse(userStr || "{}");
        if (!userData.id && !userData._id) {
            toast.error("Please login to host a session");
            router.push("/login");
            return;
        }
        setUser(userData);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-teal-400 gap-4">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold tracking-widest text-sm uppercase">Booting Arena Simulation...</span>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] bg-black flex flex-col overflow-hidden">
            {/* Simulation Header */}
            <div className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-white hover:bg-white/5 h-9 px-3 rounded-xl transition-all"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Button>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                            <Layout className="h-3.5 w-3.5 text-teal-400" />
                            Interactive Arena Simulation
                        </h1>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">System Status: Operative • Engine v2.4</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Host Logic Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Sync Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden bg-slate-950">
                {/* Host Column (Desktop) */}
                <div className="flex-[1.2] flex flex-col p-4 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />

                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2.5 text-slate-500">
                            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                                <Monitor className="h-3 w-3" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Primary Host Interface</span>
                        </div>
                        <div className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-md text-[8px] font-bold text-teal-400 uppercase tracking-tighter">Desktop View</div>
                    </div>

                    <div className="flex-1 bg-black rounded-[1.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col relative z-10 group transition-all hover:border-white/10">
                        <HostArena
                            quizId={id as string}
                            hostId={user?.id || user?._id}
                            mode="practice"
                            onEnd={() => router.push('/dashboard')}
                            onGameCreated={(p) => setPin(p)}
                        />
                    </div>
                </div>

                {/* Participant Column (Mobile) */}
                <div className="flex-1 bg-slate-900 flex flex-col p-4 items-center shrink-0 border-l border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,1),rgba(2,6,23,1))]" />

                    <div className="w-full flex items-center justify-between mb-3 px-1 relative z-10">
                        <div className="flex items-center gap-2.5 text-slate-500">
                            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                                <Smartphone className="h-3 w-3" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Participant Mockup</span>
                        </div>
                        <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Mobile Dev</div>
                    </div>

                    {/* Mobile Frame Container */}
                    <div className="flex-1 w-full flex items-center justify-center relative z-10 py-4 scale-90 origin-top">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-[min(99%,900px)] w-[320px] bg-slate-800 rounded-[3.5rem] p-3 border-[6px] border-slate-700 shadow-[0_0_80px_rgba(0,0,0,0.7)] relative flex flex-col group transition-all hover:border-slate-600"
                        >
                            {/* Selfie Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-3xl z-50 flex items-center justify-center border-x border-b border-slate-700/50">
                                <div className="w-12 h-1.5 bg-slate-900 rounded-full shadow-inner" />
                            </div>

                            <div className="flex-1 bg-slate-950 rounded-[2.8rem] overflow-hidden border border-white/5 relative">
                                {pin ? (
                                    <ParticipantArena key={pin} initialPin={pin} initialName="Trainee" isSimulation={true} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 bg-black">
                                        <div className="w-6 h-6 border-2 border-slate-800 border-t-slate-500 rounded-full animate-spin" />
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Syncing...</span>
                                    </div>
                                )}
                            </div>

                            {/* Home Indicator */}
                            <div className="h-8 flex items-center justify-center">
                                <div className="w-20 h-1.5 bg-slate-700/50 rounded-full" />
                            </div>
                        </motion.div>
                    </div>

                    <div className="mt-2 text-center px-6 relative z-10 max-w-xs scale-90 origin-top">
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">
                            Simulate the <span className="text-white">Gladiator Experience</span>.
                            <span className="block mt-0.5 text-[9px] text-slate-500 font-medium">Synced with Host Dashboard.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
