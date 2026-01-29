"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, StopCircle, BarChart3, Users, Zap, Trophy, ShieldAlert, Ban, XCircle, AlertTriangle, Play, Layout } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket";

interface HostArenaProps {
    quizId?: string;
    hostId?: string;
    initialPin?: string;
    mode?: string; // 'live' | 'practice' | 'slideshow'
    onEnd?: () => void;
    onGameCreated?: (pin: string) => void;
}

export default function HostArena({ quizId, hostId, initialPin, mode = "live", onEnd, onGameCreated }: HostArenaProps) {
    const [pin, setPin] = useState<string | null>(initialPin || null);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [qIndex, setQIndex] = useState(0);
    const [totalQ, setTotalQ] = useState(0);
    const [answerCount, setAnswerCount] = useState(0);
    const [phase, setPhase] = useState<"waiting" | "question" | "reveal" | "leaderboard" | "finished">("waiting"); // 'waiting' | 'question' | 'reveal' | 'leaderboard' | 'finished'
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [timer, setTimer] = useState(30);
    const [kickNotifications, setKickNotifications] = useState<any[]>([]);
    const [stats, setStats] = useState<number[]>([0, 0, 0, 0]);
    const [quizDetails, setQuizDetails] = useState<any>(null);

    useEffect(() => {
        if (!socket.connected) socket.connect();

        if (!pin && quizId && hostId) {
            socket.emit("create_game", { quizId, hostId, gameMode: mode });
        }

        socket.on("game_created", (data: any) => {
            setPin(data.pin);
            setPhase("waiting");
            if (onGameCreated) onGameCreated(data.pin);
        });

        socket.on("player_joined", ({ name }) => {
            setPlayers((prev) => [...prev, name]);
            toast.info(`${name} joined!`);
        });

        socket.on("new_question", (data: any) => {
            setCurrentQuestion(data.question);
            setQIndex(data.index);
            setTotalQ(data.total);
            setAnswerCount(data.participantCount || players.length);
            setPhase("question");
            setStats([0, 0, 0, 0]);

            const timeLimit = data.question.timeLimit || 30;
            if (data.startTime) {
                const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
                setTimer(Math.max(0, timeLimit - elapsed));
            } else {
                setTimer(timeLimit);
            }
        });

        socket.on("player_answered", (data: any) => {
            setAnswerCount(data.count);
            if (data.distribution) {
                setStats(data.distribution);
            }
        });

        socket.on("leaderboard_update", (data: any) => {
            setLeaderboard(data.leaderboard);
            setPhase("leaderboard");
        });

        socket.on("game_over", (data: any) => {
            setPhase("finished");
            setLeaderboard(data.leaderboard);
        });

        socket.on("player_left", (data: any) => {
            setLeaderboard(prev => prev.filter(p => p.socketId !== data.participantId));
            setAnswerCount(prev => Math.max(0, prev - 1));
            setKickNotifications(prev => [{
                id: Date.now(),
                name: data.name,
                reason: data.reason || "Removed",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }, ...prev].slice(0, 5));
        });

        return () => {
            socket.off("new_question");
            socket.off("player_answered");
            socket.off("leaderboard_update");
            socket.off("game_over");
            socket.off("player_left");
        };
    }, []);

    useEffect(() => {
        if (timer > 0 && phase === 'question') {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && phase === 'question') {
            handleReveal();
        }
    }, [timer, phase]);

    const handleStart = () => socket.emit("start_game", { pin });
    const handleReveal = () => {
        setPhase("reveal");
        socket.emit("reveal_answer", { pin });
    };

    const handleShowStats = () => socket.emit("show_leaderboard", { pin });
    const nextQuestion = () => socket.emit("next_question", { pin });

    if (phase === "waiting") {
        return (
            <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden rounded-xl border border-white/5">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl flex flex-col items-center space-y-6 text-center relative z-10"
                >
                    <div className="space-y-4 bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl w-full">
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Join Code</h1>
                        <div className="text-5xl md:text-7xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-widest drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            {pin}
                        </div>
                        <p className="text-gray-300 text-sm">Join at <span className="font-bold text-white font-mono">aptiarena.com/play</span></p>
                    </div>

                    <Card className="w-full bg-slate-900/60 border-white/10 backdrop-blur-sm">
                        <CardHeader className="py-4">
                            <CardTitle className="flex items-center justify-center gap-2 text-lg text-white">
                                <Users className="text-cyan-400 w-5 h-5" />
                                Players Connected ({players.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            {players.length === 0 ? (
                                <div className="h-20 flex flex-col items-center justify-center text-gray-500 italic gap-2 text-sm">
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-ping" />
                                    Waiting for gladiators...
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {players.map((p, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white/10 p-2 rounded-lg text-white font-medium text-center border border-white/5 text-sm"
                                        >
                                            {p}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        {mode === 'practice' && (
                            <div className="px-6 pb-4">
                                <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 flex items-center gap-3">
                                    <Layout className="w-4 h-4 text-teal-400 shrink-0" />
                                    <p className="text-[10px] text-teal-300 font-medium leading-tight text-left">
                                        <span className="font-black border-b border-teal-400/30">PRO TIP:</span> For a side-by-side view of host and student screens, try the <span className="text-white font-bold underline cursor-pointer" onClick={() => window.location.href = `/host/practice/simulate/${quizId}`}>Interactive Simulator</span>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Button
                        size="lg"
                        className="text-xl px-12 py-7 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-105"
                        onClick={handleStart}
                        disabled={players.length === 0}
                    >
                        <Play className="mr-3 h-6 w-6 fill-current" />
                        Start Competition
                    </Button>
                </motion.div>

                <div className="absolute top-4 left-4 z-20">
                    <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10" onClick={onEnd}>
                        <StopCircle className="h-4 w-4 mr-2" /> Stop Simulation
                    </Button>
                </div>
            </div>
        );
    }

    if (phase === "finished") {
        return (
            <div className="flex-1 bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden rounded-xl border border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(88,28,135,0.2),rgba(0,0,0,1))] -z-10" />
                <Trophy className="w-16 h-16 text-yellow-500 mb-4 animate-bounce" />
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 mb-8">Simulation Over!</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-12">
                    {leaderboard.slice(0, 3).map((p, i) => (
                        <div key={i} className={`p-6 rounded-2xl border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/50 scale-110' : 'bg-slate-900/50 border-white/10'}`}>
                            <div className="text-xs font-black text-slate-500 uppercase mb-2">Rank #{i + 1}</div>
                            <div className="text-2xl font-bold text-white">{p.name}</div>
                            <div className="text-xl font-mono text-cyan-400">{p.score} pts</div>
                        </div>
                    ))}
                </div>

                <Button onClick={onEnd} className="bg-white text-black font-bold px-10 py-4 rounded-full hover:bg-gray-200 transition-all">Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden rounded-xl border border-white/5">
            <header className="h-16 border-b border-white/5 bg-slate-900/50 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase">PIN</div>
                        <div className="text-xl font-black text-white tracking-widest">{pin}</div>
                    </div>
                    <div className="flex items-center gap-2 bg-teal-500/10 px-3 py-1 rounded-lg">
                        <Users className="h-4 w-4 text-teal-400" />
                        <span className="font-bold text-white">{answerCount}</span>
                    </div>
                </div>

                {phase === 'question' && (
                    <div className={`h-10 w-16 rounded-xl flex items-center justify-center text-xl font-black ${timer <= 5 ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`}>
                        {timer}
                    </div>
                )}

                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10" onClick={onEnd}>
                    <StopCircle className="h-4 w-4 mr-2" /> Stop
                </Button>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
                {phase === 'leaderboard' ? (
                    <div className="space-y-4 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-black text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Practice Rankings</h3>
                        {leaderboard.slice(0, 5).map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-black text-slate-400">{i + 1}</div>
                                    <span className="font-bold text-white">{p.name}</span>
                                </div>
                                <span className="font-mono text-teal-400 font-bold">{p.score}</span>
                            </div>
                        ))}
                    </div>
                ) : currentQuestion && (
                    <div className="space-y-8">
                        <div className="text-center space-y-2">
                            <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Question {qIndex + 1} of {totalQ}</span>
                            <h2 className="text-3xl font-black text-white leading-tight">{currentQuestion.text}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {currentQuestion.options.map((opt: any, i: number) => {
                                const isRevealed = phase === 'reveal';
                                const isCorrect = opt.isCorrect;
                                const count = stats[i] || 0;
                                const percentage = answerCount > 0 ? Math.round((count / answerCount) * 100) : 0;

                                return (
                                    <div key={i} className={`p-4 rounded-xl border-2 relative overflow-hidden flex flex-col gap-2 transition-all ${isRevealed && isCorrect ? 'border-green-500 bg-green-500/10' : 'border-slate-800 bg-slate-900'}`}>
                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center font-bold text-white">{String.fromCharCode(65 + i)}</div>
                                                <span className="font-bold text-sm text-white">{opt.text}</span>
                                            </div>
                                            {isRevealed && isCorrect && <Zap className="w-4 h-4 text-green-500" />}
                                        </div>

                                        {/* Stats Bar */}
                                        {(phase === 'reveal' || mode === 'practice') && (
                                            <div className="relative h-2 bg-black/20 rounded-full mt-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className={`absolute inset-0 ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                />
                                            </div>
                                        )}
                                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mt-1">
                                            <span>{count} Answers</span>
                                            <span>{percentage}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            <footer className="p-4 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3 shrink-0">
                {phase === 'question' && (
                    <Button onClick={handleReveal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">Reveal Answer</Button>
                )}
                {phase === 'reveal' && (
                    <Button onClick={handleShowStats} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8">Show Stats</Button>
                )}
                {phase === 'leaderboard' && (
                    <Button onClick={nextQuestion} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8">Next Question <ChevronRight className="ml-2 h-4 w-4" /></Button>
                )}
            </footer>
        </div>
    );
}

function CheckCircle(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
