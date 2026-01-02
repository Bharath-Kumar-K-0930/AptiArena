"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, Play, Trophy, ArrowRight, Award, Star, PartyPopper, Zap } from "lucide-react";
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
        });

        newSocket.on("player_answered", ({ name, count, total }) => {
            setAnsweredCount(count);
            setLastAnsweredPlayer(name);
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
                </div>
            </div>
        );
    }

    if (status === "loading") return <div className="text-white text-center mt-10">Initializing Game Session...</div>;

    // ... (Waiting status same as before, simplified for this replace)

    return (
        <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">

            {/* Waiting State (Abbreviated) */}
            {status === "waiting" && (
                <>
                    {/* ... existing waiting UI ... */}
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-white">Join Code</h1>
                        <div className="text-7xl font-mono font-bold text-blue-500 tracking-widest">{pin}</div>
                        <p className="text-gray-400">Go to aptiarena.com/play and enter this code</p>
                        <div className="inline-block px-4 py-1 rounded-full bg-gray-800 text-sm text-gray-300 uppercase tracking-wide border border-gray-700">Mode: {gameMode}</div>
                    </div>
                    <Card className="w-full max-w-3xl bg-gray-900 border-gray-800">
                        <CardHeader><CardTitle className="flex items-center justify-center gap-2"><Users className="text-purple-500" /> Players ({players.length})</CardTitle></CardHeader>
                        <CardContent>
                            {players.length === 0 ? <div className="h-32 flex items-center justify-center text-gray-500 italic">Waiting for players to join...</div> :
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{players.map((p, i) => <div key={i} className="bg-gray-800 p-3 rounded text-white animate-in zoom-in">{p}</div>)}</div>}
                        </CardContent>
                    </Card>
                    <Button size="lg" className="text-xl px-12 py-6 bg-green-600 hover:bg-green-700" onClick={startGame} disabled={players.length === 0 && gameMode !== 'slideshow'}><Play className="mr-2 h-6 w-6" /> {gameMode === 'slideshow' ? 'Start Presentation' : 'Start Game'}</Button>
                </>
            )}

            {/* Live State (Enhanced) */}
            {status === "live" && currentQuestion && (
                <div className="w-full max-w-5xl space-y-8 min-h-[60vh] flex flex-col justify-center relative">

                    {/* Live Stats Bar */}
                    <div className="absolute top-0 right-0 p-4 bg-gray-900/80 rounded-xl border border-gray-800 backdrop-blur-sm">
                        <div className="text-sm text-gray-400 mb-1">Answers</div>
                        <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                            <span className="text-green-500">{answeredCount}</span>
                            <span className="text-gray-600">/</span>
                            <span>{players.length}</span>
                        </div>
                    </div>

                    {!showLeaderboard ? (
                        <>
                            <div className="flex justify-between items-center text-gray-400 border-b border-gray-800 pb-4">
                                <span className="text-lg">Question {questionIndex + 1} / {totalQuestions}</span>
                                {gameMode === 'slideshow' && <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30">Presentation Mode</span>}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{currentQuestion.text}</h1>

                            {currentQuestion.image && (
                                <div className="flex justify-center my-6"><img src={currentQuestion.image} alt="Question" className="max-h-[40vh] w-auto object-contain rounded-xl border-2 border-gray-700 shadow-2xl" /></div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                {currentQuestion.options.map((opt: any, i: number) => {
                                    let cardClass = "p-8 rounded-xl text-2xl font-semibold transition-all duration-300 border-2 ";
                                    if (showAnswer) {
                                        if (opt.isCorrect) cardClass += "bg-green-600/20 border-green-500 text-green-100 shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-105";
                                        else cardClass += "bg-gray-800/50 border-transparent text-gray-500 opacity-50";
                                    } else {
                                        const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
                                        cardClass += `${colors[i % 4]} border-transparent text-white`;
                                    }
                                    return <div key={i} className={cardClass}><div className="flex items-center gap-4"><span className="opacity-70 text-lg uppercase tracking-wider">{String.fromCharCode(65 + i)}</span><span>{opt.text}</span></div></div>;
                                })}
                            </div>

                            <div className="flex justify-center gap-4 mt-12">
                                {!showAnswer && <Button size="lg" variant="outline" className="text-xl px-8 py-6 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10" onClick={() => setShowAnswer(true)}>Eye Reveal Answer</Button>}
                                {showAnswer && (
                                    <>
                                        <Button size="lg" className="text-xl px-8 py-6 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20"
                                            onClick={() => {
                                                if (socket && pin) {
                                                    socket.emit("show_leaderboard", { pin });
                                                }
                                            }}>
                                            Show Leaderboard <Trophy className="ml-2 h-6 w-6" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        // Intermediate Leaderboard View
                        <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-10">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <Trophy className="text-yellow-500 h-8 w-8" /> Leaderboard
                                </h2>
                                <Button size="lg" className="text-lg bg-teal-600 hover:bg-teal-500 text-white" onClick={nextQuestion}>
                                    Next Question <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>

                            <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                                <CardContent className="p-0">
                                    {leaderboard.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">No data available yet...</div>
                                    ) : (
                                        <div className="divide-y divide-gray-800">
                                            {leaderboard.slice(0, 5).map((p, i) => (
                                                <div key={i} className={`flex justify-between items-center p-6 ${i === 0 ? 'bg-yellow-900/10' : ''}`}>
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold 
                                                            ${i === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' :
                                                                i === 1 ? 'bg-gray-400 text-black' :
                                                                    i === 2 ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-xl font-bold text-white">{p.name}</div>
                                                            {p.streak > 2 && <div className="text-xs text-orange-400 font-bold flex items-center gap-1"><Zap className="h-3 w-3" /> {p.streak} Streak</div>}
                                                        </div>
                                                    </div>
                                                    <div className="text-2xl font-mono text-teal-400 font-bold">{p.score}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Finished State (Celebration) */}
            {status === "finished" && (
                <div className="space-y-8 animate-in zoom-in relative">
                    {/* Confetti Effect (CSS only for now) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="absolute animate-fall" style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                backgroundColor: ['#ff0', '#f00', '#0f0', '#00f'][Math.floor(Math.random() * 4)],
                                width: '10px', height: '10px'
                            }} />
                        ))}
                    </div>

                    <Trophy className="h-24 w-24 text-yellow-500 mx-auto animate-bounce" />
                    <h1 className="text-5xl font-black text-white bg-clip-text text-transparent bg-gradient-to-br from-yellow-300 via-orange-500 to-red-500">
                        Winner!
                    </h1>
                    {leaderboard.length > 0 && (
                        <div className="text-2xl text-yellow-300 font-medium mb-8">
                            {getCheerMessage(leaderboard[0].name)}
                        </div>
                    )}

                    <Card className="w-full max-w-lg bg-gray-900 border-gray-800 mx-auto shadow-2xl shadow-yellow-500/10">
                        <CardHeader><CardTitle className="text-2xl">Final Leaderboard</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {leaderboard.map((p, i) => (
                                <div key={i} className={`flex justify-between items-center p-4 rounded-lg transition-all hover:scale-105 ${i === 0 ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 border border-yellow-500/50' : 'bg-gray-800'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                            {i + 1}
                                        </div>
                                        <span className="text-white text-lg font-medium">{p.name}</span>
                                    </div>
                                    <span className="font-mono text-blue-400 font-bold">{p.score} pts</span>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter><Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button></CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
