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

        newSocket.on("answer_revealed", ({ correctIndex, explanation }) => {
            setGameState("result");
            setResult((prev: any) => ({ ...prev, correctIndex, explanation }));
        });

        newSocket.on("leaderboard_update", () => {
            setGameState("leaderboard");
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white">
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
        <div className="min-h-screen bg-slate-950 p-4 flex flex-col">
            <div className="flex-1 flex flex-col justify-center">

                {gameState === "playing" && currentQuestion && (
                    <div className="space-y-8">
                        <div className="text-white text-center space-y-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                                Question {questionIndex + 1}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight px-2">
                                {currentQuestion.text}
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['A', 'B', 'C', 'D'].map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className={`
                                        h-40 rounded-2xl flex items-center justify-center text-5xl font-black text-white shadow-xl transition-transform active:scale-95
                                        ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-yellow-500' : 'bg-green-500'}
                                    `}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === "submitted" && (
                    <div className="text-center space-y-6 text-white animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_50px_rgba(20,184,166,0.5)]">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold">Answer Submitted!</h2>
                        <p className="text-gray-400">Wait for the host to reveal the answer...</p>
                    </div>
                )}

                {gameState === "result" && result && (
                    <div className={`text-center space-y-6 text-white animate-in fade-in zoom-in duration-300`}>
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 border-4 ${result.isCorrect ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'}`}>
                            {result.isCorrect ? <CheckCircle className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
                        </div>
                        <h2 className="text-4xl font-black">{result.isCorrect ? "Correct!" : "Incorrect"}</h2>
                        <div className="bg-white/10 p-4 rounded-xl inline-block mb-4">
                            <span className="text-sm text-gray-400 uppercase tracking-widest block mb-1">Score</span>
                            <span className="text-3xl font-mono">+{result.score}</span>
                        </div>
                        {result.explanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-blue-900/30 p-4 rounded-xl border border-blue-500/30 max-w-sm mx-auto"
                            >
                                <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Reason</div>
                                <p className="text-blue-100 text-sm">{result.explanation}</p>
                            </motion.div>
                        )}
                    </div>
                )}

                {gameState === "leaderboard" && (
                    <div className="text-center space-y-6 text-white">
                        <BarChart3 className="w-20 h-20 text-purple-400 mx-auto" />
                        <h2 className="text-3xl font-bold">Leaderboard Updated!</h2>
                        <p className="text-lg text-gray-400">Locked in. Check the main screen.</p>
                    </div>
                )}
            </div>

            <div className="h-14 flex items-center justify-between text-gray-500 text-sm">
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
