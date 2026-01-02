"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, StopCircle, BarChart3, Users, Zap, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function HostLiveContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pin = searchParams.get("pin");
    const mode = searchParams.get("mode") || "live";

    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [qIndex, setQIndex] = useState(0);
    const [totalQ, setTotalQ] = useState(0);
    const [answerCount, setAnswerCount] = useState(0);

    // Phases: 'question' | 'reveal' | 'leaderboard' | 'finished'
    const [phase, setPhase] = useState("question");

    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [timer, setTimer] = useState(30);
    const [cheerMessage, setCheerMessage] = useState("");

    const CHEERS = [
        "Unstoppable! 🔥",
        "Pure Genius! 🧠",
        "Crushing it! 💥",
        "Way to go! 🚀",
        "On Fire! ⭐",
        "Knowledge Bomb! 💣",
        "Too easy? 😏",
        "Legendary! 🏆"
    ];

    useEffect(() => {
        if (!socket.connected) socket.connect();

        // Listen for events
        socket.on("new_question", (data: any) => {
            setCurrentQuestion(data.question);
            setQIndex(data.index);
            setTotalQ(data.total);
            setAnswerCount(0);
            setPhase("question");
            setTimer(data.question.timeLimit || 30);
        });

        socket.on("player_answered", (data: any) => {
            setAnswerCount(prev => prev + data.count);
        });

        socket.on("leaderboard_update", (data: any) => {
            setLeaderboard(data.leaderboard);
            setPhase("leaderboard");
        });

        socket.on("game_over", (data: any) => {
            setPhase("finished");
            setLeaderboard(data.leaderboard);
        });

        return () => {
            socket.off("new_question");
            socket.off("player_answered");
            socket.off("leaderboard_update");
            socket.off("game_over");
        };
    }, []);

    // Timer effect
    useEffect(() => {
        if (mode === "live" && timer > 0 && phase === 'question') {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && phase === 'question' && mode === 'live') {
            handleReveal(); // Auto reveal when time is up
        }
    }, [timer, phase, mode]);

    const handleReveal = () => {
        setPhase("reveal");
        setCheerMessage(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
        socket.emit("reveal_answer", { pin });
    };

    const handleShowLeaderboard = () => {
        socket.emit("show_leaderboard", { pin });
    };

    const nextQuestion = () => {
        socket.emit("next_question", { pin });
    };

    const endGame = () => {
        router.push("/dashboard");
    };

    if (phase === "finished") {
        return (
            <div className="min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-4 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black" />

                {/* Podium Animation */}
                <div className="relative z-10 w-full max-w-4xl flex items-end justify-center gap-4 h-[500px] mb-12">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "40%", opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="w-1/4 bg-gray-800 rounded-t-lg border-t-4 border-gray-500 relative flex flex-col items-center justify-end p-4 shadow-[0_0_50px_rgba(107,114,128,0.3)]"
                        >
                            <div className="absolute -top-16 text-center w-full">
                                <div className="h-12 w-12 rounded-full bg-gray-500 flex items-center justify-center font-bold text-xl mb-2 mx-auto ring-4 ring-gray-800 text-white">{leaderboard[1].name[0]}</div>
                                <div className="font-bold text-gray-400 truncate w-full">{leaderboard[1].name}</div>
                                <div className="text-sm text-gray-500">{leaderboard[1].score} pts</div>
                            </div>
                            <div className="text-6xl font-black text-gray-700/50">2</div>
                        </motion.div>
                    )}

                    {/* 1st Place */}
                    {leaderboard[0] && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "60%", opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="w-1/3 bg-yellow-600 rounded-t-lg border-t-4 border-yellow-300 relative flex flex-col items-center justify-end p-4 shadow-[0_0_100px_rgba(234,179,8,0.5)] z-20"
                        >
                            <div className="absolute -top-24 text-center w-full">
                                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2 animate-bounce" />
                                <div className="h-16 w-16 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-2xl mb-2 mx-auto ring-4 ring-yellow-600 text-black">{leaderboard[0].name[0]}</div>
                                <div className="font-bold text-yellow-200 text-xl truncate w-full">{leaderboard[0].name}</div>
                                <div className="text-lg text-yellow-300/80">{leaderboard[0].score} pts</div>
                            </div>
                            <div className="text-8xl font-black text-yellow-800/50">1</div>
                        </motion.div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "30%", opacity: 1 }}
                            transition={{ delay: 1, duration: 0.8 }}
                            className="w-1/4 bg-orange-800 rounded-t-lg border-t-4 border-orange-500 relative flex flex-col items-center justify-end p-4 shadow-[0_0_50px_rgba(249,115,22,0.3)]"
                        >
                            <div className="absolute -top-16 text-center w-full">
                                <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xl mb-2 mx-auto ring-4 ring-orange-800 text-white">{leaderboard[2].name[0]}</div>
                                <div className="font-bold text-orange-400 truncate w-full">{leaderboard[2].name}</div>
                                <div className="text-sm text-orange-500">{leaderboard[2].score} pts</div>
                            </div>
                            <div className="text-6xl font-black text-orange-900/50">3</div>
                        </motion.div>
                    )}
                </div>

                <div className="relative z-10 w-full max-w-2xl bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="p-4 bg-gray-800/50 border-b border-gray-700 font-bold text-center text-white">Full Leaderboard</div>
                    <div className="max-h-64 overflow-y-auto p-2">
                        {leaderboard.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg border-b border-white/5 last:border-0 text-gray-300">
                                <div className="flex items-center gap-4">
                                    <span className={`font-mono font-bold w-6 ${i < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>#{i + 1}</span>
                                    <span>{p.name}</span>
                                </div>
                                <span className="font-mono text-teal-400">{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Button onClick={endGame} className="mt-8 relative z-10 bg-white text-black hover:bg-gray-200">Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium tracking-wider">GAME PIN</span>
                        <span className="text-2xl font-black text-white tracking-widest">{pin}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-700 mx-2" />
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-400" />
                        <span className="font-bold text-lg">{answerCount}</span>
                    </div>
                </div>

                {/* Timer */}
                {phase === 'question' && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-2">
                        <div className={`h-12 w-20 rounded-xl flex items-center justify-center text-3xl font-black ${timer <= 5 ? 'bg-red-500 animate-pulse' : 'bg-gray-800'}`}>
                            {timer}
                        </div>
                    </div>
                )}

                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={endGame}>
                    <StopCircle className="mr-2 h-4 w-4" /> End Game
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">

                {/* Question Display */}
                <div className="flex-1 flex flex-col justify-center mb-12 relative">
                    {/* Cheering Overlay */}
                    <AnimatePresence>
                        {phase === 'reveal' && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                className="absolute top-0 right-0 z-20 pointer-events-none"
                            >
                                <div className="bg-yellow-400 text-black font-black text-4xl px-8 py-4 rounded-full rotate-12 shadow-[0_0_50px_rgba(250,204,21,0.6)]">
                                    {cheerMessage}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {phase === 'leaderboard' ? (
                        <Card className="bg-slate-900 border-slate-800 flex-1 flex flex-col">
                            <CardHeader className="text-center">
                                <CardTitle className="text-3xl bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">Top 5 Leaders</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center gap-4 max-w-3xl mx-auto w-full">
                                {leaderboard.map((p, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 flex items-center justify-center rounded-full font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-500 text-black' : 'bg-slate-700 text-white'}`}>
                                                {i + 1}
                                            </div>
                                            <span className="text-xl font-bold text-white">{p.name}</span>
                                        </div>
                                        <span className="text-2xl font-mono text-teal-400">{p.score}</span>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : currentQuestion && (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-sm font-medium border border-slate-700">
                                    Question {qIndex + 1} of {totalQ}
                                </span>
                                <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-5xl mx-auto text-white">
                                    {currentQuestion.text}
                                </h1>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto w-full">
                                {currentQuestion.options.map((opt: any, i: number) => {
                                    const isRevealed = phase === 'reveal';
                                    const isCorrect = opt.isCorrect;

                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                relative p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4
                                                ${isRevealed && isCorrect
                                                    ? 'bg-green-500/10 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]'
                                                    : isRevealed && !isCorrect
                                                        ? 'bg-slate-900 border-slate-800 opacity-50'
                                                        : 'bg-slate-900 border-slate-800'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold
                                                ${isRevealed && isCorrect ? 'bg-green-500 text-black' : 'bg-slate-800 text-slate-400'}
                                            `}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className={`text-xl font-medium ${isRevealed && isCorrect ? 'text-green-400' : 'text-gray-300'}`}>
                                                {opt.text}
                                            </span>
                                            {isRevealed && isCorrect && <CheckCircle className="ml-auto w-6 h-6 text-green-500" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="h-20 flex items-center justify-between border-t border-gray-800 pt-4">
                    <div className="flex items-center gap-2">
                        <Zap className="text-yellow-400" />
                        <span className="text-gray-400 font-medium">Host Controls</span>
                    </div>

                    <div className="flex gap-4">
                        {phase === 'question' && (
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white min-w-[200px]" onClick={handleReveal}>
                                Reveal Answer
                            </Button>
                        )}
                        {phase === 'reveal' && (
                            <Button size="lg" className="bg-purple-600 hover:bg-purple-500 text-white min-w-[200px]" onClick={handleShowLeaderboard}>
                                Show Leaderboard
                                <BarChart3 className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        {phase === 'leaderboard' && (
                            <Button size="lg" className="bg-teal-600 hover:bg-teal-500 text-white min-w-[200px]" onClick={nextQuestion}>
                                Next Question
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper icon
function CheckCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}

export default function HostLivePage() {
    return (
        <HostLiveContent />
    )
}
