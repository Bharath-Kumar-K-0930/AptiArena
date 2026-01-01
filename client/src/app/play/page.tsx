"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2, CheckCircle, XCircle, Loader2, MonitorPlay, ArrowRight, Play, Trophy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

import { Suspense } from "react";

function PlayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initial PIN from URL
    const [pin, setPin] = useState(searchParams.get("code") || "");
    const [name, setName] = useState("");

    const [gameState, setGameState] = useState<"join" | "waiting" | "playing" | "result" | "finished">("join");
    const [gameMode, setGameMode] = useState<string>("live");
    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [lastResult, setLastResult] = useState<{ isCorrect: boolean, score: number } | null>(null);
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
            setGameMode(mode || 'live');
            // Save session
            sessionStorage.setItem('quiz_pin', pin);
            if (name) sessionStorage.setItem('quiz_name', name);
            if (mode) sessionStorage.setItem('quiz_mode', mode);
        });

        newSocket.on("new_question", ({ question, index }) => {
            setGameState("playing");
            setCurrentQuestion(question);
            setQuestionIndex(index);
            setHasAnswered(false);
            setLastResult(null);
        });

        newSocket.on("answer_result", ({ isCorrect, score }) => {
            setLastResult({ isCorrect, score });
            setGameState("result");
            if (isCorrect) toast.success("Correct Answer!");
            else toast.error("Wrong Answer!");
        });

        newSocket.on("game_over", ({ leaderboard }) => {
            setGameState("finished");
            setLeaderboard(leaderboard);
            sessionStorage.removeItem('quiz_pin');
            sessionStorage.removeItem('quiz_name');
        });

        newSocket.on("error", (msg) => {
            setIsJoining(false);
            let friendlyMsg = msg;
            if (msg === 'Game not found') friendlyMsg = "We couldn't find a game with that PIN. Please double-check it!";
            if (msg === 'Game already started') friendlyMsg = "This game has already started. You can't join late, sorry!";

            setError(friendlyMsg);
            toast.error(friendlyMsg);

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

    const handleJoin = (e?: React.FormEvent) => {
        e?.preventDefault();
        setError("");
        if (socket && pin && name) {
            setIsJoining(true);
            socket.emit("join_game", { pin, name });
            sessionStorage.setItem('quiz_name', name); // Optimistic save
        }
    };

    const submitAnswer = (index: number) => {
        if (socket && !hasAnswered) {
            socket.emit("submit_answer", { pin, answerIndex: index, questionIndex });
            setHasAnswered(true);
        }
    };

    const nextQuestion = () => {
        if (socket) {
            socket.emit("request_question", { pin, index: questionIndex + 1 });
            setLastResult(null);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 z-0 select-none">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-background to-teal-900/20 z-10" />
                <motion.img
                    src="/images/hero-bg.png"
                    alt="Background"
                    className="w-full h-full object-cover opacity-30 fixed"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
                />
            </div>

            <AnimatePresence mode="wait">
                {gameState === "join" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md relative z-10"
                        key="join"
                    >
                        <Card className="bg-card/90 backdrop-blur-sm border-border shadow-2xl">
                            <CardHeader className="text-center space-y-2">
                                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal via-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal/20">
                                    <Play className="h-8 w-8 text-white fill-white" />
                                </div>
                                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal to-blue-500">
                                    Join Game
                                </CardTitle>
                                <CardDescription className="text-lg">
                                    Enter the PIN to start competing!
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleJoin} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground ml-1">GAME PIN</label>
                                            <Input
                                                placeholder="000 000"
                                                className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-background/50 border-2 focus-visible:ring-teal font-bold placeholder:text-muted-foreground/30"
                                                maxLength={6}
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^0-9]/g, '').slice(0, 6))}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground ml-1">NICKNAME</label>
                                            <Input
                                                placeholder="Enter your name"
                                                className="text-center text-lg h-12 bg-background/50 border-border focus-visible:ring-teal"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                maxLength={15}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-500 animate-in slide-in-from-top-2">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-lg font-bold bg-gradient-to-r from-teal to-emerald-600 hover:from-teal/90 hover:to-emerald-700 shadow-lg shadow-teal/25 transition-all"
                                        disabled={isJoining || !pin || !name}
                                    >
                                        {isJoining ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Joining...</>
                                        ) : (
                                            <>Enter Game <ArrowRight className="ml-2 h-5 w-5" /></>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {gameState === "waiting" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md relative z-10 text-center"
                        key="waiting"
                    >
                        <Card className="bg-card/90 backdrop-blur-sm border-border shadow-2xl overflow-hidden">
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-teal via-blue-500 to-purple-500 animate-gradient-x"></div>
                            <CardContent className="pt-12 pb-12 space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-teal/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-teal to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-teal/30">
                                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal to-blue-500">
                                        You're In!
                                    </h2>
                                    <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 inline-block">
                                        <span className="text-xl font-medium text-white">{name}</span>
                                    </div>
                                    <p className="text-muted-foreground animate-pulse">
                                        Waiting for the host to start the game...
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {gameState === "playing" && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl relative z-10"
                        key="playing"
                    >
                        {/* Playing State Implementation match QuestionCard */}
                        <Card className="bg-card/95 backdrop-blur border-border shadow-2xl overflow-hidden border-t-4 border-t-teal">
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-center leading-tight">
                                    {currentQuestion.text}
                                </h2>

                                {sessionStorage.getItem('quiz_mode') === 'slideshow' ? (
                                    <div className="py-12 px-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-center space-y-4">
                                        <MonitorPlay className="w-16 h-16 text-blue-400 mx-auto" />
                                        <h3 className="text-xl font-bold text-blue-300">Eyes on the Screen!</h3>
                                        <p className="text-muted-foreground">Look at the host's screen for options.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentQuestion.options.map((opt: any, i: number) => (
                                            <motion.button
                                                key={i}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => submitAnswer(i)}
                                                disabled={hasAnswered}
                                                className={`p-6 rounded-xl text-white font-bold text-lg shadow-lg relative overflow-hidden group transition-all
                                                    ${hasAnswered ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                                    ${i === 0 ? 'bg-red-500 hover:bg-red-400' : ''}
                                                    ${i === 1 ? 'bg-blue-500 hover:bg-blue-400' : ''}
                                                    ${i === 2 ? 'bg-yellow-500 hover:bg-yellow-400' : ''}
                                                    ${i === 3 ? 'bg-green-500 hover:bg-green-400' : ''}
                                                `}
                                            >
                                                <span className="relative z-10">{opt.text}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                {hasAnswered && (
                                    <div className="text-center p-4 bg-muted/50 rounded-lg animate-in fade-in">
                                        <p className="text-muted-foreground font-medium">Answer submitted! Waiting for results...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {gameState === "result" && lastResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md relative z-10"
                        key="result"
                    >
                        <Card className={`border-0 shadow-2xl overflow-hidden ${lastResult.isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                            <CardContent className="p-12 text-center text-white space-y-6">
                                {lastResult.isCorrect ? (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        type="spring"
                                        className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto"
                                    >
                                        <CheckCircle className="h-16 w-16 text-white" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto"
                                    >
                                        <XCircle className="h-16 w-16 text-white" />
                                    </motion.div>
                                )}

                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-wider mb-2">
                                        {lastResult.isCorrect ? "Correct!" : "Wrong!"}
                                    </h2>
                                    <p className="text-white/80 text-lg font-medium">
                                        {lastResult.isCorrect ? "+ " + lastResult.score + " points" : "Better luck next time"}
                                    </p>
                                </div>

                                {gameMode === 'practice' && (
                                    <Button className="w-full bg-white text-black hover:bg-white/90 font-bold mt-8" onClick={nextQuestion}>
                                        Next Question <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {gameState === "finished" && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md relative z-10"
                        key="finished"
                    >
                        <Card className="bg-card/90 backdrop-blur border-border shadow-2xl overflow-hidden">
                            <CardHeader className="text-center bg-gradient-to-r from-teal/10 to-blue-500/10 border-b border-border/50 pb-8">
                                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 drop-shadow-lg" />
                                <CardTitle className="text-3xl font-bold">Game Over</CardTitle>
                                <CardDescription>Here's how you did!</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {leaderboard.slice(0, 5).map((p, i) => (
                                        <div key={i} className={`flex items-center justify-between p-4 ${p.name === name ? 'bg-teal/10' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                                    ${i === 0 ? 'bg-yellow-500 text-black' :
                                                        i === 1 ? 'bg-gray-400 text-black' :
                                                            i === 2 ? 'bg-orange-500 text-black' : 'bg-muted text-muted-foreground'}
                                                `}>
                                                    {i + 1}
                                                </div>
                                                <span className={`font-medium ${p.name === name ? 'text-teal' : 'text-foreground'}`}>
                                                    {p.name} {p.name === name && '(You)'}
                                                </span>
                                            </div>
                                            <span className="font-mono font-bold text-lg">{p.score}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6">
                                    <Button className="w-full bg-gradient-to-r from-teal to-blue-600 hover:from-teal/90 hover:to-blue-700 text-white font-bold shadow-lg" onClick={() => window.location.reload()}>
                                        Play Another Game
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading Game...</div>}>
            <PlayContent />
        </Suspense>
    );
}
