"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ParticipantArena from "@/components/Arena/ParticipantArena";

function PlayContent() {
    const searchParams = useSearchParams();
    const pin = searchParams.get("code") || "";

    return (
        <ParticipantArena initialPin={pin} />
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <div className="w-16 h-16 border-t-4 border-teal-500 border-solid rounded-full animate-spin mb-4" />
                <h1 className="text-xl font-black uppercase tracking-[0.3em] animate-pulse">Initializing Arena</h1>
                <p className="text-slate-500 text-xs font-medium mt-2">Syncing with combat servers...</p>
            </div>
        }>
            <PlayContent />
        </Suspense>
    )
}
