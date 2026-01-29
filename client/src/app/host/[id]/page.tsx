"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, Play, Trophy, ArrowRight, Award, Star, PartyPopper, Zap, Lightbulb, PowerOff, Layout } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
// Assuming we don't have react-confetti installed, I'll use a simple embedded component or just CSS animations for now.
// If user really wants confetti package, I'd need to install it. I'll stick to CSS/Motion for now to avoid install steps.

export default function HostGamePage() {
    const { id } = useParams();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [pin, setPin] = useState<string | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const [status, setStatus] = useState<"loading" | "waiting" | "live" | "finished">("loading");
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const initialized = useRef(false);

    const [gameMode, setGameMode] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState("Initializing...");
    const [showAnswer, setShowAnswer] = useState(false);
    const [quizDetails, setQuizDetails] = useState<any>(null);

    // New State for Live Features
    const [answeredCount, setAnsweredCount] = useState(0);
    const [lastAnsweredPlayer, setLastAnsweredPlayer] = useState<string | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false); // Toggle intermediate leaderboard
    const [cheerMessage, setCheerMessage] = useState("");

    // Timer & Response Tracking
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [respondedPlayers, setRespondedPlayers] = useState<Set<string>>(new Set());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Confirmation Modals
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    // ... (useEffect for quiz details same as before)
    useEffect(() => {
        const fetchQuizDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQuizDetails(data);
                }
            } catch (error) {
                console.error("Failed to fetch quiz details", error);
            }
        };
        fetchQuizDetails();
    }, [id]);

    useEffect(() => {
        if (!gameMode || initialized.current) return;
        initialized.current = true;

        console.log("Connecting to socket...");
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Socket connected, creating game...", { quizId: id, gameMode });
            setConnectionStatus("Connected to Server");
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const hostId = user.id || user._id; // Handle both id formats

            if (!hostId) {
                toast.error("User ID not found. Please login again.");
                return;
            }

            newSocket.emit("create_game", { quizId: id, hostId, gameMode });
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            toast.error("Connection failed. Retrying...");
            setConnectionStatus("Connection Error");
        });

        newSocket.on("error", (msg) => {
            console.error("Socket error:", msg);
            toast.error(msg);
            setStatus("waiting"); // Fallback to avoid sticking on loading if possible, or handle specific errors
        });

        newSocket.on("game_created", ({ pin }) => {
            console.log("Game created:", pin);
            setPin(pin);
            setStatus("waiting");
            toast.success("Game Session Created!");
        });

        newSocket.on("player_joined", ({ name }) => {
            setPlayers((prev) => [...prev, name]);
            toast.info(`${name} joined the game!`);
        });

        newSocket.on("new_question", ({ question, index, total }) => {
            setStatus("live");
            setCurrentQuestion(question);
            setQuestionIndex(index);
            setTotalQuestions(total);
            setAnsweredCount(0);
            setLastAnsweredPlayer(null);
            setShowAnswer(false);
            setShowLeaderboard(false);
            setRespondedPlayers(new Set());

            // Start Timer
            if (question.timeLimit === 0) {
                setTimeLeft(null); // No timer
            } else if (question.timeLimit) {
                setTimeLeft(question.timeLimit);
            } else {
                setTimeLeft(30); // Default 30s
            }
        });

        newSocket.on("player_answered", ({ name, count, total }) => {
            setAnsweredCount(count);
            setLastAnsweredPlayer(name);
            setRespondedPlayers((prev) => new Set(prev).add(name));
        });

        newSocket.on("leaderboard_update", ({ leaderboard }) => {
            setLeaderboard(leaderboard);
            setShowLeaderboard(true);
        });

        newSocket.on("game_over", ({ leaderboard }) => {
            setStatus("finished");
            setLeaderboard(leaderboard);
        });

        return () => {
            newSocket.disconnect();
            initialized.current = false;
        };
    }, [id, gameMode]);

    const startGame = () => {
        if (socket && pin) {
            socket.emit("start_game", { pin });
        }
    };

    const nextQuestion = () => {
        if (socket && pin) {
            socket.emit("next_question", { pin });
        }
    };

    const endGame = () => {
        setShowEndConfirm(true);
    };

    const confirmEndGame = () => {
        if (socket && pin) {
            socket.emit("end_game", { pin });
            setShowEndConfirm(false);
        }
    };

    // Countdown Effect
    useEffect(() => {
        if (status === 'live' && timeLeft !== null && timeLeft > 0 && !showAnswer && !showLeaderboard) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, timeLeft, showAnswer, showLeaderboard]);

    // Auto-reveal when timer hits zero
    useEffect(() => {
        if (timeLeft !== null && timeLeft === 0 && !showAnswer && status === 'live') {
            setShowAnswer(true);
            // We might want to notify players that time is up, 
            // but the server's 'reveal_answer' is usually triggered by host.
            // Let's call the socket reveal if we're the host.
            if (socket && pin) {
                socket.emit("reveal_answer", { pin });
            }
        }
    }, [timeLeft, showAnswer, status, socket, pin]);

    // UI Helpers
    const getCheerMessage = (leaderName: string) => {
        const cheers = [
            `${leaderName} is on fire! 🔥`,
            `${leaderName} is unstoppable! 🚀`,
            `Look at ${leaderName} go! 🌟`,
            `${leaderName} is dominating the arena! 🏟️`
        ];
        return cheers[Math.floor(Math.random() * cheers.length)];
    };

    if (status === "loading" && !gameMode) {
        // ... (Selection UI same as before)
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
                <h1 className="text-4xl font-bold text-white mb-8">Select Game Mode</h1>
                <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
                    <Card className="bg-gray-900 border-gray-800 hover:border-blue-500 cursor-pointer transition-all hover:scale-105" onClick={() => setGameMode('live')}>
                        <CardHeader><CardTitle className="flex flex-col items-center gap-4 text-2xl text-white"><Trophy className="h-12 w-12 text-blue-500" /> Live Competition</CardTitle></CardHeader>
                        <CardContent className="text-gray-400">Classic trivia experience. Players answer together, leaderboard updates live.</CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-800 hover:border-green-500 cursor-pointer transition-all hover:scale-105" onClick={() => setGameMode('practice')}>
                        <CardHeader><CardTitle className="flex flex-col items-center gap-4 text-2xl text-white"><Users className="h-12 w-12 text-green-500" /> Practice Mode</CardTitle></CardHeader>
                        <CardContent className="text-gray-400">Self-paced. Players answer at their own speed with immediate feedback.</CardContent>
                    </Card>
                    <Card className="bg-gray-900 border-gray-800 hover:border-purple-500 cursor-pointer transition-all hover:scale-105" onClick={() => setGameMode('slideshow')}>
                        <CardHeader><CardTitle className="flex flex-col items-center gap-4 text-2xl text-white"><Play className="h-12 w-12 text-purple-500" /> Slide Show</CardTitle></CardHeader>
                        <CardContent className="text-gray-400">Presenter mode. Participants only see what you show on screen.</CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-teal-500/30 hover:border-teal-400 cursor-pointer transition-all hover:scale-105 shadow-[0_0_30px_rgba(20,184,166,0.1)]" onClick={() => window.location.href = `/host/practice/simulate/${id}`}>
                        <CardHeader><CardTitle className="flex flex-col items-center gap-4 text-2xl text-white"><Layout className="h-12 w-12 text-teal-400" /> Simulation Mode</CardTitle></CardHeader>
                        <CardContent className="text-gray-400">Dual-view testing. Simulate host and student perspectives side-by-side.</CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (status === "loading") return <div className="text-white text-center mt-10">Initializing Game Session...</div>;

    // ... (Waiting status same as before, simplified for this replace)

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col font-sans">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/quiz-bg-generated.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/70 to-slate-950/90" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 container mx-auto p-4 md:p-8 flex-1 flex flex-col items-center justify-center">

                {/* Floating Stats Bar - Fixed to screen to avoid overlap */}
                {status === "live" && gameMode !== 'slideshow' && (
                    <div className="fixed top-20 right-6 flex flex-col items-end gap-3 z-50">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-slate-900/90 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl min-w-[140px]"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Responded</div>
                                {timeLeft !== null && !showAnswer && (
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold transition-colors ${timeLeft <= 10 ? 'bg-red-500/20 border-red-500/30 text-red-400 animate-pulse' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'}`}>
                                        <Zap className={`w-3 h-3 ${timeLeft <= 10 ? 'fill-red-400' : ''}`} /> {timeLeft}s
                                    </div>
                                )}
                                {timeLeft === null && status === 'live' && !showAnswer && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-blue-500/20 border-blue-500/30 text-blue-400 text-[10px] font-bold">
                                        <Star className="w-3 h-3 fill-blue-400" /> Untimed
                                    </div>
                                )}
                            </div>
                            <div className="text-4xl font-black text-white flex items-baseline gap-1">
                                <span className={`${answeredCount === players.length && players.length > 0 ? 'text-green-400' : 'text-cyan-400'} drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]`}>{answeredCount}</span>
                                <span className="text-gray-600 text-xl">/</span>
                                <span className="text-gray-400 text-xl">{players.length}</span>
                            </div>
                        </motion.div>

                        {/* Waiting For List */}
                        <AnimatePresence>
                            {!showAnswer && players.length > respondedPlayers.size && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 max-w-[220px] text-right shadow-xl"
                                >
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-2 border-b border-white/5 pb-1">Waiting for</div>
                                    <div className="flex flex-wrap justify-end gap-1.5 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                                        {players.filter(p => !respondedPlayers.has(p)).map((name, i) => (
                                            <span key={i} className="text-[10px] text-gray-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 whitespace-nowrap">
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Waiting State */}
                {status === "waiting" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-4xl flex flex-col items-center space-y-8 text-center"
                    >
                        {gameMode === 'slideshow' ? (
                            // Slideshow Specific Lobby
                            <div className="space-y-8 animate-in fade-in duration-700">
                                <div className="space-y-4">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-sm text-purple-300 font-medium uppercase tracking-wider border border-purple-500/30">
                                        Presentation Mode
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 leading-tight drop-shadow-lg">
                                        {quizDetails?.title || "Ready to Present?"}
                                    </h1>
                                    <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
                                        Welcome, participants! We're about to begin.
                                    </p>
                                </div>

                                <Card className="bg-slate-900/60 border-purple-500/20 backdrop-blur-sm max-w-2xl mx-auto">
                                    <CardContent className="p-8">
                                        <div className="flex flex-col items-center gap-4 text-purple-200/80">
                                            <Play className="w-16 h-16 text-purple-500 mb-2" />
                                            <p className="text-lg">Use the controls to navigate through slides.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Button
                                    size="lg"
                                    className="text-2xl px-16 py-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:scale-105"
                                    onClick={startGame}
                                >
                                    <Play className="mr-3 h-8 w-8 fill-current" />
                                    Start Presentation
                                </Button>
                            </div>
                        ) : (
                            // Standard Lobby
                            <>
                                <div className="space-y-6 bg-slate-900/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                                        Join Code
                                    </h1>
                                    <div className="text-6xl md:text-8xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-widest drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                                        {pin}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xl text-gray-300">Join at <span className="font-bold text-white">aptiarena.com/play</span></p>
                                        <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-sm text-cyan-200 font-medium uppercase tracking-wider border border-white/10">
                                            Mode: {gameMode}
                                        </div>
                                    </div>
                                </div>

                                <Card className="w-full bg-slate-900/60 border-white/10 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-center gap-3 text-2xl text-white">
                                            <Users className="text-cyan-400 w-8 h-8" />
                                            Players Connected ({players.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {players.length === 0 ? (
                                            <div className="h-40 flex flex-col items-center justify-center text-gray-500 italic gap-2">
                                                <div className="w-3 h-3 bg-gray-600 rounded-full animate-ping" />
                                                Waiting for gladiators...
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                {players.map((p, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="bg-white/10 p-3 rounded-lg text-white font-medium text-center border border-white/5 hover:bg-white/20 transition-colors"
                                                    >
                                                        {p}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Button
                                    size="lg"
                                    className="text-2xl px-16 py-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all hover:scale-105"
                                    onClick={startGame}
                                    disabled={players.length === 0}
                                >
                                    <Play className="mr-3 h-8 w-8 fill-current" />
                                    Start Competition
                                </Button>
                            </>
                        )}
                    </motion.div>
                )}

                {/* Live State */}
                {status === "live" && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-5xl space-y-8 min-h-[70vh] flex flex-col relative"
                    >
                        {/* Live Stats Bar - Moved to top level for better visibility */}

                        {!showLeaderboard ? (
                            <div className="flex-1 flex flex-col justify-center h-full max-h-[85vh]">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-gray-400 border-b border-white/10 pb-4 mb-4 gap-4 shrink-0">
                                    <span className="text-lg font-medium bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                        Question <span className="text-white font-bold">{questionIndex + 1}</span> of {totalQuestions}
                                    </span>
                                    {gameMode === 'slideshow' && <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-500/30">Presentation Mode</span>}
                                </div>

                                <h1 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-lg mb-4 max-h-[20vh] overflow-y-auto flex items-center justify-center text-center">
                                    {currentQuestion.text}
                                </h1>

                                {currentQuestion.image && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-center mb-4 shrink"
                                    >
                                        <img src={currentQuestion.image} alt="Question" className="max-h-[25vh] md:max-h-[30vh] w-auto object-contain rounded-xl border-2 border-white/20 shadow-2xl bg-black/50" />
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full shrink">
                                    {currentQuestion.options.map((opt: any, i: number) => {
                                        // "Full Color" - Solid backgrounds with slight gradient
                                        const baseColors = [
                                            'bg-gradient-to-br from-red-500 to-red-700 border-red-900',
                                            'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-900',
                                            'bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-800',
                                            'bg-gradient-to-br from-green-500 to-green-700 border-green-900'
                                        ];

                                        let cardClass = "p-3 md:p-4 rounded-xl text-base md:text-lg font-bold transition-all duration-500 border-b-4 shadow-lg flex items-center relative overflow-hidden group ";

                                        if (showAnswer) {
                                            if (opt.isCorrect) {
                                                // Correct: Light transformation (Glowing Green)
                                                cardClass = "p-3 md:p-4 rounded-xl text-base md:text-lg font-bold transition-all duration-500 border-b-4 border-green-500 shadow-[0_0_50px_rgba(75,222,128,0.8)] flex items-center relative overflow-hidden group bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 text-white scale-105 z-10 ring-4 ring-green-300/50";
                                            } else {
                                                // Incorrect: Fade out
                                                cardClass = "p-3 md:p-4 rounded-xl text-base md:text-lg font-bold transition-all duration-500 border-b-4 shadow-none flex items-center relative overflow-hidden group bg-slate-800/80 border-transparent text-gray-500 opacity-30 grayscale blur-[1px]";
                                            }
                                        } else {
                                            // Default: Full Color
                                            cardClass += `${baseColors[i % 4]} text-white hover:brightness-110 hover:scale-[1.01] cursor-default`;
                                        }

                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={cardClass}
                                            >
                                                {/* Correct Answer Shine Effect */}
                                                {showAnswer && opt.isCorrect && (
                                                    <motion.div
                                                        initial={{ x: '-100%', opacity: 0 }}
                                                        animate={{ x: '200%', opacity: 0.5 }}
                                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform skew-x-12"
                                                        style={{ width: '50%' }}
                                                    />
                                                )}

                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-lg md:text-xl font-black bg-black/20 text-white/90 mr-3 shrink-0 relative z-10">
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <span className="leading-tight drop-shadow-md relative z-10">{opt.text}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {showAnswer && currentQuestion.explanation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        className="w-full bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-2 shrink-0 overflow-hidden"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
                                                <Lightbulb className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[10px] md:text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Reason for Correct Answer</h3>
                                                <p className="text-gray-200 text-xs md:text-sm leading-relaxed line-clamp-3 md:line-clamp-none overflow-y-auto max-h-[10vh]">
                                                    {currentQuestion.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex justify-center gap-4 mt-6 shrink-0">
                                    {!showAnswer && (
                                        <Button
                                            size="lg"
                                            className="text-base px-6 py-4 bg-white text-black hover:bg-gray-200 font-bold rounded-full transition-all shadow-lg hover:scale-105"
                                            onClick={() => setShowAnswer(true)}
                                        >
                                            <Star className="mr-2 h-4 w-4 text-yellow-500 fill-current" /> Reveal Answer
                                        </Button>
                                    )}
                                    {showAnswer && (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                            <Button
                                                size="lg"
                                                className="text-base px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(147,51,234,0.6)] hover:scale-105 transition-all"
                                                onClick={() => {
                                                    if (socket && pin) {
                                                        if (gameMode === 'slideshow') {
                                                            socket.emit("next_question", { pin });
                                                        } else {
                                                            socket.emit("show_leaderboard", { pin });
                                                        }
                                                    }
                                                }}
                                            >
                                                {gameMode === 'slideshow' ? (
                                                    <>Next Question <ArrowRight className="ml-2 h-5 w-5" /></>
                                                ) : (
                                                    <>Show Leaderboard <Trophy className="ml-2 h-5 w-5 text-yellow-300" /></>
                                                )}
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Intermediate Leaderboard View
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-5xl mx-auto flex-1 flex flex-col"
                            >
                                <div className="flex justify-between items-center mb-6 bg-slate-900/60 p-4 md:pr-32 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <h2 className="text-3xl font-black text-white flex items-center gap-4">
                                        <Trophy className="text-yellow-500 h-8 w-8 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
                                        Top Players
                                    </h2>
                                    <Button
                                        size="lg"
                                        className="text-lg px-6 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg"
                                        onClick={nextQuestion}
                                    >
                                        Next <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>

                                <Card className="bg-slate-900/40 border-white/10 backdrop-blur-sm shadow-2xl flex-1 overflow-hidden">
                                    <CardContent className="p-0">
                                        {leaderboard.length === 0 ? (
                                            <div className="p-12 text-center text-gray-500 text-xl">No scores to verify yet...</div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {leaderboard.slice(0, 5).map((p, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -50 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className={`flex justify-between items-center p-5 md:p-6 transition-colors hover:bg-white/5 
                                                            ${i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-6 md:gap-8">
                                                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl font-black shadow-lg ring-4 
                                                                ${i === 0 ? 'bg-yellow-400 text-black ring-yellow-500/30' :
                                                                    i === 1 ? 'bg-gray-300 text-black ring-gray-400/30' :
                                                                        i === 2 ? 'bg-orange-400 text-white ring-orange-500/30' : 'bg-slate-700 text-gray-400 ring-transparent'}`}>
                                                                {i + 1}
                                                            </div>
                                                            <div>
                                                                <div className="text-xl md:text-2xl font-bold text-white mb-1">{p.name}</div>
                                                                {p.streak > 2 && (
                                                                    <div className="text-orange-400 text-sm font-bold flex items-center gap-1.5 animate-pulse">
                                                                        <Zap className="h-3 w-3 fill-current" /> {p.streak} Streak 🔥
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-2xl md:text-3xl font-mono text-cyan-400 font-black tracking-tight">{p.score}</div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                        {/* End Quiz Button - Bottom Right (available throughout live phase) */}
                        <div className="fixed bottom-6 right-6 z-50">
                            <Button
                                variant="destructive"
                                className="rounded-xl shadow-xl hover:scale-105 transition-all gap-2"
                                onClick={endGame}
                            >
                                <PowerOff className="w-4 h-4" /> End Session
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Finished State - Split Layout */}
                {status === "finished" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-7xl relative z-20 flex flex-col h-full justify-center"
                    >
                        {/* Confetti */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                            {[...Array(50)].map((_, i) => (
                                <div key={i} className="absolute animate-fall" style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `-${Math.random() * 20}%`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                    backgroundColor: ['#fbbf24', '#f87171', '#60a5fa', '#4ade80'][Math.floor(Math.random() * 4)],
                                    width: '12px', height: '12px'
                                }} />
                            ))}
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                                {gameMode === 'slideshow' ? "Thank You!" : "Game Over!"}
                            </h1>
                            {gameMode === 'slideshow' && (
                                <p className="text-2xl text-gray-300 mt-4 max-w-3xl mx-auto">
                                    We hope you enjoyed the presentation!
                                </p>
                            )}
                        </div>

                        {gameMode === 'slideshow' ? (
                            <div className="flex justify-center mt-12">
                                <Button
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="text-xl px-12 py-6 bg-white text-black hover:bg-gray-200 rounded-full"
                                >
                                    Return to Dashboard
                                </Button>
                            </div>
                        ) : leaderboard.length <= 3 ? (
                            // Centered Layout for <= 3 Players
                            <div className="flex flex-col items-center justify-center gap-8">
                                <div className="flex items-end justify-center gap-4 md:gap-8">
                                    {/* Silver - 2nd */}
                                    {leaderboard[1] && (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
                                            <div className="text-2xl font-bold text-gray-300 mb-2">{leaderboard[1].name}</div>
                                            <div className="w-24 h-32 md:w-32 md:h-40 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg shadow-lg flex items-start justify-center pt-4 text-4xl font-black text-gray-600 border-t-4 border-gray-100">
                                                2
                                            </div>
                                            <div className="bg-gray-800 px-4 py-1 rounded-full mt-2 text-gray-400 font-mono font-bold">{leaderboard[1].score} pts</div>
                                        </div>
                                    )}

                                    {/* Gold - 1st */}
                                    {leaderboard[0] && (
                                        <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-20 fade-in duration-700">
                                            <Trophy className="h-16 w-16 text-yellow-400 mb-2 animate-bounce" />
                                            <div className="text-4xl font-bold text-yellow-300 mb-4">{leaderboard[0].name}</div>
                                            <div className="w-32 h-40 md:w-40 md:h-56 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-lg shadow-2xl flex items-start justify-center pt-6 text-6xl font-black text-yellow-700 border-t-4 border-yellow-100 relative">
                                                1
                                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                            </div>
                                            <div className="bg-yellow-900/80 px-6 py-2 rounded-full mt-4 text-yellow-300 font-mono font-bold text-xl border border-yellow-500/50">{leaderboard[0].score} pts</div>
                                        </div>
                                    )}

                                    {/* Bronze - 3rd */}
                                    {leaderboard[2] && (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-700 delay-500">
                                            <div className="text-2xl font-bold text-orange-300 mb-2">{leaderboard[2].name}</div>
                                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg shadow-lg flex items-start justify-center pt-4 text-4xl font-black text-orange-800 border-t-4 border-orange-200">
                                                3
                                            </div>
                                            <div className="bg-orange-900/50 px-4 py-1 rounded-full mt-2 text-orange-400 font-mono font-bold">{leaderboard[2].score} pts</div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-12">
                                    <Button
                                        onClick={() => window.location.href = '/dashboard'}
                                        className="text-xl px-12 py-6 bg-white text-black hover:bg-gray-200 rounded-full shadow-lg hover:scale-105 transition-all"
                                    >
                                        Return to Dashboard
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Split Layout for > 3 Players
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                                {/* Left Side: The Podium */}
                                <div className="flex flex-col gap-6 justify-center">
                                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                                        {/* 1st Place Card */}
                                        <div className="flex items-center gap-6 p-6 mb-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform border-4 border-yellow-300">
                                            <Trophy className="h-16 w-16 text-yellow-100 drop-shadow-md" />
                                            <div>
                                                <div className="text-yellow-100 font-bold uppercase tracking-wider text-sm">Winner</div>
                                                <div className="text-4xl font-black text-white">{leaderboard[0]?.name}</div>
                                                <div className="text-yellow-100 font-mono font-bold text-xl">{leaderboard[0]?.score} pts</div>
                                            </div>
                                        </div>

                                        {/* 2nd Place Card */}
                                        <div className="flex items-center gap-6 p-4 mb-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl shadow-md border-4 border-gray-100 ml-8">
                                            <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-2xl">2</div>
                                            <div>
                                                <div className="text-gray-100 font-bold uppercase tracking-wider text-xs">Runner Up</div>
                                                <div className="text-2xl font-black text-white">{leaderboard[1]?.name}</div>
                                                <div className="text-gray-100 font-mono font-bold">{leaderboard[1]?.score} pts</div>
                                            </div>
                                        </div>

                                        {/* 3rd Place Card */}
                                        <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl shadow-md border-4 border-orange-200 ml-16">
                                            <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-2xl">3</div>
                                            <div>
                                                <div className="text-orange-100 font-bold uppercase tracking-wider text-xs">Third Place</div>
                                                <div className="text-2xl font-black text-white">{leaderboard[2]?.name}</div>
                                                <div className="text-orange-100 font-mono font-bold">{leaderboard[2]?.score} pts</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: The Rest */}
                                <Card className="bg-slate-900/60 border-white/10 backdrop-blur-md h-[50vh] overflow-hidden flex flex-col">
                                    <CardHeader className="bg-white/5 py-4 shrink-0">
                                        <CardTitle className="text-gray-400 text-sm uppercase tracking-widest flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Honorable Mentions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1">
                                        <div className="divide-y divide-white/5">
                                            {leaderboard.slice(3).map((p, i) => (
                                                <div key={i + 3} className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-gray-400 flex items-center justify-center font-bold text-sm">
                                                            {i + 4}
                                                        </div>
                                                        <span className="text-gray-300 text-lg font-medium">{p.name}</span>
                                                    </div>
                                                    <span className="font-mono text-cyan-500 font-bold">{p.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 bg-white/5 shrink-0">
                                        <Button
                                            variant="outline"
                                            className="w-full border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                                            onClick={() => window.location.href = '/dashboard'}
                                        >
                                            Return to Dashboard
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Custom End Confirmation Modal */}
                <AnimatePresence>
                    {showEndConfirm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                            >
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                        <PowerOff className="w-10 h-10 text-red-500" />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white">End Quiz Session?</h3>
                                        <p className="text-gray-400">
                                            This will immediately terminate the game for all participants and show the final leaderboard. This action cannot be undone.
                                        </p>
                                    </div>

                                    <div className="flex flex-col w-full gap-3 pt-4">
                                        <Button
                                            variant="destructive"
                                            size="lg"
                                            className="w-full rounded-2xl py-6 font-bold text-lg shadow-lg hover:shadow-red-500/20"
                                            onClick={confirmEndGame}
                                        >
                                            Yes, End Session
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            className="w-full rounded-2xl py-6 font-bold text-gray-400 hover:text-white hover:bg-white/5"
                                            onClick={() => setShowEndConfirm(false)}
                                        >
                                            No, Keep Playing
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
