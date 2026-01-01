"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Timer, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
    // Mock data for now until we have a real analytics endpoint
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        totalSessions: 0,
        totalParticipants: 0,
        avgAccuracy: 0, // Not yet implemented in backend
        avgTimePerQuestion: 0 // Not yet implemented in backend
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/quizzes/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Failed to fetch stats");
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-background/50">
            <Sidebar />

            <main className="flex-1 p-8 space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                    <p className="text-muted-foreground mt-1">Insights into your quiz performance and engagement</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
                            <TrendingUp className="h-4 w-4 text-teal" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
                            <p className="text-xs text-muted-foreground">+2 this week</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
                            <Users className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.totalParticipants}</div>
                            <p className="text-xs text-muted-foreground">Total across all games</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Accuracy</CardTitle>
                            <Target className="h-4 w-4 text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.avgAccuracy}%</div>
                            <p className="text-xs text-muted-foreground">Class average</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time</CardTitle>
                            <Timer className="h-4 w-4 text-gold" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.avgTimePerQuestion}s</div>
                            <p className="text-xs text-muted-foreground">Per question</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border min-h-[400px] flex items-center justify-center">
                    <div className="text-center space-y-4 max-w-md p-6">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground">Deep Insights Coming Soon</h3>
                        <p className="text-muted-foreground">
                            We're building detailed charts and question-by-question breakdowns.
                            Check back later to see exactly where your students struggle!
                        </p>
                        <Button variant="outline" disabled>View Detailed Report</Button>
                    </div>
                </Card>
            </main>
        </div>
    );
}
