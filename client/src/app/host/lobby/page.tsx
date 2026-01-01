"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Play, MonitorPlay, Zap, Trophy, ArrowRight, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

export default function LobbyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const quizId = searchParams.get("quizId");

    const [pin, setPin] = useState<string>("");
    const [players, setPlayers] = useState<any[]>([]);
    const [gameMode, setGameMode] = useState("live");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        // Get Host ID from token (mock decode for now, ideally use context)
        // In a real app we'd decode the JWT or fetch user profile first
        // For now, we assume backend validates token on socket connection if we implemented auth middleware there
        // Or we pass token in handshake. 
        // Simpler approach: Just send creating event, backend uses socket.id temporarily or we send decoded ID if available
        // Let's assume we just need to start the flow.

        // Re-connect socket if needed
        if (!socket.connected) socket.connect();

        socket.emit("create_game", { quizId, gameMode });

        socket.on("game_created", (data: any) => {
            setPin(data.pin);
            setIsLoading(false);
        });

        socket.on("player_joined", (data: any) => {
            setPlayers(prev => [...prev, data]);
            toast.success(`${data.name} joined!`);
        });

        socket.on("error", (msg: string) => {
            toast.error(msg);
            setIsLoading(false);
        });

        return () => {
            socket.off("game_created");
            socket.off("player_joined");
            socket.off("error");
        };
    }, [quizId, gameMode, router]);

    const startGame = () => {
        socket.emit("start_game", { pin });
        // Redirect to host control view
        router.push(`/host/live?pin=${pin}&mode=${gameMode}`);
    };

    const copyLink = () => {
        const url = `${window.location.origin}/play?pin=${pin}`;
        navigator.clipboard.writeText(url);
        toast.success("Join link copied!");
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <span className="ml-4 text-xl">Creating Game Lobby...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-[85vh]">

                {/* Left: Game Info & Modes */}
                <div className="flex flex-col gap-6">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white flex items-center gap-2">
                                <MonitorPlay className="text-blue-500" /> Game Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="live" onValueChange={(val) => setGameMode(val)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                                    <TabsTrigger value="live">Live Host</TabsTrigger>
                                    <TabsTrigger value="practice">Practice</TabsTrigger>
                                    <TabsTrigger value="slideshow">Slide Show</TabsTrigger>
                                </TabsList>
                                <div className="mt-4 p-4 bg-gray-800/50 rounded-lg min-h-[120px]">
                                    {gameMode === 'live' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-yellow-500 font-semibold"><Zap size={18} /> Classic Competition</div>
                                            <p className="text-sm text-gray-400">Players answer on their devices. You control the pace. Points for speed and accuracy.</p>
                                        </div>
                                    )}
                                    {gameMode === 'practice' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-green-500 font-semibold"><Trophy size={18} /> Self-Paced</div>
                                            <p className="text-sm text-gray-400">Players go through questions at their own speed. Validation is immediate.</p>
                                        </div>
                                    )}
                                    {gameMode === 'slideshow' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-purple-500 font-semibold"><MonitorPlay size={18} /> Presentation Mode</div>
                                            <p className="text-sm text-gray-400">A non-interactive mode for presenting questions and discussing answers in class.</p>
                                        </div>
                                    )}
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-900/20 border-blue-500/30 flex-1 flex flex-col justify-center items-center text-center p-8">
                        <h2 className="text-xl text-blue-300 uppercase tracking-widest mb-2">Join at aptiarena.com/play</h2>
                        <h1 className="text-8xl font-black text-white tracking-widest my-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            {pin}
                        </h1>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={copyLink} className="gap-2">
                                <Copy size={16} /> Copy Link
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right: Players & QR */}
                <div className="flex flex-col gap-6">
                    <Card className="bg-gray-900 border-gray-800 flex-1 flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="text-green-500" />
                                Players ({players.length})
                            </CardTitle>
                            <div className="bg-white p-2 rounded-lg">
                                <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/play?pin=${pin}`} size={80} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            {players.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-4">
                                    <div className="animate-pulse">Waiting for players to join...</div>
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {players.map((p, i) => (
                                        <div key={i} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xs uppercase">
                                                {p.name.substring(0, 2)}
                                            </div>
                                            <span className="font-medium truncate">{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button
                        size="lg"
                        onClick={startGame}
                        disabled={players.length === 0 && gameMode === 'live'}
                        className="w-full h-16 text-xl bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(22,163,74,0.4)]"
                    >
                        Start Game <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
