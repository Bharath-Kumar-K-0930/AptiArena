"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2, CheckCircle, XCircle, Loader2, MonitorPlay, Zap, Star, ShieldAlert, Clipboard, Eye, MousePointer2, Trophy, RefreshCcw } from "lucide-react";
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
    const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);

    const [result, setResult] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Refs for stale-proof event listeners
    const pinRef = useRef(pin);
    const nameRef = useRef(name);
    const gameStateRef = useRef(gameState);

    useEffect(() => { pinRef.current = pin; }, [pin]);
    useEffect(() => { nameRef.current = name; }, [name]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // Sync state with props for simulation mode
    useEffect(() => {
        if (isSimulation) {
            if (initialPin && initialPin !== pin) setPin(initialPin);
            if (initialName && initialName !== name) setName(initialName);
        }
    }, [initialPin, initialName, isSimulation]);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
            transports: ['websocket'],
            upgrade: false
        });
        setSocket(newSocket);

        // Auto-rejoin if session exists
        const savedPin = sessionStorage.getItem('quiz_pin');
        const savedName = sessionStorage.getItem('quiz_name');

        if (!isSimulation && savedPin && savedName) {
            setPin(savedPin);
            setName(savedName);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const fingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${navigator.platform}`;
            newSocket.emit("join_game", { pin: savedPin, name: savedName, userId: user.id || user._id, fingerprint });
        }

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
            if (isSimulation) toast.success("Mock Device Connected to Engine");

            // Attempt auto-rejoin on reconnection to ensure room membership
            const currentPin = pinRef.current || sessionStorage.getItem('quiz_pin');
            const currentName = nameRef.current || sessionStorage.getItem('quiz_name');

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

        newSocket.on("joined_game", ({ pin: joinedPin, total }) => {
            setIsJoining(false);
            if (gameState === 'join') setGameState("waiting");
            if (total) setTotalQuestions(total);

            if (!isSimulation) {
                sessionStorage.setItem('quiz_pin', joinedPin);
                sessionStorage.setItem('quiz_name', nameRef.current || "");
            }
        });

        newSocket.on("new_question", ({ question, index, total, startTime }) => {
            setGameState("playing");
            const qTotal = total || question.total;
            if (qTotal) setTotalQuestions(qTotal);
            setCurrentQuestion({ ...question, total: qTotal });
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
            console.log("socket_event: answer_revealed", data);

            // Critical: Ensure result state is fully populated BEFORE switching view
            setResult((prev: any) => ({
                ...(prev || {}),
                ...data,
                // Ensure these specific fields are explicitly set from the payload
                correctIndex: data.correctIndex,
                isRevealed: true
            }));

            if (data.leaderboard) setLeaderboard(data.leaderboard);
            if (data.lastAnswerIndex !== undefined) {
                setSelectedAnswerIndex(data.lastAnswerIndex);
                setHasAnswered(true);
            }
            // Switch state last to ensure data is ready
            setGameState("result");
        });

        // Polling response handler
        // Polling response handler
        newSocket.on("reveal_status", (data) => {
            console.log("Received reveal_status:", data);
            if (data.isRevealed) {
                setGameState("result");
                setResult((prev: any) => ({ ...(prev || {}), ...data }));
                if (data.leaderboard) setLeaderboard(data.leaderboard);

                // Ensure specific user stats are synced
                if (data.lastAnswerIndex !== undefined) {
                    setSelectedAnswerIndex(data.lastAnswerIndex);
                    setHasAnswered(true);
                }
                toast.success("Sync Complete: Results Loaded");
            } else {
                toast.info("Still waiting for Host to reveal...");
            }
            setIsSyncing(false);
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

    // Auto-Join in Simulation Mode
    useEffect(() => {
        if (isSimulation && socket && pin && name && gameState === "join" && !isJoining) {
            console.log("Auto-joining simulation arena...");
            handleJoin({ preventDefault: () => { } } as any);
        }
    }, [isSimulation, socket, pin, name, gameState, isJoining]);


    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);
        if (socket && pin && name) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const fingerprint = isSimulation
                ? `sim-${Date.now()}`
                : `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${navigator.platform}`;

            console.log(`Simulation: Attempting to join room ${pin} as ${name}`);
            socket.emit("join_game", {
                pin,
                name,
                userId: user.id || user._id,
                fingerprint
            });
        } else {
            console.error("Join failed: Missing requirements", { hasSocket: !!socket, pin, name });
        }
    };

    // Safety Poll: Check for reveal status if stuck on "Locked" screen
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === "submitted" && !isSimulation) {
            // High-frequency polling (800ms) to ensure near-real-time sync if event is missed
            interval = setInterval(() => {
                const currentPin = pinRef.current || sessionStorage.getItem('quiz_pin');
                if (currentPin && socket && socket.connected) {
                    socket.emit('check_reveal_status', { pin: currentPin });
                }
            }, 800);
        }
        return () => clearInterval(interval);
    }, [gameState, socket, isSimulation]);

    // Self-healing: If we have result data but are stuck in 'submitted', force transition
    useEffect(() => {
        if (gameState === 'submitted' && result && (result.correctIndex !== undefined || result.isRevealed)) {
            console.log("Self-healing: Transitioning to result state based on data");
            setGameState('result');
        }
    }, [gameState, result]);

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
            <div className={`${isSimulation ? 'h-full' : 'min-h-[calc(100vh-4rem)]'} ${isSimulation ? 'bg-black shadow-xl border border-white/10 rounded-[3rem] overflow-hidden' : 'bg-black'} flex items-center justify-center p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero-bg.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/60 to-black" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm relative z-10 text-center space-y-8 bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10"
                >
                    <div className="space-y-2">
                        <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto border border-teal-500/20">
                            <MonitorPlay className="w-8 h-8 text-teal-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Join Arena</h2>
                        <p className="text-gray-400 text-sm font-medium">Enter the battle code to begin</p>
                    </div>

                    <form onSubmit={handleJoin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Pin Code</label>
                            <Input
                                placeholder="000000"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="bg-white/5 border-white/10 text-white text-center text-2xl font-black tracking-[0.5em] h-14 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block ml-1">Your Identity</label>
                            <Input
                                placeholder="Enter Nickname"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/5 border-white/10 text-white text-center text-sm h-12 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all font-bold"
                            />
                        </div>
                        <Button type="submit" className="w-full h-14 bg-teal hover:bg-teal/80 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-500/20" disabled={isJoining}>
                            {isJoining ? <Loader2 className="animate-spin" /> : "Enter the Arena"}
                        </Button>
                    </form>
                </motion.div>
            </div>
        );
    }

    if (gameState === "waiting") {
        return (
            <div className={`${isSimulation ? 'h-full' : 'min-h-[calc(100vh-4rem)]'} ${isSimulation ? 'bg-black rounded-[3rem]' : 'bg-black'} flex flex-col items-center justify-center ${isSimulation ? 'p-4' : 'p-6'} text-center relative overflow-hidden`}>
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative z-10 w-full max-w-md mx-auto ${isSimulation ? 'px-2' : ''}`}
                >
                    <div className={isSimulation ? 'mb-4' : 'mb-10'}>
                        <div className={`inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] ${isSimulation ? 'mb-2' : 'mb-4'}`}>
                            Connection Active
                        </div>
                        <h2 className={`${isSimulation ? 'text-2xl' : 'text-4xl'} font-black text-white mb-2 leading-tight`}>You&apos;re In, <span className="text-teal-400">{name}</span>!</h2>
                        <p className={`${isSimulation ? 'text-sm' : 'text-lg'} text-gray-400 font-medium tracking-tight`}>The Arena is being prepared by the host...</p>
                    </div>

                    <Card className="bg-slate-900/40 backdrop-blur-2xl border-white/10 text-left overflow-hidden shadow-2xl border-t-teal-500/30">
                        <div className={`bg-gradient-to-r from-teal-500/20 to-blue-500/20 border-b border-white/5 ${isSimulation ? 'p-2' : 'p-4'}`}>
                            <h3 className="text-white text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                                <ShieldAlert className="w-4 h-4 text-teal-400" />
                                Rules of the Arena
                            </h3>
                        </div>
                        <CardContent className={`${isSimulation ? 'p-3 gap-3' : 'p-6 gap-6'} grid grid-cols-1 sm:grid-cols-2`}>
                            {[
                                { icon: Zap, label: "No Tab Switching", color: "text-red-400", desc: "Results in immediate kick" },
                                { icon: Clipboard, label: "No Copy/Paste", color: "text-amber-400", desc: "Blocked and flagged" },
                                { icon: MousePointer2, label: "Right-Click Disabled", color: "text-blue-400", desc: "Quiz integrity measure" },
                                { icon: Eye, label: "Stay Focused", color: "text-teal-400", desc: "Timer is synced live" }
                            ].map((rule, i) => (
                                <div key={i} className={`flex items-start ${isSimulation ? 'gap-2.5' : 'gap-4'}`}>
                                    <div className={`p-2 rounded-xl bg-white/5 shrink-0 border border-white/5`}>
                                        <rule.icon className={`${isSimulation ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${rule.color}`} />
                                    </div>
                                    <div>
                                        <h4 className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${rule.color}`}>{rule.label}</h4>
                                        <p className="text-gray-500 text-[9px] leading-tight">{rule.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className={isSimulation ? "mt-6 flex flex-col items-center gap-2" : "mt-10 flex flex-col items-center gap-4"}>
                        <div className="flex justify-center gap-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Synching with Server</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (gameState === "finished") {
        const myRank = leaderboard.findIndex(p => p.name === name) + 1;
        const myScore = leaderboard.find(p => p.name === name)?.score || 0;
        return (
            <div className={`${isSimulation ? 'h-full' : 'min-h-[calc(100svh-4rem)]'} ${isSimulation ? 'bg-slate-950 rounded-[3rem]' : 'bg-black'} flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden`}>
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full" />
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative z-10 flex flex-col items-center ${isSimulation ? 'w-full px-4' : ''}`}
                >
                    <div className="relative mb-6">
                        <Trophy className="w-20 h-20 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full -z-10"
                        />
                    </div>

                    <h1 className="text-3xl font-black mb-2 tracking-tight">Arena Finished!</h1>
                    <p className="text-gray-400 font-medium mb-8 text-sm md:text-base">You've completed the challenge.</p>

                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Final Score</div>
                            <div className="text-2xl font-mono font-bold text-teal-400">{myScore}</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Final Rank</div>
                            <div className="text-2xl font-mono font-bold text-yellow-400">#{myRank || '-'}</div>
                        </div>
                    </div>

                    <Button
                        onClick={() => window.location.href = '/'}
                        className="bg-white text-black hover:bg-gray-200 font-black px-10 h-12 rounded-2xl transition-all shadow-xl shadow-white/10 uppercase tracking-widest text-[10px]"
                    >
                        Return to Lobby
                    </Button>
                </motion.div>
            </div>
        );
    }

    // Check if we have a valid result state to force render
    const isValidResultState = (gameState === 'result') || (gameState === 'submitted' && result && (result.correctIndex !== undefined || result.isRevealed));

    return (
        <div className="min-h-[100dvh] bg-slate-950 text-white font-sans selection:bg-teal-500/30 flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(13,148,136,0.1),rgba(0,0,0,1))]" />
            
            {(gameState === "waiting" || gameState === "join") && (
                <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Question</span>
                        <span className="text-base md:text-lg font-black text-white">{questionIndex + 1}<span className="text-slate-600 ml-1">/ {totalQuestions || currentQuestion?.total || '?'}</span></span>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Time Remaining</span>
                        <div className={`px-3 py-1 rounded-full border text-xs font-black font-mono transition-colors ${timeLeft && timeLeft <= 5 ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-white'}`}>
                            {timeLeft}s
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    {gameState === "playing" && currentQuestion && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4 md:space-y-6"
                        >
                            <h2 className="text-lg md:text-2xl font-black text-white text-center leading-tight tracking-tight px-2">
                                {currentQuestion.text}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto w-full">
                                {currentQuestion.options.map((option: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        disabled={hasAnswered}
                                        className={`
                                            group relative p-3 md:p-4 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-95 border-b-4 border-black/30 overflow-hidden
                                            ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
                                            ${i === 0 ? 'bg-red-500 hover:bg-red-400' : i === 1 ? 'bg-blue-500 hover:bg-blue-400' : i === 2 ? 'bg-amber-500 hover:bg-amber-400' : 'bg-green-500 hover:bg-green-400'}
                                        `}
                                    >
                                        <div className="w-8 h-8 text-sm bg-black/20 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-inner group-hover:bg-black/30 transition-colors">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className="text-xs md:text-sm font-black text-white leading-tight">
                                            {option.text}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "submitted" && !isValidResultState && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center border-4 border-teal-500/20">
                                    <CheckCircle className="w-10 h-10 text-teal-400" />
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute inset-0 bg-teal-500/30 rounded-full"
                                />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white mb-2">Answer Locked</h3>
                                <p className="text-slate-400 text-sm font-medium max-w-[240px] mx-auto italic mb-4">Waiting for lead gladiator execution...</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-teal-500/50 font-mono tracking-widest uppercase">Live Sync Active</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {(gameState === "result" || isValidResultState) && result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-4 md:space-y-6"
                        >
                            <div className="space-y-2 md:space-y-3">
                                <div className={`w-16 h-16 md:w-20 md:h-20 border-4 rounded-full flex items-center justify-center mx-auto shadow-2xl transition-all duration-500 ${(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ? 'bg-green-500 border-green-400 shadow-green-500/40' : 'bg-red-500 border-red-400 shadow-red-500/40'}`}>
                                    {(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ?
                                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" /> :
                                        <XCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                    }
                                </div>

                                <h2 className={`text-2xl md:text-4xl font-black drop-shadow-lg tracking-tighter uppercase ${(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ? 'text-green-400' : 'text-red-400'}`}>
                                    {(result.isCorrect ?? (selectedAnswerIndex !== null && selectedAnswerIndex === result.correctIndex)) ? "Genius!" : (selectedAnswerIndex === null ? "Too Slow" : "Incorrect")}
                                </h2>
                            </div>

                            <div className="flex justify-center gap-3 w-full max-w-sm mx-auto">
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl flex-1 border border-white/10 p-2 md:p-3">
                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1 font-black">Score</span>
                                    <span className="text-lg md:text-xl font-mono font-bold text-teal-400">
                                        {result.score || (leaderboard.find(p => p.name === name)?.score) || 0}
                                    </span>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl flex-1 border border-white/10 p-2 md:p-3">
                                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1 font-black">Rank</span>
                                    <span className="text-lg md:text-xl font-mono font-bold text-yellow-400">
                                        #{leaderboard.findIndex(p => p.name === name) !== -1 ? leaderboard.findIndex(p => p.name === name) + 1 : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full max-w-sm mx-auto space-y-2 md:space-y-3">
                                {/* Compare Answers */}
                                {selectedAnswerIndex !== result.correctIndex && selectedAnswerIndex !== null && (
                                    <div className="rounded-xl bg-red-500/5 border border-red-500/20 text-left p-2.5 md:p-3">
                                        <div className="text-red-500/50 text-[9px] font-black uppercase tracking-widest mb-1">Your Answer</div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center font-black text-white shrink-0 text-xs ${selectedAnswerIndex === 0 ? 'bg-red-500' : selectedAnswerIndex === 1 ? 'bg-blue-500' : selectedAnswerIndex === 2 ? 'bg-amber-500' : 'bg-green-500'}`}>
                                                {String.fromCharCode(65 + selectedAnswerIndex)}
                                            </div>
                                            <span className="text-xs md:text-sm font-bold text-red-100">{currentQuestion?.options[selectedAnswerIndex]?.text}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-xl bg-green-500/5 border border-green-500/20 text-left p-2.5 md:p-3">
                                    <div className="text-green-500/50 text-[9px] font-black uppercase tracking-widest mb-1">Correct Answer</div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center font-black text-white shrink-0 text-xs ${result.correctIndex === 0 ? 'bg-red-500' : result.correctIndex === 1 ? 'bg-blue-500' : result.correctIndex === 2 ? 'bg-amber-500' : 'bg-green-500'}`}>
                                            {String.fromCharCode(65 + result.correctIndex)}
                                        </div>
                                        <span className="text-xs md:text-sm font-bold text-green-100">{result.answerText || currentQuestion?.options[result.correctIndex]?.text}</span>
                                    </div>
                                </div>

                                {result.explanation && (
                                    <div className="rounded-2xl bg-teal-500/5 border border-teal-500/10 text-left p-3 md:p-4">
                                        <div className="flex items-center gap-2 text-teal-400 text-[9px] font-black uppercase tracking-widest mb-1">
                                            <Zap className="w-3 h-3 fill-teal-400" /> Explanation
                                        </div>
                                        <p className="text-[10px] md:text-xs text-slate-300 leading-relaxed font-medium">{result.explanation}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "leaderboard" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 w-full max-w-[280px] shadow-2xl">
                                <div className="text-5xl font-black text-white mb-1">
                                    #{leaderboard.findIndex(p => p.name === name) + 1}
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Current Rank</div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="h-12 flex items-center justify-between px-6 bg-black/60 backdrop-blur-md border-t border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="max-w-[120px] truncate">{name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>{isSimulation ? "Simulator" : "Live Arena"}</span>
                    <span className="text-slate-800">|</span>
                    <div className="flex items-center gap-1.5">
                        <MonitorPlay className="w-3 h-3" />
                        <span>AptiArena</span>
                    </div>
                </div>
            </div>
        </div >
    );
}

