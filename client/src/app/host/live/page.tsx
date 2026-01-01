"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, StopCircle, BarChart3, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Suspense } from "react";

function HostLiveContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pin = searchParams.get("pin");
    const mode = searchParams.get("mode") || "live";

    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [qIndex, setQIndex] = useState(0);
    const [totalQ, setTotalQ] = useState(0);
    const [answerCount, setAnswerCount] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [status, setStatus] = useState("live");
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        if (!socket.connected) socket.connect();

        // Listen for events
        socket.on("new_question", (data: any) => {
            setCurrentQuestion(data.question);
            setQIndex(data.index);
            setTotalQ(data.total);
            setAnswerCount(0);
            setShowResults(false);
            setTimer(data.question.timeLimit || 30);
        });

        socket.on("player_answered", (data: any) => {
            setAnswerCount(prev => prev + data.count);
        });

        socket.on("game_over", (data: any) => {
            setStatus("finished");
            setLeaderboard(data.leaderboard);
        });

        return () => {
            socket.off("new_question");
            socket.off("player_answered");
            socket.off("game_over");
        };
    }, []);

    // Timer effect for Live mode
    useEffect(() => {
        if (mode === "live" && timer > 0 && !showResults && status === 'live') {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && !showResults && mode === 'live') {
            setShowResults(true); // Auto show results when time is up
        }
    }, [timer, showResults, mode, status]);

    const nextQuestion = () => {
        socket.emit("next_question", { pin });
    };

    const endGame = () => {
        // Logic to forcibly end game or just navigate away
        router.push("/dashboard");
    };

    if (status === "finished") {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-2xl bg-gray-900 border-gray-800">
                    <CardHeader className="text-center border-b border-gray-800 pb-6">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            Game Over!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {leaderboard.map((p, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${i === 0 ? 'bg-yellow-900/20 border-yellow-500/50' :
                                        i === 1 ? 'bg-gray-800 border-gray-600' :
                                            i === 2 ? 'bg-orange-900/20 border-orange-700' : 'bg-gray-900 border-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <span className="text-xl font-medium">{p.name}</span>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-400">{p.score}</span>
                                </motion.div>
                            ))}
                        </div>
                        <Button onClick={() => router.push('/dashboard')} className="w-full mt-8 h-12 text-lg bg-blue-600 hover:bg-blue-700">
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!currentQuestion) return <div className="p-10 text-white text-center">Loading game state...</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-gray-900 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 px-3 py-1 rounded text-sm font-bold">PIN: {pin}</div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Users size={16} /> {answerCount} Answers
                    </div>
                </div>
                <div className="text-xl font-mono font-bold text-blue-400">
                    Q{qIndex + 1} / {totalQ}
                </div>
                <Button variant="destructive" size="sm" onClick={endGame}><StopCircle className="mr-2 h-4 w-4" /> End Game</Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full gap-8">

                {/* Question */}
                <div className="w-full text-center space-y-6">
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight">{currentQuestion.text}</h1>
                    {mode === 'live' && (
                        <div className="w-full max-w-3xl mx-auto">
                            <Progress value={(timer / 30) * 100} className="h-2 bg-gray-800" indicatorClassName={timer < 10 ? "bg-red-500" : "bg-blue-500"} />
                            <div className="mt-2 text-right font-mono text-xl">{timer}s</div>
                        </div>
                    )}
                </div>

                {/* Options / Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {currentQuestion.options.map((opt: any, i: number) => (
                        <Card
                            key={i}
                            className={`border-2 transition-all duration-500 flex items-center justify-center p-6 min-h-[120px] ${showResults
                                ? opt.isCorrect
                                    ? 'bg-green-600 border-green-400 opacity-100'
                                    : 'bg-gray-900 border-gray-800 opacity-50'
                                : 'bg-gray-800 border-gray-700'
                                }`}
                        >
                            <span className="text-2xl font-semibold text-center">{opt.text}</span>
                        </Card>
                    ))}
                </div>

                {/* Controls */}
                <div className="mt-auto pt-8 pb-4 w-full flex justify-end">
                    {!showResults && mode === 'live' ? (
                        <Button
                            size="lg"
                            onClick={() => setShowResults(true)}
                            className="h-14 px-8 text-xl bg-yellow-600 hover:bg-yellow-700"
                        >
                            Show Results <BarChart3 className="ml-2" />
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={nextQuestion}
                            className="h-14 px-8 text-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/50"
                        >
                            Next Question <ChevronRight className="ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function Trophy(props: any) {
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
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}

export default function HostLivePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Live Game...</div>}>
            <HostLiveContent />
        </Suspense>
    );
}
