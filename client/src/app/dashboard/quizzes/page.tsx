"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Play, Edit, Trash, Search, Filter } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: any[];
    difficulty: string;
    accessCode: string;
    createdAt: string;
}

export default function MyQuizzesPage() {
    const router = useRouter();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchQuizzes = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/my`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setQuizzes(data);
                }
            } catch (error) {
                console.error("Failed to fetch quizzes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, [router]);

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50">
            <Sidebar />

            <main className="flex-1 p-8 space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">My Quizzes</h1>
                        <p className="text-muted-foreground mt-1">Manage and organize your quiz collection</p>
                    </div>
                    <Link href="/quiz/create">
                        <Button className="bg-teal hover:bg-teal/80 text-primary-foreground">
                            <Plus className="mr-2 h-4 w-4" /> Create New Quiz
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search quizzes..."
                            className="pl-9 bg-card border-border"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Placeholder for future filter dropdowns */}
                    {/* <Button variant="outline" className="border-border text-muted-foreground">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button> */}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500 animate-pulse">Loading your library...</div>
                ) : filteredQuizzes.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border border-dashed">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            {searchTerm ? "No matches found" : "No quizzes yet"}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            {searchTerm ? "Try searching for something else." : "Create your first AI-powered quiz now."}
                        </p>
                        {!searchTerm && (
                            <Link href="/quiz/create">
                                <Button variant="outline">Create Quiz</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredQuizzes.map((quiz, index) => (
                            <Card key={quiz._id} className="bg-card border-border hover:border-teal transition group flex flex-col relative overflow-hidden">
                                <div className="absolute inset-0 z-0">
                                    <div className="absolute inset-0 bg-black/80 z-10" />
                                    <img
                                        src={['/images/dashboard-join-bg.png', '/images/explore-join-bg.png', '/images/home-join-bg.png', '/images/hero-bg.png'][index % 4]}
                                        alt="Card Background"
                                        className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${quiz.difficulty === 'Hard' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                quiz.difficulty === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                                    'bg-green-500/10 border-green-500/20 text-green-500'
                                                }`}>
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
                                        <Link href={`/host/${quiz._id}`} className="w-full">
                                            <Button className="w-full bg-teal/10 text-teal hover:bg-teal hover:text-white border border-teal/20 hover:border-teal transition-all">
                                                <Play className="mr-2 h-4 w-4" /> Host Live
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
                }
            </main >
        </div >
    );
}
