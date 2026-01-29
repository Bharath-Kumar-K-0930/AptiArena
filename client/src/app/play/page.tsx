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
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Arena...</div>}>
            <PlayContent />
        </Suspense>
    )
}
