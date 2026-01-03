"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2, CheckCircle, XCircle, Loader2, MonitorPlay, ArrowRight, Play, Trophy, AlertCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

function PlayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initial PIN from URL
    const [pin, setPin] = useState(searchParams.get("code") || "");
    const [name, setName] = useState("");

    const [gameState, setGameState] = useState<"join" | "waiting" | "playing" | "submitted" | "result" | "leaderboard" | "finished">("join");
    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [hasAnswered, setHasAnswered] = useState(false);

    // Result holds { isCorrect, score, correctIndex }
    const [result, setResult] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
        setSocket(newSocket);

        // Auto-rejoin if session exists
        const savedPin = sessionStorage.getItem('quiz_pin');
        const savedName = sessionStorage.getItem('quiz_name');

        if (savedPin && savedName && !pin) {
            setPin(savedPin);
            setName(savedName);
            newSocket.emit("join_game", { pin: savedPin, name: savedName });
        }

        newSocket.on("joined_game", ({ pin, mode }) => {
            setIsJoining(false);
            setGameState("waiting");
            // Save session
            sessionStorage.setItem('quiz_pin', pin);
            if (name) sessionStorage.setItem('quiz_name', name);
        });

        newSocket.on("new_question", ({ question, index }) => {
            setGameState("playing");
            setCurrentQuestion(question);
            setQuestionIndex(index);
            setHasAnswered(false);
            setResult(null); // Reset result
        });

        // Acknowledgement only - do NOT show result yet
        newSocket.on("answer_result", ({ isCorrect, score }) => {
            setGameState("submitted");
            // Store result silently, wait for reveal
            setResult({ isCorrect, score });
        });

        newSocket.on("answer_revealed", ({ correctIndex, explanation, leaderboard, answerText }) => {
            setGameState("result");
            setResult((prev: any) => ({ ...prev, correctIndex, explanation, answerText }));
            if (leaderboard) setLeaderboard(leaderboard);
        });

        newSocket.on("leaderboard_update", ({ leaderboard }) => {
            setGameState("leaderboard");
            if (leaderboard) setLeaderboard(leaderboard);
        });

        newSocket.on("game_over", ({ leaderboard }) => {
            setGameState("finished");
            setLeaderboard(leaderboard);
            sessionStorage.removeItem('quiz_pin');
            sessionStorage.removeItem('quiz_name');
        });

        newSocket.on("error", (msg) => {
            setIsJoining(false);
            setError(msg);
            toast.error(msg);
            if (msg === 'Game not found' || msg === 'Game already started') {
                sessionStorage.removeItem('quiz_pin');
                sessionStorage.removeItem('quiz_name');
                setGameState("join");
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);
        if (socket && pin && name) {
            socket.emit("join_game", { pin, name });
        }
    };

    const handleAnswer = (index: number) => {
        if (hasAnswered || gameState !== "playing") return;
        setHasAnswered(true);
        if (socket) {
            socket.emit("submit_answer", { pin, answerIndex: index, questionIndex });
        }
    };

    if (gameState === "join") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/hero-bg.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-black/80" />
                </div>

                <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white relative z-10 shadow-2xl">
                    <CardHeader className="text-center">
                        <MonitorPlay className="w-12 h-12 mx-auto text-teal-400 mb-4" />
                        <CardTitle className="text-3xl font-bold">Join Quiz</CardTitle>
                        <CardDescription className="text-gray-300">Enter code to enter the arena</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <Input
                                placeholder="Game PIN"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="bg-black/50 border-white/20 text-white text-center text-2xl tracking-widest placeholder:tracking-normal h-14"
                            />
                            <Input
                                placeholder="Enter Nickname"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-black/50 border-white/20 text-white text-center text-lg h-12"
                            />
                            <Button type="submit" className="w-full h-12 bg-teal hover:bg-teal/80 text-lg font-bold" disabled={isJoining}>
                                {isJoining ? <Loader2 className="animate-spin" /> : "Enter Arena"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (gameState === "waiting") {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-teal-500 blur-3xl opacity-20 animate-pulse" />
                    <img src="/logo.png" className="w-32 h-32 relative z-10" alt="Logo" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-white mb-2">You're In!</h2>
                    <p className="text-xl text-teal-400 font-medium">See your name on screen?</p>
                </div>
                <div className="flex gap-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        );
    }

    if (gameState === "finished") {
        const myRank = leaderboard.findIndex(p => p.name === name) + 1;
        const myScore = leaderboard.find(p => p.name === name)?.score || 0;

        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
                <Trophy className="w-24 h-24 text-yellow-500 mb-6 animate-bounce" />
                <h1 className="text-4xl font-bold mb-2">Quiz Completed!</h1>
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 text-center w-full max-w-sm space-y-4">
                    <div>
                        <div className="text-gray-500 text-sm uppercase tracking-wider">Final Score</div>
                        <div className="text-4xl font-mono text-teal-400">{myScore}</div>
                    </div>
                    {myRank > 0 && (
                        <div>
                            <div className="text-gray-500 text-sm uppercase tracking-wider">Rank</div>
                            <div className="text-2xl font-bold text-white">#{myRank}</div>
                        </div>
                    )}
                </div>
                <Button onClick={() => window.location.href = '/'} className="mt-8 bg-white text-black">Back to Home</Button>
            </div>
        );
    }

    // Active Game States (Playing, Submitted, Result, Leaderboard)
    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col font-sans">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/quiz-bg-generated.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/90" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center p-4 md:p-6 max-w-4xl mx-auto w-full">
                {gameState === "playing" && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 md:space-y-8"
                    >
                        <div className="text-white text-center space-y-4">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-cyan-200 text-xs font-bold uppercase tracking-wider border border-white/10 backdrop-blur-md">
                                Question {questionIndex + 1}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black leading-tight px-2 drop-shadow-lg">
                                {currentQuestion.text}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options.map((option: any, i: number) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => handleAnswer(i)}
                                    className={`
                                        p-6 rounded-2xl flex items-center gap-4 text-left shadow-lg transition-transform active:scale-95 border-b-6 border-black/20 hover:brightness-110 relative overflow-hidden group
                                        ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-yellow-500' : 'bg-green-500'}
                                    `}
                                >
                                    <div className="bg-black/20 w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white shrink-0 group-hover:scale-110 transition-transform">
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="text-lg md:text-xl font-bold text-white leading-tight">
                                        {option.text}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {gameState === "submitted" && (
                    <div className="text-center space-y-8 text-white animate-in fade-in zoom-in duration-500">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-teal-500 blur-2xl opacity-40 animate-pulse" />
                            <div className="w-28 h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl relative z-10">
                                <CheckCircle className="w-14 h-14 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black mb-2">Answer Locked!</h2>
                            <p className="text-cyan-200/80 font-medium">Fingers crossed... 🤞</p>
                        </div>
                        <div className="w-16 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-teal-500 animate-progress w-full origin-left" />
                        </div>
                    </div>
                )}

                {gameState === "result" && result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6 text-white"
                    >
                        <div className={`w-36 h-36 rounded-full flex items-center justify-center mx-auto mb-4 border-8 shadow-2xl ${result.isCorrect ? 'bg-green-500 border-green-400 shadow-green-500/30' : 'bg-red-500 border-red-400 shadow-red-500/30'}`}>
                            {result.isCorrect ? <CheckCircle className="w-20 h-20" /> : <XCircle className="w-20 h-20" />}
                        </div>
                        <h2 className="text-5xl font-black drop-shadow-md">{result.isCorrect ? "Correct!" : "Incorrect"}</h2>

                        <div className="flex justify-center gap-4">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl inline-block min-w-[120px] border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1 font-bold">Total Score</span>
                                <span className="text-4xl font-mono font-bold text-cyan-300">{result.score || (leaderboard.find(p => p.name === name)?.score) || 0}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl inline-block min-w-[120px] border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1 font-bold">Rank</span>
                                <span className="text-4xl font-mono font-bold text-yellow-400">
                                    #{leaderboard.findIndex(p => p.name === name) !== -1 ? leaderboard.findIndex(p => p.name === name) + 1 : '-'}
                                </span>
                            </div>
                        </div>

                        {/* Show Correct Answer */}
                        <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 max-w-md mx-auto shadow-xl backdrop-blur-md text-left">
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-white/5 pb-2">The Correct Answer Was</div>
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg
                                    ${result.correctIndex === 0 ? 'bg-red-500' : result.correctIndex === 1 ? 'bg-blue-500' : result.correctIndex === 2 ? 'bg-yellow-500' : 'bg-green-500'}
                                `}>
                                    {String.fromCharCode(65 + (result.correctIndex || 0))}
                                </div>
                                <span className="text-xl font-bold text-white leading-snug">
                                    {result.answerText || currentQuestion?.options[result.correctIndex || 0]?.text}
                                </span>
                            </div>
                        </div>

                        {result.explanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-blue-900/40 p-5 rounded-2xl border border-blue-500/30 max-w-md mx-auto backdrop-blur-sm"
                            >
                                <div className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Explanation
                                </div>
                                <p className="text-blue-100 text-sm leading-relaxed">{result.explanation}</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {gameState === "leaderboard" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8 text-white"
                    >
                        <Trophy className="w-20 h-20 text-purple-400 mx-auto animate-bounce drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />

                        <div className="bg-gradient-to-b from-purple-900/40 to-slate-900/40 p-10 rounded-[2rem] border border-purple-500/30 max-w-sm mx-auto shadow-2xl backdrop-blur-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative z-10">
                                <div className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-4">Your Current Standing</div>
                                <div className="text-8xl font-black text-white mb-4 flex items-center justify-center gap-2 drop-shadow-lg">
                                    <span className="text-5xl text-purple-500 align-top opacity-50">#</span>
                                    {leaderboard.findIndex(p => p.name === name) !== -1 ? leaderboard.findIndex(p => p.name === name) + 1 : '-'}
                                </div>
                                <div className="inline-block px-6 py-2 rounded-full bg-purple-500/20 text-purple-100 font-mono font-bold border border-purple-500/20 shadow-lg">
                                    {leaderboard.find(p => p.name === name)?.score || 0} pts
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-400 text-sm animate-pulse">Check the big screen for full rankings! 👀</p>
                    </motion.div>
                )}
            </div>

            <div className="h-14 flex items-center justify-between text-gray-500/50 text-xs uppercase font-bold tracking-widest px-6 relative z-10">
                <span>{name}</span>
                <span>{result?.score ? `Last: ${result.score}` : ''}</span>
            </div>
        </div>
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Arena...</div>}>
            <PlayContent />
        </Suspense>
    )
}
