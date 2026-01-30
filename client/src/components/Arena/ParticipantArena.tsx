"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2, CheckCircle, XCircle, Loader2, MonitorPlay, Zap, Star, ShieldAlert, Clipboard, Eye, MousePointer2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

interface ParticipantArenaProps {
    initialPin?: string;
    initialName?: string;
    isSimulation?: boolean;
    onKicked?: () => void;
}

export default function ParticipantArena({ initialPin = "", initialName = "", isSimulation = false, onKicked }: ParticipantArenaProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [pin, setPin] = useState(initialPin);
    const [name, setName] = useState(initialName);

    const [gameState, setGameState] = useState<"join" | "waiting" | "playing" | "submitted" | "result" | "leaderboard" | "finished">("join");
    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);

    const [result, setResult] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
        setSocket(newSocket);

        // Auto-rejoin if session exists (only in non-simulation mode)
        const savedPin = sessionStorage.getItem('quiz_pin');
        const savedName = sessionStorage.getItem('quiz_name');

        if (!isSimulation && savedPin && savedName && !initialPin) {
            setPin(savedPin);
            setName(savedName);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${navigator.platform}`;
            newSocket.emit("join_game", { pin: savedPin, name: savedName, userId: user.id || user._id, fingerprint });
        }

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
            // Attempt auto-rejoin on reconnection to ensure room membership
            const currentPin = pin || sessionStorage.getItem('quiz_pin');
            const currentName = name || sessionStorage.getItem('quiz_name');

            if (currentPin && currentName && !isSimulation) {
                console.log("Restoring session for:", currentName);
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${navigator.platform}`;
                newSocket.emit("join_game", {
                    pin: currentPin,
                    name: currentName,
                    userId: user.id || user._id,
                    fingerprint
                });
            }
        });

        newSocket.on("joined_game", ({ pin: joinedPin }) => {
            setIsJoining(false);
            if (gameState === 'join') setGameState("waiting");
            // Don't reset state if we were already playing/submitted

            if (!isSimulation) {
                sessionStorage.setItem('quiz_pin', joinedPin);
                sessionStorage.setItem('quiz_name', nameRef.current || "");
            }
        });

        newSocket.on("new_question", ({ question, index, startTime }) => {
            setGameState("playing");
            setCurrentQuestion(question);
            setQuestionIndex(index);
            setHasAnswered(false);
            setSelectedAnswerIndex(null);
            setResult(null);

            const limit = question.timeLimit || 30;
            if (startTime) {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setTimeLeft(Math.max(0, limit - elapsed));
            } else {
                setTimeLeft(limit);
            }
        });

        newSocket.on("answer_result", (data) => {
            setGameState("submitted");
            setResult((prev: any) => ({ ...(prev || {}), ...data }));
            if (data.lastAnswerIndex !== undefined) {
                setSelectedAnswerIndex(data.lastAnswerIndex);
                setHasAnswered(true);
            }
        });

        newSocket.on("answer_revealed", (data) => {
            setGameState("result");
            setResult((prev: any) => ({ ...(prev || {}), ...data }));
            if (data.leaderboard) setLeaderboard(data.leaderboard);
        });

        // Polling response handler
        newSocket.on("reveal_status", (data) => {
            if (data.isRevealed) {
                console.log("Safety poll confirmed reveal!");
                setGameState("result");
                setResult((prev: any) => ({ ...(prev || {}), ...data }));
                if (data.leaderboard) setLeaderboard(data.leaderboard);

                // Ensure specific user stats are synced
                if (data.lastAnswerIndex !== undefined) {
                    setSelectedAnswerIndex(data.lastAnswerIndex);
                    setHasAnswered(true);
                }
            }
        });

        newSocket.on("leaderboard_update", ({ leaderboard }) => {
            setGameState("leaderboard");
            if (leaderboard) setLeaderboard(leaderboard);
        });

        newSocket.on("game_over", ({ leaderboard }) => {
            setGameState("finished");
            setLeaderboard(leaderboard);
            if (!isSimulation) {
                sessionStorage.removeItem('quiz_pin');
                sessionStorage.removeItem('quiz_name');
            }
        });

        newSocket.on("KICKED", ({ message }) => {
            toast.error(message || "You have been removed from the session.");
            if (!isSimulation) {
                sessionStorage.removeItem('quiz_pin');
                sessionStorage.removeItem('quiz_name');
            }
            if (onKicked) onKicked();
        });

        newSocket.on("error", (msg) => {
            setIsJoining(false);
            setError(msg);
            toast.error(msg);
            if (msg === 'Game not found' || msg === 'Game already started') {
                setGameState("join");
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Anti-Cheat (only if not simulation)
    useEffect(() => {
        if (isSimulation || !socket || (gameState !== 'playing' && gameState !== 'submitted')) return;

        const handleVisibilityChange = () => { if (document.hidden) socket.emit("TAB_SWITCH", { pin }); };
        const handleBlur = () => { socket.emit("TAB_SWITCH", { pin }); };
        const blockAction = (e: any) => {
            e.preventDefault();
            socket.emit("COPY_ATTEMPT", { pin });
            toast.error("Action Blocked");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("copy", blockAction);
        document.addEventListener("contextmenu", blockAction);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("copy", blockAction);
            document.removeEventListener("contextmenu", blockAction);
        };
    }, [socket, gameState, pin, isSimulation]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && timeLeft !== null && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const nameRef = useRef(name);
    useEffect(() => {
        nameRef.current = name;
    }, [name]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);
        if (socket && pin && name) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const fingerprint = isSimulation
                ? `sim-${Date.now()}`
                : `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${navigator.platform}`;

            socket.emit("join_game", {
                pin,
                name,
                userId: user.id || user._id,
                fingerprint
            });
        }
    };

    // Safety Poll: Check for reveal status if stuck on "Locked" screen
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === "submitted" && !isSimulation) {
            interval = setInterval(() => {
                const currentPin = pin || sessionStorage.getItem('quiz_pin');
                if (currentPin && socket && socket.connected) {
                    socket.emit('check_reveal_status', { pin: currentPin });
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [gameState, pin, isSimulation]);

    const handleAnswer = (index: number) => {
        if (hasAnswered || gameState !== "playing" || (timeLeft !== null && timeLeft <= 0)) return;
        setHasAnswered(true);
        setSelectedAnswerIndex(index);
        if (socket) {
            socket.emit("submit_answer", { pin, answerIndex: index, questionIndex });
        }
    };

    if (gameState === "join") {
        return (
            <div className={`min-h-full ${isSimulation ? 'bg-black shadow-xl border border-white/10 rounded-[3rem] overflow-hidden' : 'min-h-screen bg-black'} flex items-center justify-center p-4 relative`}>
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero-bg.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-black/80" />
                </div>

                <div className="w-full max-w-sm relative z-10 text-center space-y-4">
                    <MonitorPlay className="w-10 h-10 mx-auto text-teal-400 mb-2" />
                    <h2 className="text-2xl font-bold text-white mb-1">Join Quiz</h2>
                    <p className="text-gray-300 text-xs mb-4">Enter code to enter the arena</p>
                    <form onSubmit={handleJoin} className="space-y-3">
                        <Input
                            placeholder="Game PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="bg-black/50 border-white/20 text-white text-center text-xl tracking-widest h-12"
                        />
                        <Input
                            placeholder="Enter Nickname"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black/50 border-white/20 text-white text-center text-sm h-10"
                        />
                        <Button type="submit" className="w-full h-11 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm" disabled={isJoining}>
                            {isJoining ? <Loader2 className="animate-spin" /> : "Enter Arena"}
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    if (gameState === "waiting") {
        return (
            <div className={`min-h-full ${isSimulation ? 'bg-black rounded-[3rem]' : 'min-h-screen bg-black'} flex flex-col items-center justify-center p-4 text-center relative overflow-hidden`}>
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-teal-500/20 blur-[60px] rounded-full animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full"
                >
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-white mb-1">You&apos;re In, {name}!</h2>
                        <p className="text-base text-teal-400 font-medium tracking-tight">Waiting for the Host...</p>
                    </div>

                    <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10 text-left overflow-hidden shadow-2xl mx-2">
                        <div className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 p-3 border-b border-white/5">
                            <h3 className="text-white text-sm font-bold flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-teal-400" />
                                Rules of the Arena
                            </h3>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            {[
                                { icon: Zap, label: "No Tab Switching", color: "text-red-500", desc: "Results in immediate kick" },
                                { icon: Clipboard, label: "No Copy/Paste", color: "text-yellow-500", desc: "Blocked and flagged" },
                                { icon: MousePointer2, label: "Right-Click Disabled", color: "text-blue-500", desc: "Quiz integrity measure" },
                                { icon: Eye, label: "Stay Focused", color: "text-teal-400", desc: "Timer is synced" }
                            ].map((rule, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`p-1.5 rounded-md bg-white/5 shrink-0`}>
                                        <rule.icon className={`w-3.5 h-3.5 ${rule.color}`} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[10px] font-bold uppercase tracking-wider ${rule.color}`}>{rule.label}</h4>
                                        <p className="text-gray-500 text-[9px]">{rule.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                </motion.div>
            </div>
        );
    }

    if (gameState === "finished") {
        const myRank = leaderboard.findIndex(p => p.name === name) + 1;
        const myScore = leaderboard.find(p => p.name === name)?.score || 0;
        return (
            <div className={`min-h-full ${isSimulation ? 'bg-slate-950 rounded-[3rem]' : 'min-h-screen bg-black'} flex flex-col items-center justify-center p-4 text-white text-center`}>
                <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold">Sim Finished!</h1>
                <div className="mt-6 space-y-2">
                    <div className="text-gray-500 text-xs uppercase tracking-widest">Your Score</div>
                    <div className="text-4xl font-mono text-teal-400 font-bold">{myScore}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-full ${isSimulation ? 'bg-slate-950 rounded-[3rem]' : 'min-h-screen bg-slate-950'} relative overflow-hidden flex flex-col`}>
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 to-slate-900" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col p-4">
                {/* Header Stats */}
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Q {questionIndex + 1}</span>
                    <div className={`px-3 py-1 rounded-full border text-xs font-bold font-mono ${timeLeft && timeLeft <= 10 ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white'}`}>
                        {timeLeft}s
                    </div>
                </div>

                {gameState === "playing" && currentQuestion && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white text-center leading-tight">
                            {currentQuestion.text}
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            {currentQuestion.options.map((option: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className={`
                                        p-4 rounded-xl flex items-center gap-3 text-left transition-all active:scale-95 border-b-4 border-black/20
                                        ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-yellow-500' : 'bg-green-500'}
                                    `}
                                >
                                    <div className="bg-black/20 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0">
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="text-sm font-bold text-white">
                                        {option.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === "submitted" && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Locked!</h3>
                        <p className="text-slate-400 text-xs px-8">Waiting for other participants or host reveal...</p>
                    </div>
                )}

                {gameState === "result" && result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6 text-white pb-8"
                    >
                        {/* Result Icon */}
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-2 border-8 shadow-2xl transition-all duration-500 ${(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ? 'bg-green-500 border-green-400 shadow-green-500/30' : 'bg-red-500 border-red-400 shadow-red-500/30'}`}>
                            {(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ?
                                <CheckCircle className="w-16 h-16" /> :
                                <XCircle className="w-16 h-16" />
                            }
                        </div>

                        <h2 className="text-5xl font-black drop-shadow-md tracking-tight">
                            {(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ? "Correct" : (selectedAnswerIndex === null ? "Time's Up" : "Incorrect")}
                        </h2>

                        {/* Stats Row */}
                        <div className="flex justify-center gap-4">
                            <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl flex-1 max-w-[140px] border border-white/10 shadow-lg">
                                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] block mb-1 font-black">Total Score</span>
                                <span className="text-4xl font-mono font-bold text-teal-400">
                                    {result.score || (leaderboard.find(p => p.name === name)?.score) || 0}
                                </span>
                            </div>
                            <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl flex-1 max-w-[140px] border border-white/10 shadow-lg">
                                <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] block mb-1 font-black">Rank</span>
                                <span className="text-4xl font-mono font-bold text-yellow-400">
                                    #{leaderboard.findIndex(p => p.name === name) !== -1 ? leaderboard.findIndex(p => p.name === name) + 1 : '-'}
                                </span>
                            </div>
                        </div>

                        {/* Answer Comparison */}
                        <div className="space-y-3 w-full max-w-sm mx-auto">
                            {/* Your Answer */}
                            <div className={`p-5 rounded-2xl border backdrop-blur-md text-left shadow-xl transition-all ${(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-3 border-b border-white/5 pb-2">Your Answer</div>
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg
                                        ${selectedAnswerIndex === 0 ? 'bg-red-500' : selectedAnswerIndex === 1 ? 'bg-blue-500' : selectedAnswerIndex === 2 ? 'bg-yellow-500' : selectedAnswerIndex === 3 ? 'bg-green-500' : 'bg-slate-600'}
                                    `}>
                                        {selectedAnswerIndex !== null ? String.fromCharCode(65 + (selectedAnswerIndex || 0)) : '?'}
                                    </div>
                                    <span className="text-xl font-bold text-white leading-tight">
                                        {selectedAnswerIndex !== null ? currentQuestion?.options[selectedAnswerIndex]?.text : "No answer submitted"}
                                    </span>
                                </div>
                            </div>

                            {/* Correct Answer */}
                            <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md text-left">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] mb-3 border-b border-white/5 pb-2">The Correct Answer Was</div>
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg
                                        ${result.correctIndex === 0 ? 'bg-red-500' : result.correctIndex === 1 ? 'bg-blue-500' : result.correctIndex === 2 ? 'bg-yellow-500' : result.correctIndex === 3 ? 'bg-green-500' : 'bg-slate-600'}
                                    `}>
                                        {String.fromCharCode(65 + (result.correctIndex || 0))}
                                    </div>
                                    <span className="text-xl font-bold text-white leading-tight">
                                        {result.answerText || currentQuestion?.options[result.correctIndex || 0]?.text}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Explanation */}
                        {result.explanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-indigo-950/40 p-5 rounded-2xl border border-indigo-500/30 max-w-sm mx-auto backdrop-blur-sm text-left shadow-2xl"
                            >
                                <div className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" /> Explanation
                                </div>
                                <p className="text-indigo-100 text-xs leading-relaxed font-medium">
                                    {result.explanation}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {gameState === "leaderboard" && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <Trophy className="w-12 h-12 text-purple-400 animate-pulse" />
                        <div className="bg-purple-500/10 p-6 rounded-2xl border border-purple-500/20 w-4/5">
                            <div className="text-4xl font-black text-white mb-1">
                                #{leaderboard.findIndex(p => p.name === name) + 1}
                            </div>
                            <div className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Current Rank</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-10 flex items-center justify-between px-6 bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <span className="truncate max-w-[100px]">{name}</span>
                <span>{isSimulation ? "Sim Mode" : "Play"}</span>
            </div>
        </div>
    );
}
