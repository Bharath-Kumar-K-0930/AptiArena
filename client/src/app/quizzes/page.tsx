"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Play, Star, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ExploreQuizzesPage() {
    // Mock public quizzes
    const featuredQuizzes = [
        { id: 1, title: "General Knowledge 2024", description: "Test your awareness of current events and facts.", qCount: 20, plays: 1200, category: "General" },
        { id: 2, title: "JavaScript Basics", description: "Core concepts of JS: Loops, Variables, and Functions.", qCount: 15, plays: 850, category: "Coding" },
        { id: 3, title: "World History Trivia", description: "From Ancient Rome to the Cold War.", qCount: 25, plays: 2300, category: "History" },
        { id: 4, title: "Music Theory 101", description: "Scales, chords, and basic harmony.", qCount: 10, plays: 540, category: "Music" },
        { id: 5, title: "Science & Nature", description: "Physics, Biology, and Chemistry basics.", qCount: 30, plays: 980, category: "Science" },
        { id: 6, title: "Cinema Classics", description: "How well do you know the golden age of film?", qCount: 12, plays: 430, category: "Entertainment" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-teal-400 to-gold bg-clip-text text-transparent">
                        Explore Quizzes
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Discover thousands of quizzes created by the AptiArena community. Play, learn, and challenge yourself.
                    </p>

                    <div className="max-w-md mx-auto relative mt-8">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search topics like 'History' or 'Math'..."
                            className="pl-12 py-6 text-lg bg-card border-border rounded-full shadow-lg focus-visible:ring-teal"
                        />
                    </div>
                </div>

                <div className="max-w-4xl mx-auto mb-16 relative overflow-hidden rounded-2xl p-8 shadow-2xl group">
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-emerald-900/80 z-10 mix-blend-multiply" />
                        <motion.img
                            src="/images/explore-join-bg.png"
                            alt="Join Quiz"
                            className="w-full h-full object-cover opacity-60"
                            initial={{ scale: 1.1, x: 0 }}
                            animate={{ scale: 1, x: -10 }}
                            transition={{ duration: 15, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
                        />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white mb-2">Have a Game Code?</h2>
                            <p className="text-emerald-50">Join a specific live session directly.</p>
                        </div>

                        <div className="flex w-full md:w-auto gap-3">
                            <Input
                                placeholder="ENTER PIN"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono text-center tracking-widest font-bold focus-visible:ring-white h-12 text-lg uppercase"
                                maxLength={6}
                                id="explore-pin-input"
                            />
                            <Button
                                size="lg"
                                className="bg-white text-teal-700 hover:bg-emerald-50 font-bold h-12 px-8"
                                onClick={() => {
                                    const pin = (document.getElementById('explore-pin-input') as HTMLInputElement)?.value;
                                    if (pin) window.location.href = `/play?code=${pin}`;
                                }}
                            >
                                JOIN <Play className="ml-2 h-4 w-4 fill-current" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredQuizzes.map((quiz) => (
                        <Card key={quiz.id} className="bg-card border-border hover:border-teal transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-teal/10 text-teal border border-teal/20">
                                        {quiz.category}
                                    </span>
                                    <div className="flex items-center text-gold text-xs font-medium">
                                        <Star className="h-3 w-3 mr-1 fill-gold" /> 4.8
                                    </div>
                                </div>
                                <CardTitle className="text-xl group-hover:text-teal transition-colors">{quiz.title}</CardTitle>
                                <CardDescription>{quiz.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <BookOpen className="h-4 w-4 mr-2" /> {quiz.qCount} Qs
                                    </div>
                                    <div className="flex items-center">
                                        <Play className="h-4 w-4 mr-2" /> {quiz.plays} plays
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold" disabled>
                                    Play Now (Coming Soon)
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 text-center bg-card/50 p-12 rounded-3xl border border-border">
                    <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
                    <p className="text-muted-foreground mb-8">
                        Use our AI generation tool to create the perfect quiz in seconds.
                    </p>
                    <Link href="/quiz/create">
                        <Button size="lg" className="bg-teal hover:bg-teal/80 text-white px-8">
                            Create Your Own Quiz
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
