"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Play, Edit, Trash, Users, Trophy, BookOpen, Clock, Monitor } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: any[];
    difficulty: string;
    accessCode: string;
    createdAt: string;
}

interface Stats {
    totalQuizzes: number;
    totalSessions: number;
    totalParticipants: number;
    totalQuestions?: number;
    joinedQuizzes?: number;
    avgScore?: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [stats, setStats] = useState<Stats>({ totalQuizzes: 0, totalSessions: 0, totalParticipants: 0 });
    const [loading, setLoading] = useState(true);
    const [memberSince, setMemberSince] = useState<string>("N/A");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const userData = localStorage.getItem("user");
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    const date = new Date(parsedUser.createdAt || Date.now());
                    setMemberSince(date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
                }
            } catch (e) {
                console.error("User data parsing error", e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const headers = { Authorization: `Bearer ${token}` };
                const quizRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/my`, { headers });
                const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/stats`, { headers });

                if (quizRes.ok && statsRes.ok) {
                    const quizData = await quizRes.json();
                    const statsData = await statsRes.json();
                    setQuizzes(quizData);
                    setStats(statsData);
                } else {
                    if (quizRes.status === 401 || statsRes.status === 401) {
                        localStorage.removeItem("token");
                        router.push("/login");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50 relative">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-8 space-y-8 overflow-y-auto h-[calc(100vh-4rem)] scroll-smooth">
                {/* Hero / Join Section */}
                <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl group border border-white/5">
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/95 via-indigo-900/90 to-blue-900/95 z-10 mix-blend-multiply" />
                        <motion.img
                            src="/images/dashboard-join-bg.png"
                            alt="Join Game"
                            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-[20s] ease-linear"
                            initial={{ scale: 1 }}
                            animate={{ scale: 1.1 }}
                        />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="space-y-8 max-w-xl text-center lg:text-left flex-1">
                            <div className="space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black text-white uppercase tracking-[0.3em] mb-2"
                                >
                                    Combat Ready
                                </motion.div>
                                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">Enter the <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">AptiArena</span></h1>
                                <p className="text-indigo-100/80 text-base sm:text-lg font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                                    Got a battle code? Jump into a live session and showcase your skills against the world.
                                </p>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const pinInput = (e.currentTarget.elements.namedItem('pin') as HTMLInputElement);
                                    if (pinInput.value) router.push(`/play?code=${pinInput.value}`);
                                }}
                                className="flex flex-col sm:flex-row gap-4 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10"
                            >
                                <div className="relative flex-1">
                                    <input
                                        name="pin"
                                        type="text"
                                        placeholder="GAME PIN"
                                        maxLength={6}
                                        className="w-full h-14 rounded-xl bg-white/5 px-6 text-center font-mono text-2xl font-black text-white placeholder-white/20 focus:bg-white/10 focus:outline-none transition-all uppercase tracking-[0.4em]"
                                    />
                                </div>
                                <Button size="lg" type="submit" className="h-14 px-10 bg-white text-indigo-900 hover:bg-gray-100 font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs">
                                    Join Battle <Play className="ml-2 h-4 w-4 fill-current" />
                                </Button>
                            </form>
                        </div>

                        {/* Visual / Image */}
                        <div className="hidden lg:flex items-center justify-center relative shrink-0">
                            <div className="relative w-64 h-64">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                                    transition={{ duration: 6, repeat: Infinity }}
                                    className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-purple-500/20 rounded-full blur-2xl"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Trophy className="h-32 w-32 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transform -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                                </div>

                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                                    className="absolute top-4 right-4 bg-yellow-400 p-3 rounded-2xl shadow-2xl rotate-12"
                                >
                                    <Users className="h-6 w-6 text-yellow-900" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity }}
                                    className="absolute bottom-8 left-0 bg-teal-400 p-3 rounded-2xl shadow-2xl -rotate-12"
                                >
                                    <BookOpen className="h-6 w-6 text-teal-900" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
                            <BookOpen className="h-4 w-4 text-teal" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</div>
                            <p className="text-xs text-muted-foreground">+ new this month</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Participants</CardTitle>
                            <Users className="h-4 w-4 text-gold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalParticipants}</div>
                            <p className="text-xs text-muted-foreground">Across {stats.totalSessions} sessions</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Avg. Engagement</CardTitle>
                            <Trophy className="h-4 w-4 text-teal" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{(stats.totalSessions > 0 ? (stats.totalParticipants / stats.totalSessions).toFixed(1) : 0)}</div>
                            <p className="text-xs text-muted-foreground">Players per session</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Analytics Section (Permanent) */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                                    <Trophy className="text-yellow-500 h-8 w-8" />
                                    Performance Analytics
                                </h2>
                                <p className="text-gray-400 mt-1">Detailed breakdown of your platform usage and activity.</p>
                            </div>
                            <Link href="/dashboard/analytics">
                                <Button variant="outline" className="border-teal/30 text-teal hover:bg-teal/10">
                                    View Full Report
                                </Button>
                            </Link>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Usage Stats */}
                            <Card className="bg-gray-800/50 border-gray-700 hover:border-teal/50 transition-colors">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-teal flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" /> Webpage Usage
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                        <span className="text-gray-400">Account Status</span>
                                        <span className={cn(
                                            "font-medium bg-green-900/20 px-2 py-1 rounded text-xs border border-green-500/20 uppercase",
                                            user?.role === 'host' ? "text-green-400" : "text-blue-400"
                                        )}>
                                            {user?.role || 'User'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                        <span className="text-gray-400">Total Questions Created</span>
                                        <span className="text-white font-bold">{stats.totalQuestions || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                        <span className="text-gray-400">Member Since</span>
                                        <span className="text-gray-300 text-sm">
                                            {memberSince}
                                        </span>
                                    </div>
                                    <div className="space-y-1 pt-2">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Profile Completion</span>
                                            <span>100%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-teal w-full"></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Participation Stats */}
                            <Card className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-purple-400 flex items-center gap-2">
                                        <Users className="h-5 w-5" /> Participation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-900 p-4 rounded-lg text-center border border-gray-700/50">
                                            <div className="text-3xl font-bold text-white mb-1">{stats.joinedQuizzes || 0}</div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wider">Quizzes Joined</div>
                                        </div>
                                        <div className="bg-gray-900 p-4 rounded-lg text-center border border-gray-700/50">
                                            <div className="text-3xl font-bold text-white mb-1">{stats.avgScore !== undefined ? stats.avgScore : "--"}</div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wider">Avg. Score</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                                        <p className="text-sm text-blue-300 text-center italic">
                                            "Join a live game to start building your participation stats!"
                                        </p>
                                    </div>

                                    <div className="space-y-1 pt-2">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Participation Level</span>
                                            <span>
                                                {(stats.joinedQuizzes || 0) >= 20 ? "Legend" :
                                                    (stats.joinedQuizzes || 0) >= 10 ? "Pro" :
                                                        (stats.joinedQuizzes || 0) >= 5 ? "Veteran" :
                                                            (stats.joinedQuizzes || 0) >= 1 ? "Amateur" : "Rookie"}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-1000"
                                                style={{ width: `${Math.min(100, Math.max(5, (stats.joinedQuizzes || 0) * 5))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Quizzes Section (Recent 3) */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-foreground">Recent Quizzes</h2>
                            <Link href="/dashboard/quizzes" className="text-sm text-muted-foreground hover:text-teal underline underline-offset-4">
                                View All
                            </Link>
                        </div>
                        <Link href="/quiz/create">
                            <Button className="bg-teal hover:bg-teal/80 text-primary-foreground">
                                <Plus className="mr-2 h-4 w-4" /> Create New
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500 animate-pulse">Loading quizzes...</div>
                    ) : quizzes.length === 0 ? (
                        <div className="text-center py-12 bg-card/50 rounded-lg border border-border border-dashed">
                            <div className="flex justify-center mb-4"><BookOpen className="h-12 w-12 text-muted-foreground/30" /></div>
                            <p className="text-muted-foreground mb-4">You haven't created any quizzes yet.</p>
                            <Link href="/quiz/create">
                                <Button variant="outline">Create Your First Quiz</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {quizzes.slice(0, 3).map((quiz, index) => (
                                <Card key={quiz._id} className="bg-card border-border hover:border-teal transition group relative overflow-hidden">
                                    <div className="absolute inset-0 z-0">
                                        <div className="absolute inset-0 bg-black/80 z-10" />
                                        <img
                                            src={['/images/dashboard-join-bg.png', '/images/explore-join-bg.png', '/images/home-join-bg.png', '/images/hero-bg.png'][index % 4]}
                                            alt="Card Background"
                                            className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="relative z-10">
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${quiz.difficulty === 'Hard' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                    quiz.difficulty === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                                        'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                                                    {quiz.difficulty}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/quiz/edit/${quiz._id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300">
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="truncate text-foreground text-lg">{quiz.title}</CardTitle>
                                            <CardDescription className="line-clamp-2 text-sm h-10">
                                                {quiz.description || "No description provided."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="mt-auto">
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>{quiz.questions.length} Questions</span>
                                                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground text-xs">
                                                    Code: {quiz.accessCode}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground/60 mt-2">
                                                Created: {new Date(quiz.createdAt).toLocaleDateString()}
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <div className="flex gap-2 w-full">
                                                <Link href={`/host/${quiz._id}`} className="flex-1">
                                                    <Button className="w-full bg-teal/10 text-teal hover:bg-teal hover:text-white border border-teal/20 hover:border-teal transition-all">
                                                        <Play className="mr-2 h-4 w-4" /> Host Live
                                                    </Button>
                                                </Link>
                                                <Link href={`/host/practice/simulate/${quiz._id}`} title="Preview and test quiz logic in a split-view simulation">
                                                    <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white">
                                                        <Monitor className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardFooter>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
