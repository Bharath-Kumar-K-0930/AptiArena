"use client";

import Link from "next/link";
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
    const [players, setPlayers] = useState<any[]>([]); // { name, participantId }
    const [timer, setTimer] = useState(30);
    const [kickNotifications, setKickNotifications] = useState<any[]>([]);
    const [stats, setStats] = useState<number[]>([0, 0, 0, 0]);
    const [quizDetails, setQuizDetails] = useState<any>(null);
    const [kickingPlayer, setKickingPlayer] = useState<any | null>(null);

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

        socket.on("player_joined", ({ name, participantId }) => {
            setPlayers((prev) => [...prev, { name, participantId }]);
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

        socket.on("answer_revealed", (data: any) => {
            console.log("[HOST] Received answer_revealed confirmation");
            setPhase("reveal");
            // If data contains stats, update them here (optional, currently derived from local state/listeners)
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
            setPlayers(prev => prev.filter(p => p.participantId !== data.participantId));
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
            socket.off("answer_revealed");
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
        // Do NOT set phase locally. Wait for server event.
        console.log("[HOST] Sending reveal_answer request");
        socket.emit("reveal_answer", { pin });
    };

    const handleKick = () => {
        if (kickingPlayer) {
            socket.emit("KICK_PARTICIPANT", { pin, participantId: kickingPlayer.participantId });
            setKickingPlayer(null);
            toast.success(`${kickingPlayer.name} has been kicked.`);
        }
    };

    const handleShowStats = () => socket.emit("show_leaderboard", { pin });
    const nextQuestion = () => socket.emit("next_question", { pin });

    if (phase === "waiting") {
        return (
            <div className={`flex-1 bg-slate-950 flex flex-col items-center justify-center ${mode === 'practice' ? 'p-4' : 'p-8'} relative overflow-hidden rounded-xl border border-white/5`}>
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-full max-w-2xl flex flex-col items-center ${mode === 'practice' ? 'space-y-4' : 'space-y-8'} text-center relative z-10`}
                >
                    <div className={`${mode === 'practice' ? 'space-y-3 p-6' : 'space-y-6 p-10'} bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl w-full border-t-teal-500/20`}>
                        <div className="space-y-2">
                            <h1 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Arena Join Code</h1>
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className={`${mode === 'practice' ? 'text-5xl md:text-6xl' : 'text-6xl md:text-8xl'} font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 tracking-tighter drop-shadow-[0_0_30px_rgba(20,184,166,0.3)]`}
                            >
                                {pin}
                            </motion.div>
                        </div>
                        <div className="h-px bg-white/5 w-1/2 mx-auto" />
                        <p className={`${mode === 'practice' ? 'text-xs' : 'text-gray-400'} font-medium`}>Participants join at <span className="font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/10 ml-1">aptiarena.com/play</span></p>
                    </div>

                    <div className={`w-full max-w-2xl bg-slate-900/40 backdrop-blur-xl ${mode === 'practice' ? 'p-4' : 'p-8'} rounded-[2.5rem] border border-white/10 shadow-2xl relative border-t-teal-500/20`}>
                        <div className={`flex items-center justify-between ${mode === 'practice' ? 'mb-3' : 'mb-6'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-500/10 rounded-xl">
                                    <Users className="h-5 w-5 text-teal-400" />
                                </div>
                                <h3 className={`${mode === 'practice' ? 'text-sm' : 'text-lg'} font-black text-white uppercase tracking-wider`}>Battle Roster</h3>
                            </div>
                            <div className="bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full text-xs font-black ring-1 ring-teal-500/20">
                                {players.length} READY
                            </div>
                        </div>

                        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${mode === 'practice' ? 'max-h-[120px]' : 'max-h-[200px]'} overflow-y-auto pr-2 custom-scrollbar`}>
                            <AnimatePresence>
                                {players.map((player, i) => (
                                    <motion.div
                                        key={player.participantId || i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => setKickingPlayer(player)}
                                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center text-center truncate hover:border-red-500/30 hover:bg-red-500/5 cursor-pointer transition-all relative group"
                                    >
                                        <span className="group-hover:opacity-20 transition-opacity">{player.name}</span>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        </div>
                                    </motion.div>
                                ))}
                                {players.length === 0 && (
                                    <div className={`col-span-full ${mode === 'practice' ? 'py-4' : 'py-8'} text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]`}>
                                        Awaiting Gladiators...
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {mode === 'practice' && (
                        <div className="text-left bg-teal-500/5 p-4 rounded-2xl border border-teal-500/10">
                            <p className="text-[10px] text-teal-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Zap className="h-3 w-3" /> Tip: Advanced View
                            </p>
                            <p className="text-xs text-teal-100/60 font-medium leading-relaxed">
                                Use the <span className="text-teal-400 font-bold">Interactive Simulator</span> for a side-by-side student/host experience.
                            </p>
                        </div>
                    )}

                    <Button
                        size={mode === 'practice' ? "default" : "lg"}
                        className={`w-full sm:w-auto ${mode === 'practice' ? 'text-sm px-10 h-12' : 'text-lg px-16 h-16'} bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-2xl shadow-2xl shadow-teal-500/20 transition-all hover:scale-105 uppercase tracking-widest`}
                        onClick={handleStart}
                        disabled={players.length === 0}
                    >
                        {players.length === 0 ? "Waiting for Players" : "Begin the Battle"}
                        {players.length > 0 && <Play className={`${mode === 'practice' ? 'ml-2 h-4 w-4' : 'ml-3 h-5 w-5'} fill-current`} />}
                    </Button>
                </motion.div>

                <div className={`absolute ${mode === 'practice' ? 'top-3 left-3' : 'top-6 left-6'} z-20`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 font-black text-[10px] uppercase tracking-widest px-4 h-10 border border-red-500/10 rounded-xl"
                        onClick={onEnd}
                    >
                        <StopCircle className="h-4 w-4 mr-2" /> Stop Arena
                    </Button>
                </div>

                {/* Kick Confirmation Modal */}
                <AnimatePresence>
                    {kickingPlayer && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                                onClick={() => setKickingPlayer(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center space-y-6"
                            >
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
                                    <ShieldAlert className="h-8 w-8 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Kick Gladiator?</h3>
                                    <p className="text-slate-400 text-sm">Are you sure you want to remove <span className="text-white font-bold">{kickingPlayer.name}</span> from the Arena?</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs border border-white/5 hover:bg-white/5"
                                        onClick={() => setKickingPlayer(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-xs bg-red-500 hover:bg-red-400 text-white"
                                        onClick={handleKick}
                                    >
                                        Kick Out
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
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
