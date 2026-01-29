"use client";

import { useParams, useRouter } from "next/navigation";
import HostArena from "@/components/Arena/HostArena";
import ParticipantArena from "@/components/Arena/ParticipantArena";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { Monitor, Smartphone, Layout, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="h-screen bg-black flex flex-col overflow-hidden">
            {/* Simulation Header */}
            <div className="h-12 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-400 hover:text-white h-8 px-2">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div className="h-4 w-px bg-white/10" />
                    <h1 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layout className="h-4 w-4 text-teal-400" />
                        Practice Simulation
                    </h1>
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    AptiArena Engine v2.0
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Host Column (Desktop) */}
                <div className="flex-1 flex flex-col border-r border-white/10 bg-slate-950 p-6 overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 text-slate-500">
                        <Monitor className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Host Dashboard (Desktop)</span>
                    </div>
                    <div className="flex-1 bg-black rounded-2xl shadow-2xl border border-white/5 overflow-hidden flex flex-col">
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
                <div className="w-[450px] bg-slate-900 flex flex-col p-6 items-center shrink-0 border-l border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-slate-500 self-start">
                        <Smartphone className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Mock Device (Mobile)</span>
                    </div>

                    {/* Mobile Frame */}
                    <div className="h-full max-h-[750px] w-full max-w-[340px] bg-slate-800 rounded-[3.5rem] p-3 border-4 border-slate-700 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative flex flex-col">
                        {/* Selfie Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                            <div className="w-10 h-1 bg-slate-900 rounded-full" />
                        </div>

                        <div className="flex-1 bg-slate-950 rounded-[2.8rem] overflow-hidden border border-white/5">
                            {pin ? (
                                <ParticipantArena initialPin={pin} initialName="Trainee" isSimulation={true} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-[10px] font-black uppercase tracking-widest bg-black">
                                    Awaiting Host PIN...
                                </div>
                            )}
                        </div>

                        {/* Screen Indicator Bottom */}
                        <div className="h-8 flex items-center justify-center">
                            <div className="w-20 h-1 bg-slate-700 rounded-full" />
                        </div>
                    </div>

                    <div className="mt-8 text-center px-4">
                        <h4 className="text-white text-xs font-bold mb-1">Interactive Simulation</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                            This side represents the student&apos;s mobile app. Submit answers here to see how stats update on the host screen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
